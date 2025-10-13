import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, web3, BN } from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  getAssociatedTokenAddressSync,
  createMint,
  getAccount,
  getMint,
  mintTo,
} from "@solana/spl-token";
import { Uniswapv2 } from "../target/types/uniswapv2";
import { expect } from "chai";

describe("uniswapv2", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.uniswapv2 as Program<Uniswapv2>;

  const initializer = provider.wallet;
  let mintX: PublicKey;
  let mintY: PublicKey;

  // PDAs
  let poolPda: PublicKey;
  let mintLpPda: PublicKey;
  let vaultXPda: PublicKey;
  let vaultYPda: PublicKey;

  let userXPda: PublicKey;
  let userYPda: PublicKey;
  let userLpPda: PublicKey;
  it("Initialize pool", async () => {
    mintX = await createMint(provider.connection, initializer.payer, initializer.publicKey, null, 6);
    mintY = await createMint(provider.connection, initializer.payer, initializer.publicKey, null, 6);
    function sortMints(a: PublicKey, b: PublicKey): [PublicKey, PublicKey] {
      return Buffer.compare(a.toBuffer(), b.toBuffer()) < 0 ? [a, b] : [b, a];
    }

    [mintX, mintY] = sortMints(mintX, mintY);

    [poolPda] = await PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), mintX.toBuffer(), mintY.toBuffer()],
      program.programId
    );

    [mintLpPda] = await PublicKey.findProgramAddressSync(
      [Buffer.from("lp"), poolPda.toBuffer()],
      program.programId
    );


    vaultXPda = getAssociatedTokenAddressSync(mintX, poolPda, true);
    vaultYPda = getAssociatedTokenAddressSync(mintY, poolPda, true);

    await program.methods.initializePool(30, null).accounts({
      initializer: initializer.publicKey,
      mintX: mintX,
      mintY: mintY,
      mintLp: mintLpPda,
      vaultX: vaultXPda,
      vaultY: vaultYPda,
      pool: poolPda,
      systemProgram: SystemProgram.programId,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
    }).signers([]).rpc();

    const pool = await program.account.pool.fetch(poolPda);
    console.log("Pool:", pool);
  });
  it("deposits tokens and mints lp", async () => {
    userXPda = getAssociatedTokenAddressSync(mintX, initializer.publicKey);
    userYPda = getAssociatedTokenAddressSync(mintY, initializer.publicKey);
    userLpPda = getAssociatedTokenAddressSync(mintLpPda, initializer.publicKey);

    await getOrCreateAssociatedTokenAccount(provider.connection, initializer.payer, mintX, initializer.publicKey);
    await getOrCreateAssociatedTokenAccount(provider.connection, initializer.payer, mintY, initializer.publicKey);
    await getOrCreateAssociatedTokenAccount(provider.connection, initializer.payer, mintLpPda, initializer.publicKey);

    await mintTo(provider.connection, initializer.payer, mintX, userXPda, initializer.publicKey, 1000);
    await mintTo(provider.connection, initializer.payer, mintY, userYPda, initializer.publicKey, 1000);

    const amountX = new BN(500);
    const amountY = new BN(100);

    await program.methods.deposit(amountX, amountY).accounts({
      depositor: initializer.publicKey,
      mintX: mintX,
      mintY: mintY,
      mintLp: mintLpPda,
      vaultX: vaultXPda,
      vaultY: vaultYPda,
      depositorLp: userLpPda,
      depositorX: userXPda,
      depositorY: userYPda,
      pool: poolPda,
      systemProgram: SystemProgram.programId,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
    }).signers([]).rpc();

    const userLp = await getAccount(provider.connection, userLpPda);
    console.log("LP minted to user: ", userLp.amount);
  });
  it("swaps tokens", async () => {
    const amountX = new BN(50);
    const min = new BN(1);

    await program.methods.swap(amountX, true, min).accounts({
      user: initializer.publicKey,
      mintX: mintX,
      mintY: mintY,
      pool: poolPda,
      vaultX: vaultXPda,
      vaultY: vaultYPda,
      userX: userXPda,
      userY: userYPda,
      systemProgram: SystemProgram.programId,
      associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
    }).signers([]).rpc();

    const userXPost = await getAccount(provider.connection, userXPda);
    const userYPost = await getAccount(provider.connection, userYPda);

    console.log("User X after swap:", userXPost.amount);
    console.log("User Y after swap:", userYPost.amount);

    expect(Number(userXPost.amount)).to.be.lessThan(500);
  });
  it("withdraws LP and receives tokens", async () => {
    const amountLp = new BN(100);
    const minX = new BN(1);
    const minY = new BN(1);

    await program.methods.withdraw(amountLp, minX, minY).accounts({
      user: initializer.publicKey,
      mintX: mintX,
      mintY: mintY,
      mintLp: mintLpPda,
      vaultX: vaultXPda,
      vaultY: vaultYPda,
      userLp: userLpPda,
      userX: userXPda,
      userY: userYPda,
      pool: poolPda,
      systemProgram: SystemProgram.programId,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
    }).signers([]).rpc();

    const lpFinal = await getAccount(provider.connection, userLpPda);
    const userX = await getAccount(provider.connection, userXPda);
    const userY = await getAccount(provider.connection, userYPda);

    console.log("LP burned. Final lp amount: ", lpFinal.amount);
    console.log("User X: ", userX.amount);
    console.log("UserY:", userY.amount);
  });
});
