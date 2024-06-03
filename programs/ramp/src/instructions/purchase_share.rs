use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke_signed;
use anchor_lang::solana_program::stake;
use anchor_lang::system_program::{
    Transfer,
    transfer
};
use anchor_spl::token::TokenAccount;
use spl_stake_pool::state::StakePool;
use spl_stake_pool::{
    instruction::deposit_sol,
    ID as stake_pool_program_id
};
use crate::{PersonalMarket, RampAccount};
use crate::errors::RampError;
use anchor_spl::stake::Stake;
use anchor_spl::token::{
    Token,
    Mint
};

pub fn purchase_share(
    ctx: Context<PurchaseShare>,
    seller: Pubkey
) -> Result<()> {
    let user = &mut ctx.accounts.user;
    let ramp_user_account = &mut ctx.accounts.ramp_user_account;
    let personal_market = &mut ctx.accounts.personal_market;

    let stake_pool_account = &mut ctx.accounts.stake_pool;
    let stake_pool_data = stake_pool_account.try_borrow_mut_data()?;
    let stake_pool = StakePool::deserialize(&mut stake_pool_data.as_ref())?;

    let withdraw_authority = &mut ctx.accounts.withdraw_authority;
    let stake_reserve = &mut ctx.accounts.stake_reserve;
    let ramp_user_account_lst_vault = &mut ctx.accounts.ramp_user_account_lst_vault;
    let market_currency = &mut ctx.accounts.market_currency;
    let manager_fee_account = &mut ctx.accounts.manager_fee_account;
    let token_program = &mut ctx.accounts.token_program;

    require!(
        stake_pool.pool_mint == market_currency.key(),
        RampError::PoolMintMismatch
    );

    require!(
        stake_pool.manager_fee_account == manager_fee_account.key(),
        RampError::PoolManagerMismatch
    );

    let system_program = &mut ctx.accounts.system_program;
    let stake_pool_program = &mut ctx.accounts.stake_pool_program;

    let price = personal_market.calculate_purchase_price();

    // TODO: Transfer to temporary system-program-owned vault instead of PDA.
    transfer(
        CpiContext::new(
            system_program.to_account_info(), 
            Transfer {
                from: user.to_account_info(),
                to: ramp_user_account.to_account_info()
            }
        ),
        price
    )?;

    let deposit_sol_ix = deposit_sol(
        &stake_pool_program.key(), 
        &stake_pool_account.key(), 
        &withdraw_authority.key(), 
        &stake_reserve.key(), 
        &ramp_user_account.key(),
        &ramp_user_account_lst_vault.key(), 
        &manager_fee_account.key(), 
        &ramp_user_account_lst_vault.key(), 
        &market_currency.key(), 
        &token_program.key(), 
        price
    );

    let signer_seeds = &[
        "user_account".as_bytes(),
        &user.key().to_bytes(),
        &[ctx.bumps.ramp_user_account]
    ];

    invoke_signed(
        &deposit_sol_ix, 
        &[
            stake_pool_program.to_account_info(),
            stake_pool_account.to_account_info(),
            withdraw_authority.to_account_info(),
            stake_reserve.to_account_info(),
            ramp_user_account.to_account_info(),
            ramp_user_account_lst_vault.to_account_info(),
            manager_fee_account.to_account_info(),
            market_currency.to_account_info(),
            token_program.to_account_info(),
        ], 
        &[signer_seeds]
    )?;

    Ok(())
}

#[derive(Accounts)]
#[instruction(
    seller: Pubkey
)]
pub struct PurchaseShare<'info> {
    #[account(
        mut,
    )]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [
            "user_account".as_bytes(),
            &user.key().to_bytes()
        ],
        bump,
    )]
    pub ramp_user_account: Account<'info, RampAccount>,

    #[account(
        mut,
        constraint = ramp_user_account_lst_vault.owner == ramp_user_account.key(),
        constraint = ramp_user_account_lst_vault.mint == market_currency.key()
    )]
    pub ramp_user_account_lst_vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [
            "user_account".as_bytes(),
            &seller.to_bytes()
        ],
        bump,
    )]
    pub seller_user_account: Account<'info, RampAccount>,

    // This can be any existing personal market. No constraints/limitations/etc.
    #[account(
        mut,
    )]
    pub personal_market: Account<'info, PersonalMarket>,

    #[account(
        mut,
        constraint = personal_market.market_currency == market_currency.key()
    )]
    pub market_currency: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [
            &user.key().to_bytes(),
            "personal_stake_pool".as_bytes(),
        ],
        bump,
        owner = stake_pool_program_id
    )]
    pub stake_pool: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [
            stake_pool.key().as_ref(),
            "withdraw".as_bytes()
        ],
        bump,
        seeds::program = stake_pool_program_id
    )]
    pub withdraw_authority: AccountInfo<'info>,

    #[account(
        seeds = [
            &stake_pool.key().to_bytes(),
            "stake_reserve".as_bytes()
        ],
        bump,
        owner = stake_program.key(),
    )]
    pub stake_reserve: AccountInfo<'info>,

    #[account(
        mut
    )]
    pub manager_fee_account: AccountInfo<'info>,

    #[account(
        mut,
        constraint = stake_pool_program.key() == stake_pool_program_id @ RampError::InvalidStakePoolProgram,
    )]
    pub stake_pool_program: AccountInfo<'info>,

    #[account(
        constraint = stake_program.key() == Stake::id() @ RampError::InvalidStakeProgram
    )]
    pub stake_program: Program<'info, Stake>,

    #[account(
        constraint = token_program.key() == Token::id()
    )]
    pub token_program: Program<'info, Token>,

    #[account()]
    pub system_program: Program<'info, System>,
}