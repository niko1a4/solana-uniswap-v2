import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getAnchorClient } from "../utils/anchorClient";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

export const WithdrawPanel = () => {
    const wallet = useWallet();
    const [pool, setPool] = useState("");
    const [lpAmount, setLpAmount] = useState("");
    const [minX, setMinX] = useState("");
    const [minY, setMinY] = useState("");

    const handleWithdraw = async () => {
        if (!wallet.publicKey) return alert("Connect wallet first");
        const { program } = getAnchorClient(wallet as any);

        try {
            const tx = await program.methods
                .withdraw(
                    new anchor.BN(lpAmount),
                    new anchor.BN(minX),
                    new anchor.BN(minY)
                )
                .accounts({
                    pool: new PublicKey(pool),
                    user: wallet.publicKey,
                })
                .rpc();

            alert("Withdraw successful! Tx: " + tx);
        } catch (err) {
            console.error(err);
            alert("Withdraw failed");
        }
    };

    return (
        <div>
            <h3>Withdraw Liquidity</h3>
            <input
                placeholder="Pool Address"
                value={pool}
                onChange={(e) => setPool(e.target.value)}
            />
            <input
                placeholder="LP Amount"
                value={lpAmount}
                onChange={(e) => setLpAmount(e.target.value)}
            />
            <input
                placeholder="Min X"
                value={minX}
                onChange={(e) => setMinX(e.target.value)}
            />
            <input
                placeholder="Min Y"
                value={minY}
                onChange={(e) => setMinY(e.target.value)}
            />
            <button onClick={handleWithdraw}>Withdraw</button>
        </div>
    );
};
