import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { PoolCreator } from "./components/PoolCreator";
import { PoolList } from "./components/PoolList";
import { WalletButton } from "./components/WalletButton";
import { AnchorWalletContext } from "./contexts/AnchorProviderContext";
import { DepositPanel } from "./components/DepositPanel";
import { WithdrawPanel } from "./components/WithdrawPanel";
import { SwapPanel } from "./components/SwapPanel";
import "./styles.css";

function App() {
  return (
    <AnchorWalletContext>
      <Router>
        <div className="navbar">
          <Link to="/">Home</Link>
          <Link to="/pools">Pools</Link>
          <Link to="/swap">Swap</Link>
          <Link to="/deposit">Deposit</Link>
          <Link to="/withdraw">Withdraw</Link>
          <WalletButton />
        </div>
        <Routes>
          <Route path="/" element={<PoolCreator />} />
          <Route path="/pools" element={<PoolList />} />
          <Route path="/deposit" element={<DepositPanel />} />
          <Route path="/withdraw" element={<WithdrawPanel />} />
          <Route path="/swap" element={<SwapPanel />} />
        </Routes>
      </Router>
    </AnchorWalletContext>
  );
}

export default App;
