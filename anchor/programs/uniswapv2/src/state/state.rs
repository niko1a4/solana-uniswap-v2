use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Pool {
    pub authority: Option<Pubkey>, //who can optionally manage this pool
    pub base_fee: u16,             // fee in bps
    pub mint_x: Pubkey,            //mint for token x
    pub mint_y: Pubkey,            //mint for token y
    pub pool_bump: u8,             //pool bump
    pub lp_bump: u8,               //lp bump
}
