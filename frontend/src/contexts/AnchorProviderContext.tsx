import React, { createContext, ReactNode } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";

const rpcUrl = import.meta.env.VITE_RPC_URL!;
const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];

export const AnchorWalletContext: React.FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <ConnectionProvider endpoint={rpcUrl}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};
