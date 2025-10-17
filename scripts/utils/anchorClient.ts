import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import idl from "../../anchor/target/idl/uniswapv2.json";
import { publicKey } from "@coral-xyz/anchor/dist/cjs/utils";
import { Uniswapv2 } from "../../anchor/target/types/uniswapv2";
import * as dotenv from "dotenv";
dotenv.config();

const PROGRAM_ID = new PublicKey("EFFGmkJtDqa5uRpGZApq3LbUfXSSWZCxQjquPLb8F2rU");
const RPC_URL = "https://api.devnet.solana.com";

export function getAnchorClient() {
    const connection = new Connection(RPC_URL, "confirmed");

    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = new anchor.Program<Uniswapv2>(idl as anchor.Idl, provider);
    return { program, provider, connection };
}