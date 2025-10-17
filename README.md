# UniswapV2 on Solana

A decentralized exchange (DEX) inspired by Uniswap V2, built entirely on the Solana blockchain.  
This project includes a fully functional on-chain AMM program written in Anchor, a NestJS backend indexer for tracking events and storing analytics, and a React frontend interface for user interaction.

## Project Structure
solana-uniswap-v2/<br>
├── anchor/ # Anchor smart contract (program)<br>
├── backend/ # NestJS backend (event indexer)<br>
├── frontend/ # React frontend (UI)

## Overview

This DEX implements a Uniswap V2-style constant product AMM with features including:
- Pool initialization for two SPL tokens
- Liquidity deposit and withdrawal
- Token swaps using x*y=k invariant
- LP token minting and burning
- Event emission for InitializePool, Deposit, Withdraw, and Swap
- NestJS backend indexer that listens to on-chain events and stores them in Postgres
- Frontend that interacts with the on-chain program and displays real-time pool data

## 1. Anchor Program
### Tech Stack
- Rust
- Anchor Framework
- Solana Program Library (SPL Token)

### Features
- Initialize pool with two token mints
- Deposit/Withdraw liquidity
- Swap between token pairs
- Constant product math logic (`x * y = k`)
- LP token minting logic (sqrt(x * y) for first deposit, proportional for subsequent ones)
- Event emission for every major action

### Local Development
cd anchor <br>
anchor build <br>
anchor test

The program has already been deployed to devnet: EFFGmkJtDqa5uRpGZApq3LbUfXSSWZCxQjquPLb8F2rU

## 2. NestJS Backend
### Tech Stack
- NestJS
- TypeORM + PostgreSQL
- Anchor Client (`@coral-xyz/anchor`)
- Docker Compose (for Postgres)
- Event DTOs, entities, and listeners

### Purpose
The backend listens for Anchor program events (InitializePool, Deposit, Withdraw, Swap) and stores them in the database.  

### Setup
cd backend
docker compose up -d
npm install
npm run start:dev

#### Example .env
RPC_URL=https://api.devnet.solana.com <br>
PROGRAM_ID=EFFGmkJtDqa5uRpGZApq3LbUfXSSWZCxQjquPLb8F2rU <br>
DATABASE_URL=postgres://postgres:postgres@localhost:5432/uniswap


## 3. React Frontend
### Tech Stack
- React + Vite
- @solana/web3.js
- @project-serum/anchor
- TypeScript
- TailwindCSS

### Features
- Wallet connection (Phantom)
- Pool creation and deposit interface
- Swap UI with price impact calculation
- Real-time data fetching from backend APIs
- Clean, responsive layout


### Setup
cd frontend <br>
npm install <br>
npm run dev

Make sure your `.env` contains backend URL and program ID: <br>
VITE_BACKEND_URL=http://localhost:3000 <br>
VITE_PROGRAM_ID=EFFGmkJtDqa5uRpGZApq3LbUfXSSWZCxQjquPLb8F2rU

## Database Schema

Main entities:
- **Pool** – stores pool address, mints, LP mint, and base fee
- **Token** – tracks each SPL token used in pools
- **PoolEvent** – stores all emitted events for analytics

## Development Workflow

1. **Build & test** the Anchor program.
2. **Run backend** with Postgres via Docker.
3. **Start frontend** and connect wallet to Devnet.
4. Perform transactions on the UI (create pool, deposit, swap).
5. Watch backend indexer log and database update in real-time.

## Scripts
This folder contains one script for testing pool initialization. <br>
To run it: npx ts-node --transpile-only scripts/initializePool.ts

## License

MIT License.  