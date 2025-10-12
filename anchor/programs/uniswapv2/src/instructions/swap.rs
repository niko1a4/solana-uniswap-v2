use crate::{event::SwapEvent, state::Pool};
use anchor_lang::{accounts, prelude::*};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{transfer, Mint, Token, TokenAccount, Transfer},
};
use crate::math::get_amount_out;
use crate::error::CurveError;

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    pub mint_x: Account<'info, Mint>,
    pub mint_y: Account<'info, Mint>,
    #[account(
        mut,
        has_one = mint_x,
        has_one = mint_y,
        seeds = [b"pool" , mint_x.key().as_ref(), mint_y.key().as_ref()],
        bump = pool.pool_bump,
    )]
    pub pool: Account<'info, Pool>,
    #[account(
        mut, 
        associated_token::mint= mint_x,
        associated_token::authority=pool,
    )]
    pub vault_x: Account<'info, TokenAccount>,
    #[account(
        mut, 
        associated_token::mint= mint_y,
        associated_token::authority=pool,
    )]
    pub vault_y: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer= user,
        associated_token::mint = mint_x,
        associated_token::authority= user,
    )]
    pub user_x: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer= user,
        associated_token::mint = mint_y,
        associated_token::authority= user,
    )]
    pub user_y: Account<'info, TokenAccount>,
    pub system_program : Program<'info,System>,
    pub associated_token_program  : Program<'info, AssociatedToken>,
    pub token_program : Program<'info, Token>,
}

impl <'info>Swap<'info>{
    pub fn swap(&mut self, amount: u64, is_x: bool, min: u64)-> Result<()>{
        require!(amount>0 , CurveError::ZeroAmount);
        let (token_in, token_out)= match is_x {
            true => (self.mint_x.key(), self.mint_y.key()),
            false=> (self.mint_y.key(), self.mint_x.key()),
        };
        let (reserve_in, reserve_out) = match  is_x {
            true => (self.vault_x.amount, self.vault_y.amount),
            false => (self.vault_y.amount, self.vault_x.amount),
        };
        
        let fee_bps = self.pool.base_fee;
        let amount_out = get_amount_out(amount, reserve_in, reserve_out, fee_bps)?;
        require!(amount_out >= min, CurveError::SlippageLimitExceeded);

        self.deposit_tokens(amount, is_x)?;
        self.withdraw_tokens(amount_out, !is_x)?;

        emit!(SwapEvent{
            user: self.user.key(),
            pool: self.pool.key(),
            token_in: token_in,
            token_out: token_out,
            amount_in: amount,
            amount_out:amount_out,
        });
        Ok(())
    }
    fn deposit_tokens(&mut self, amount: u64, is_x: bool)-> Result<()>{
        let (from, to) = match is_x {
            true=> (self.user_x.to_account_info(),self.vault_x.to_account_info()),
            false=> (self.user_y.to_account_info(), self.vault_y.to_account_info()),
        };
        let token_program = self.token_program.to_account_info();
        let accounts = Transfer{
            from: from,
            to: to,
            authority: self.user.to_account_info(),
        };
        let cpi_ctx =CpiContext::new(token_program, accounts);
        transfer(cpi_ctx, amount)?;
        Ok(())
    }
    fn withdraw_tokens(&mut self, amount: u64, is_x: bool)->Result<()>{
        let (from, to) = match is_x {
            true=> (self.vault_x.to_account_info(),self.user_x.to_account_info()),
            false=> (self.vault_y.to_account_info(), self.user_y.to_account_info()),
        };
        let token_program = self.token_program.to_account_info();
        let accounts = Transfer{
            from: from,
            to: to,
            authority: self.pool.to_account_info(),
        };
        let mint_x_key = self.mint_x.key();
        let mint_y_key= self.mint_y.key();
        let seeds= [
            &b"pool"[..],
            mint_x_key.as_ref(),
            mint_y_key.as_ref(),
            &[self.pool.pool_bump],
        ];
        let signer_seeds = &[&seeds[..]];
        let cpi_ctx = CpiContext::new_with_signer(token_program, accounts, signer_seeds);
        transfer(cpi_ctx, amount)?;
        Ok(())
    }
}