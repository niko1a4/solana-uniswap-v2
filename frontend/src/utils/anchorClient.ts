import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import idl from "../../../anchor/target/idl/uniswapv2.json";

const rpcUrl = import.meta.env.VITE_RPC_URL!;
const programId = new PublicKey(import.meta.env.VITE_PROGRAM_ID!);

export const getAnchorClient = (wallet: anchor.Wallet) => {
    const connection = new Connection(rpcUrl, "confirmed");
    const provider = new anchor.AnchorProvider(connection, wallet, {
        commitment: "confirmed",
    });
    const program = new anchor.Program(idl as anchor.Idl, provider);
    return { program, provider, connection };
};
