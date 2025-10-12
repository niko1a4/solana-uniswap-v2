use anchor_lang::{accounts::account, prelude::*};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{burn, transfer, Burn, Mint, Token, TokenAccount, Transfer},
};

use crate::state::Pool;
use crate::error::CurveError;
use crate::math::*;
use crate::event::WithdrawEvent;
#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    pub mint_x: Account<'info, Mint>,
    pub mint_y: Account<'info, Mint>,
    #[account(
        mut,
        seeds = [b"lp", pool.key().as_ref()],
        bump= pool.lp_bump,
    )]
    pub mint_lp: Account<'info, Mint>,
    #[account(
        mut,
        associated_token::mint= mint_x,
        associated_token::authority = pool,
    )]
    pub vault_x: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint =mint_y,
        associated_token::authority= pool,
    )]
    pub vault_y: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = mint_lp,
        associated_token::authority = user,
    )]
    pub user_lp: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint= mint_x,
        associated_token::authority= user,
    )]
    pub user_x: Account<'info, TokenAccount>,
    #[account(
        mut, 
        associated_token::mint = mint_y,
        associated_token::authority= user,
    )]
    pub user_y: Account<'info, TokenAccount>,
    #[account(
        has_one = mint_x,
        has_one= mint_y,
        seeds= [b"pool", mint_x.key().as_ref(), mint_y.key().as_ref()],
        bump= pool.pool_bump,
    )]
    pub pool: Account<'info, Pool>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl <'info> Withdraw<'info>{
    pub fn withdraw(&mut self, lp_amount:u64, min_x: u64, min_y: u64)->Result<()>{
        require!(lp_amount>0, CurveError::ZeroAmount);
        require!(min_x>0 && min_y>0, CurveError::ZeroAmount);
        let reserve_x = self.vault_x.amount;
        let reserve_y= self.vault_y.amount;
        let total_supply = self.mint_lp.supply;
        
        let (amount_x, amount_y)= remove_liquidity(lp_amount, total_supply, reserve_x, reserve_y)?;
        require!(amount_x>=min_x, CurveError::SlippageLimitExceeded);
        require!(amount_y>=min_y, CurveError::SlippageLimitExceeded);

        self.burn_lp_tokens(lp_amount)?;
        self.withdraw_tokens(amount_x, true)?;
        self.withdraw_tokens(amount_y, false)?;

        emit!(WithdrawEvent{
            user: self.user.key(),
            pool: self.pool.key(),
            lp_burned: lp_amount,
            amount_x: amount_x,
            amount_y: amount_y,
        });
        Ok(())
    }
    fn withdraw_tokens(&mut self, amount: u64, is_x:bool)->Result<()>{
        let (from, to) = match is_x {
            true => (self.vault_x.to_account_info(), self.user_x.to_account_info()),
            false=> (self.vault_y.to_account_info(), self.user_y.to_account_info()),
        };
        let token_program = self.token_program.to_account_info();
        let accounts=  Transfer{
            from: from,
            to: to,
            authority: self.pool.to_account_info(),
        };
         let mint_x_key = self.mint_x.key();
        let mint_y_key = self.mint_y.key();
        let seeds=&[
            &b"pool"[..],
            mint_x_key.as_ref(),
            mint_y_key.as_ref(),
            &[self.pool.pool_bump]
        ];
        let signer_seeds=&[&seeds[..]];
        let cpi_ctx= CpiContext::new_with_signer(token_program, accounts, signer_seeds);
        transfer(cpi_ctx, amount)?;
        Ok(())
    }
    fn burn_lp_tokens(&mut self, amount:u64)->Result<()>{
        let token_program = self.token_program.to_account_info();
        let accounts= Burn{
            mint: self.mint_lp.to_account_info(),
            from: self.user_lp.to_account_info(),
            authority:self.user.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(token_program, accounts);
        burn(cpi_ctx, amount)?;
        Ok(())
    }
}
