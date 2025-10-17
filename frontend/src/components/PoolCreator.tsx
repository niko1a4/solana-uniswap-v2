import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getAnchorClient } from "../utils/anchorClient";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Buffer } from "buffer";

function sortMints(a: PublicKey, b: PublicKey): [PublicKey, PublicKey] {
    return Buffer.compare(a.toBuffer(), b.toBuffer()) < 0 ? [a, b] : [b, a];
}

export const PoolCreator = () => {
    const wallet = useWallet();
    const [mintX, setMintX] = useState("");
    const [mintY, setMintY] = useState("");
    const [baseFee, setBaseFee] = useState("30");
    const [authority, setAuthority] = useState("");

    const handleCreate = async () => {
        if (!wallet.publicKey) return alert("Connect wallet first");
        if (!mintX || !mintY) return alert("Enter both mint addresses");

        const { program, provider } = getAnchorClient(wallet as any);
        const mintXKey = new PublicKey(mintX);
        const mintYKey = new PublicKey(mintY);

        // Sortiranje mintova kao u skripti
        const [mintXSorted, mintYSorted] = sortMints(mintXKey, mintYKey);

        // Izračunaj sve PDA-ove
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

        try {
            const authorityKey = authority ? new PublicKey(authority) : null;

            const tx = await program.methods
                .initializePool(Number(baseFee), authorityKey)
                .accounts({
                    initializer: wallet.publicKey,
                    mintX: mintXSorted,
                    mintY: mintYSorted,
                    mintLp: lpMintPda,
                    vaultX,
                    vaultY,
                    pool: poolPda,
                    systemProgram: anchor.web3.SystemProgram.programId,
                    tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
                    associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
                })
                .rpc();

            alert(`Pool created! Tx: ${tx}`);
        } catch (err) {
            console.error(err);
            alert("Error creating pool");
        }
    };

    return (
        <div>
            <h3>Create Pool</h3>
            <input
                placeholder="Mint X address"
                value={mintX}
                onChange={(e) => setMintX(e.target.value)}
            />
            <input
                placeholder="Mint Y address"
                value={mintY}
                onChange={(e) => setMintY(e.target.value)}
            />
            <input
                placeholder="Base Fee (u16)"
                value={baseFee}
                onChange={(e) => setBaseFee(e.target.value)}
            />
            <input
                placeholder="Authority (optional)"
                value={authority}
                onChange={(e) => setAuthority(e.target.value)}
            />
            <button onClick={handleCreate}>Create Pool</button>
        </div>
    );
};
