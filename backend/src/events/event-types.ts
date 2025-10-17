export type PubkeyStr = string;

export interface InitializePoolDTO {
    eventType: 'InitializePool';
    pool: PubkeyStr;
    mint_x: PubkeyStr;
    mint_y: PubkeyStr;
    lp_mint: PubkeyStr;
    base_fee: number;        // u16 on-chain, number in TS
    authority: PubkeyStr | null; // Option<Pubkey>
}

export interface DepositDTO {
    eventType: 'Deposit';
    pool: PubkeyStr;
    depositor: PubkeyStr;
    amount_x: string | number;
    amount_y: string | number;
    lp_minted: string | number;
}

export interface WithdrawDTO {
    eventType: 'Withdraw';
    pool: PubkeyStr;
    user: PubkeyStr;
    lp_burned: string | number;
    amount_x: string | number;
    amount_y: string | number;
}

export interface SwapDTO {
    eventType: 'Swap';
    pool: PubkeyStr;
    user: PubkeyStr;
    token_in: PubkeyStr;
    token_out: PubkeyStr;
    amount_in: string | number;
    amount_out: string | number;
}

export type AnyPoolEventDTO = InitializePoolDTO | DepositDTO | WithdrawDTO | SwapDTO;