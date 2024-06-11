use anchor_lang::prelude::*;
use anchor_spl::token::Mint;
use crate::states::{
    RampProtocol,
    StakePool
};
use crate::errors::RampError;

pub fn initialize_ramp(
    ctx: Context<InitializeRamp>
) -> Result<()> {
    let admin = &mut ctx.accounts.admin;
    let ramp = &mut ctx.accounts.ramp;
    let default_lst = &mut ctx.accounts.default_lst;
    let default_stake_pool = &mut ctx.accounts.default_stake_pool;

    require!(
        default_stake_pool.pool_mint == default_lst.key(),
        RampError::StakePoolMintMismatch
    );

    ramp.admin = admin.key();
    ramp.default_currency = default_lst.key();
    ramp.default_stake_pool = default_stake_pool.key();
    ramp.index = 0;

    msg!("Admin: {}", ramp.admin.key().to_string());

    Ok(())
}

#[derive(Accounts)]
pub struct InitializeRamp<'info> {
    #[account(
        mut
    )]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        seeds = [
            "ramp".as_bytes()
        ],
        bump,
        space = 8 + 8 + (3 * 32)
    )]
    pub ramp: Account<'info, RampProtocol>,

    #[account(
        mut
    )]
    pub default_stake_pool: Account<'info, StakePool>,

    #[account(
        mut
    )]
    pub default_lst: Account<'info, Mint>,

    pub system_program: Program<'info, System>,
}