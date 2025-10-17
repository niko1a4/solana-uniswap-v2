import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getAnchorClient } from "../utils/anchorClient";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

export const DepositPanel = () => {
    const wallet = useWallet();
    const [pool, setPool] = useState("");
    const [amountX, setAmountX] = useState("");
    const [amountY, setAmountY] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleDeposit = async () => {
        if (isLoading) return;
        if (!wallet.publicKey) return alert("Connect wallet first");
        if (!pool) return alert("Enter pool address");
        if (!amountX || !amountY) return alert("Enter both amounts");

        setIsLoading(true);
        const { program } = getAnchorClient(wallet as any);

        try {
            console.log("=== DEPOSIT START ===");
            console.log("Wallet:", wallet.publicKey.toBase58());
            console.log("Pool:", pool);
            console.log("Amount X:", amountX, "Amount Y:", amountY);

            // simulate first, to see logs before actual tx
            console.log("Simulating transaction...");
            const sim = await program.methods
                .deposit(new anchor.BN(amountX), new anchor.BN(amountY))
                .accounts({
                    pool: new PublicKey(pool),
                    user: wallet.publicKey,
                })
                .simulate();

            console.log("Simulation logs:", sim);


            console.log("Sending real transaction...");
            const tx = await program.methods
                .deposit(new anchor.BN(amountX), new anchor.BN(amountY))
                .accounts({
                    pool: new PublicKey(pool),
                    user: wallet.publicKey,
                })
                .rpc();

            console.log("Deposit successful! Tx signature:", tx);
            alert("Deposit successful! Tx: " + tx);
        } catch (err: any) {
            console.error("=== DEPOSIT ERROR ===");
            if (err.logs) console.error("Anchor logs:", err.logs);
            else if (err.simulationResponse) console.error("Simulation response:", err.simulationResponse);
            else console.error("Full error:", err);

            alert("Deposit failed. Check console for logs.");
        } finally {
            setIsLoading(false);
            console.log("=== DEPOSIT END ===");
        }
    };

    return (
        <div>
            <h3>Deposit Liquidity</h3>
            <input
                placeholder="Pool Address"
                value={pool}
                onChange={(e) => setPool(e.target.value)}
            />
            <input
                placeholder="Amount X"
                value={amountX}
                onChange={(e) => setAmountX(e.target.value)}
            />
            <input
                placeholder="Amount Y"
                value={amountY}
                onChange={(e) => setAmountY(e.target.value)}
            />
            <button onClick={handleDeposit} disabled={isLoading}>
                {isLoading ? "Processing..." : "Deposit"}
            </button>
        </div>
    );
};
