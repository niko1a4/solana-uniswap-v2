import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { getAnchorClient } from "../utils/anchorClient";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

export const SwapPanel = () => {
    const wallet = useWallet();
    const [pool, setPool] = useState("");
    const [amount, setAmount] = useState("");
    const [isX, setIsX] = useState(true);
    const [min, setMin] = useState("");

    const handleSwap = async () => {
        if (!wallet.publicKey) return alert("Connect wallet first");
        const { program } = getAnchorClient(wallet as any);

        try {
            const tx = await program.methods
                .swap(new anchor.BN(amount), isX, new anchor.BN(min))
                .accounts({
                    pool: new PublicKey(pool),
                    user: wallet.publicKey,
                })
                .rpc();

            alert("Swap successful! Tx: " + tx);
        } catch (err) {
            console.error(err);
            alert("Swap failed");
        }
    };

    return (
        <div>
            <h3>Swap Tokens</h3>
            <input
                placeholder="Pool Address"
                value={pool}
                onChange={(e) => setPool(e.target.value)}
            />
            <input
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
            />
            <input
                placeholder="Min Output"
                value={min}
                onChange={(e) => setMin(e.target.value)}
            />
            <div>
                <label>
                    <input
                        type="checkbox"
                        checked={isX}
                        onChange={(e) => setIsX(e.target.checked)}
                    />
                    Swap from X to Y
                </label>
            </div>
            <button onClick={handleSwap}>Swap</button>
        </div>
    );
};
