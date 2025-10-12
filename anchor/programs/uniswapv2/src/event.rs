use anchor_lang::prelude::*;

#[event]
pub struct DepositEvent {
    pub depositor: Pubkey,
    pub pool: Pubkey,
    pub amount_x: u64,
    pub amount_y: u64,
    pub lp_minted: u64,
}

#[event]
pub struct WithdrawEvent {
    pub user: Pubkey,
    pub pool: Pubkey,
    pub lp_burned: u64,
    pub amount_x: u64,
    pub amount_y: u64,
}

#[event]
pub struct SwapEvent {
    pub user: Pubkey,
    pub pool: Pubkey,
    pub token_in: Pubkey,
    pub token_out: Pubkey,
    pub amount_in: u64,
    pub amount_out: u64,
}
