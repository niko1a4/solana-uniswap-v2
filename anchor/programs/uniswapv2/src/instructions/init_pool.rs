use crate::state::Pool;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};
use crate::error::PoolError;
#[derive(Accounts)]
pub struct InitializePool<'info> {
    #[account(mut)]
    pub initializer: Signer<'info>,
    pub mint_x: Account<'info, Mint>,
    pub mint_y: Account<'info, Mint>,
    #[account(
        init, 
        payer= initializer,
        seeds = [b"lp", pool.key().as_ref()],
        bump,
        mint::decimals= 6,
        mint::authority=pool,
    )]
    pub mint_lp: Account<'info,Mint>,
    #[account(
        init,
        payer = initializer,
        associated_token::mint= mint_x,
        associated_token::authority = pool,
    )]
    pub vault_x: Account<'info, TokenAccount>,
    #[account(
        init, 
        payer= initializer,
        associated_token::mint =mint_y,
        associated_token::authority= pool,
    )]
    pub vault_y: Account<'info, TokenAccount>,
    #[account(
        init,
        payer =  initializer,
        seeds= [b"pool", mint_x.key().as_ref(), mint_y.key().as_ref()],
        bump,
        space = 8 + Pool::INIT_SPACE,
    )]
    pub pool: Account<'info, Pool>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl <'info> InitializePool <'info>{
    pub fn init_pool(&mut self,base_fee: u16, authority: Option<Pubkey>, bumps: &InitializePoolBumps)-> Result<()>{
        require!(self.mint_x.key().to_bytes()<self.mint_y.key().to_bytes(), PoolError::UnsortedMints);
        self.pool.set_inner(Pool {
            authority,
            base_fee,
            mint_x: self.mint_x.key(),
            mint_y: self.mint_y.key(),
            pool_bump: bumps.pool,
            lp_bump: bumps.mint_lp,
        });
        Ok(())
    }
}
