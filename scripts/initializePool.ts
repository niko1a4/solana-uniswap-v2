import * as anchor from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getAnchorClient } from "./utils/anchorClient";
import { Buffer } from "buffer";


function sortMints(a: anchor.web3.PublicKey, b: anchor.web3.PublicKey): [anchor.web3.PublicKey, anchor.web3.PublicKey] {
    return Buffer.compare(a.toBuffer(), b.toBuffer()) < 0 ? [a, b] : [b, a];
}
(async () => {
    const { program, provider, connection } = getAnchorClient();

    const mintX = new PublicKey("3cZSGM6J8Fuu7RFWWoJDjd7dmr6cWoKHfLoNQ6deAM9d");
    const mintY = new PublicKey("H2shcGqZmLhzyL7Re4xzxE6h6yo4FaouYGSxK1cN15zK");
    const baseFee = 30;

    let [mintXSorted, mintYSorted] = sortMints(mintX, mintY);

    const [poolPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("pool"), mintXSorted.toBuffer(), mintYSorted.toBuffer()],
        program.programId
    );

    const [lpMintPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("lp"), poolPda.toBuffer()],
        program.programId
    );

    const vaultX = await anchor.utils.token.associatedAddress({
        mint: mintXSorted,
        owner: poolPda,
    });

    const vaultY = await anchor.utils.token.associatedAddress({
        mint: mintYSorted,
        owner: poolPda,
    });

    console.log("Pool PDA:", poolPda.toBase58());
    console.log("LP Mint PDA:", lpMintPda.toBase58());
    console.log("Vault X:", vaultX.toBase58());
    console.log("Vault Y:", vaultY.toBase58());

    const tx = await program.methods.initializePool(baseFee, null).
        // @ts-ignore
        accounts({
            initializer: provider.wallet.publicKey,
            mintX: mintXSorted,
            mintY: mintYSorted,
            mintLp: lpMintPda,
            vaultX: vaultX,
            vaultY: vaultY,
            pool: poolPda,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
            associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
        }).signers([]).rpc();

    console.log(` Transaction confirmed. Signature: ${tx}`);
})();