use anchor_lang::{prelude::*, solana_program::program::invoke_signed};
use spl_stake_pool::{
    find_withdraw_authority_program_address, instruction::{
        create_token_metadata, 
        initialize
    }, 
    state::{Fee, ValidatorList}, 
    ID as stake_pool_program_id
};
use crate::states::*;
use anchor_spl::{
    token::{
        Token,
        Mint
    },
    stake::Stake
};
use anchor_lang::solana_program::stake;
use crate::errors::RampError;

const MAX_VALIDATORS: u32 = 32;

pub fn create_personal_lst(
    ctx: Context<CreatePersonalLst>,
) -> Result<()> {
    let user = &mut ctx.accounts.user;
    let stake_pool_program = &mut ctx.accounts.stake_pool_program;
    let stake_pool = &mut ctx.accounts.stake_pool;
    let ramp_user_account = &mut ctx.accounts.ramp_user_account;
    let validator_list = &mut ctx.accounts.validator_list;
    let stake_reserve = &mut ctx.accounts.stake_reserve;
    let personal_lst_mint = &mut ctx.accounts.personal_lst_mint;
    let manager_pool_account = &mut ctx.accounts.manager_pool_account;
    let token_program = &mut ctx.accounts.token_program;

    let withdraw_authority = &mut ctx.accounts.withdraw_authority;
    let (rederived_withdraw_authority, _) = find_withdraw_authority_program_address(
        &stake_pool_program_id,
        &stake_pool.key()
    );

    require!(
        withdraw_authority.key() == rederived_withdraw_authority,
        RampError::InvalidWithdrawAuthority
    );

    let initialize_stake_reserve_ix = stake::instruction::initialize(
        &stake_reserve.key(),
        &stake::state::Authorized {
            staker: withdraw_authority.key(),
            withdrawer: withdraw_authority.key()
        },
        &stake::state::Lockup::default()
    );

    let fee = Fee {
        denominator: 0,
        numerator: 0,
    };

    let initialize_stake_pool_ix = initialize(
        stake_pool_program.key,
        stake_pool.key,
        &ramp_user_account.key(),
        &ramp_user_account.key(),
        &ramp_user_account.key(),
        &validator_list.key(),
        &stake_reserve.key(),
        &personal_lst_mint.key(),
        &manager_pool_account.key(),
        &token_program.key(),
        None,
        fee,
        fee,
        fee,
        0,
        MAX_VALIDATORS
    );

    let signer_seeds = &[
        &ramp_user_account.id.to_le_bytes(),
        "".as_bytes(),
        &[ctx.bumps.ramp_user_account]
    ];

    invoke_signed(
        &initialize_stake_pool_ix, 
        &[
            stake_pool_program.to_owned(),
            stake_pool.to_owned(),
            ramp_user_account.to_account_info(),
            validator_list.to_owned(),
            stake_reserve.to_owned(),
            personal_lst_mint.to_owned(),
            manager_pool_account.to_owned(),
            token_program.to_account_info()
        ], 
        &[signer_seeds]
    )?;

    Ok(())
}

#[derive(Accounts)]
pub struct CreatePersonalLst<'info> {
    #[account(
        mut,
    )]
    pub user: Signer<'info>,

    #[account(
        mut,
        constraint = stake_pool_program.key() == stake_pool_program_id @ RampError::InvalidStakePoolProgram,
    )]
    pub stake_pool_program: AccountInfo<'info>,

    #[account(
        mut,
        constraint = stake_program.key() == Stake::id() @ RampError::InvalidStakeProgram
    )]
    pub stake_program: Program<'info, Stake>,
    
    #[account(
        mut,
    )]
    pub stake_pool: AccountInfo<'info>,

    #[account(
        mut
    )]
    pub withdraw_authority: AccountInfo<'info>,

    #[account(
        init,
        payer = user,
        space = 8 + 4 + 1 + 4 + (32 * (73)), // max 32 validators
        owner = stake_pool_program_id,
        seeds = [
            &stake_pool.key().to_bytes(),
            "ramp_val_list".as_bytes()
        ],
        bump,
    )]
    pub validator_list: AccountInfo<'info>,

    // Initialize stake reserve account. Transfer ownership to stake program.
    #[account(
        init,
        payer = user,
        space = 200,
        owner = stake_program.key(),
    )]
    pub stake_reserve: AccountInfo<'info>,

    // TODO: Checks. Make sure token authorities are stake pools.
    #[account(
        mut,

        // Make sure there are no pre-minted tokens
        constraint = personal_lst_mint.supply == 0 @ RampError::LstPreMinted,

        // Make sure decimals are 9. SOL decimals = LST decimals.
        constraint = personal_lst_mint.decimals == 9 @ RampError::InvalidLstDecimals,

        // Make sure there is no freeze authority.
        constraint = personal_lst_mint.freeze_authority.is_none() @ RampError::InvalidLstAuthority,

        constraint = personal_lst_mint.mint_authority.is_some() && personal_lst_mint.mint_authority.unwrap() == withdraw_authority.key() @ RampError::InvalidLstAuthority,
    )]
    pub personal_lst_mint: Account<'info, Mint>,

    #[account(
        mut
    )]
    pub manager_pool_account: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [],
        bump
    )]
    pub ramp_user_account: Account<'info, RampAccount>,

    #[account(
        mut
    )]
    pub token_program: Program<'info, Token>,

    #[account(
        mut
    )]
    pub system_program: Program<'info, System>,
}