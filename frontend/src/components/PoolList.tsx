import React, { useEffect, useState } from "react";
import { getAnchorClient } from "../utils/anchorClient";

export const PoolList = () => {
    const [pools, setPools] = useState<any[]>([]);

    useEffect(() => {
        (async () => {
            try {
                const { program } = getAnchorClient({} as any);
                const allPools = await (program.account as any).pool.all();
                setPools(allPools);
            } catch (e) {
                console.error("Failed to fetch pools", e);
            }
        })();
    }, []);

    return (
        <div>
            <h3>Existing Pools</h3>
            <ul>
                {pools.map((p, i) => (
                    <li key={i}>{p.publicKey.toBase58()}</li>
                ))}
            </ul>
        </div>
    );
};
