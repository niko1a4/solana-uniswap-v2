use crate::{math::*, state::Pool};
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{transfer, Mint, Token, TokenAccount, Transfer, mint_to, MintTo},
};
use crate::error::CurveError;
use crate::event::DepositEvent;
#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,
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
        init_if_needed,
        payer = depositor,
        associated_token::mint = mint_lp,
        associated_token::authority = depositor,
    )]
    pub depositor_lp: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint= mint_x,
        associated_token::authority= depositor,
    )]
    pub depositor_x: Account<'info, TokenAccount>,
    #[account(
        mut, 
        associated_token::mint = mint_y,
        associated_token::authority= depositor,
    )]
    pub depositor_y: Account<'info, TokenAccount>,
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

impl <'info> Deposit<'info>{

    fn helper(&mut self, amount_x: u64, amount_y: u64)-> Result<(u64,u64)>{
        let reserve_x = self.vault_x.amount;
        let reserve_y= self.vault_y.amount;

        //if pool is empty on both sides
        if reserve_x==0 && reserve_y==0{
            return Ok((amount_x,amount_y));
        }

        //normal scenario: pool has liquidity on both sides -> match against lower side
        let amount_y_optimal= quote(amount_x, reserve_x, reserve_y)?;
        if amount_y_optimal<= amount_y{
            // Y oversupplied -> trust X
            Ok((amount_x,amount_y_optimal))
        } else{
            // Y undersupplied -> trust Y
            let amount_x_optimal= quote(amount_y, reserve_y, reserve_x)?;
            Ok((amount_x_optimal, amount_y))
        }
    }
    pub fn deposit_tokens(&mut self, amount_x: u64,amount_y: u64 )-> Result<()>{
        require!(amount_x > 0 && amount_y > 0, CurveError::ZeroAmount);
        let reserve_x_before= self.vault_x.amount;
        let reserve_y_before = self.vault_y.amount;
        let token_program  = self.token_program.to_account_info();
        let (amount_x, amount_y) = self.helper(amount_x, amount_y)?;

        //transfer X token
        {
            let accounts = Transfer{
                from: self.depositor_x.to_account_info(),
                to: self.vault_x.to_account_info(),
                authority: self.depositor.to_account_info(),
            };
            let cpi_ctx = CpiContext::new(token_program.clone(), accounts);
            transfer(cpi_ctx, amount_x)?;
        }
        //transfer Y token
        {
            let accounts = Transfer{
                from: self.depositor_y.to_account_info(),
                to: self.vault_y.to_account_info(),
                authority: self.depositor.to_account_info()
            };
            let cpi_ctx = CpiContext::new(token_program, accounts);
            transfer(cpi_ctx, amount_y)?;
            self.mint_lp(amount_x,amount_y, reserve_x_before, reserve_y_before)?;
        }
        
        Ok(())
    }
     fn mint_lp(&mut self, amount_x: u64, amount_y: u64, reserve_x: u64, reserve_y: u64 )-> Result<()>{
        let total_supply= self.mint_lp.supply;
        let lp_to_mint = calculate_lp_mint_amount(amount_x,amount_y,reserve_x,reserve_y,total_supply)?;

        let token_program = self.token_program.to_account_info();
        let accounts = MintTo{
            mint: self.mint_lp.to_account_info(),
            to: self.depositor_lp.to_account_info(),
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
        let cpi_ctx = CpiContext::new_with_signer(token_program, accounts, signer_seeds);
        mint_to(cpi_ctx, lp_to_mint)?;
        emit!(DepositEvent {
        depositor: self.depositor.key(),
        pool: self.pool.key(),
        amount_x,
        amount_y,
        lp_minted: lp_to_mint,
    });
        Ok(())
    }
}
