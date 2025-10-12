#![allow(deprecated)]
use anchor_lang::prelude::*;

declare_id!("EFFGmkJtDqa5uRpGZApq3LbUfXSSWZCxQjquPLb8F2rU");
pub mod error;
pub mod event;
pub mod instructions;
pub use instructions::*;
pub mod math;
pub mod state;
#[program]
pub mod uniswapv2 {
    use crate::instructions::InitializePool;

    use super::*;

    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        base_fee: u16,
        authority: Option<Pubkey>,
    ) -> Result<()> {
        ctx.accounts.init_pool(base_fee, authority, &ctx.bumps)?;
        Ok(())
    }
    pub fn deposit(ctx: Context<Deposit>, amount_x: u64, amount_y: u64) -> Result<()> {
        ctx.accounts.deposit_tokens(amount_x, amount_y)?;
        Ok(())
    }
    pub fn withdraw(ctx: Context<Withdraw>, lp_amount: u64, min_x: u64, min_y: u64) -> Result<()> {
        ctx.accounts.withdraw(lp_amount, min_x, min_y)?;
        Ok(())
    }

    pub fn swap(ctx: Context<Swap>, amount: u64, is_x: bool, min: u64) -> Result<()> {
        ctx.accounts.swap(amount, is_x, min)?;
        Ok(())
    }
}
