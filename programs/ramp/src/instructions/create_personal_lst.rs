use anchor_lang::{prelude::*, solana_program::program::{invoke, invoke_signed}};
use spl_stake_pool::{
    find_withdraw_authority_program_address, 
    find_deposit_authority_program_address,
    inline_mpl_token_metadata::pda::find_metadata_account,
    instruction::{
        initialize,
        create_token_metadata
    },
    state::{
        Fee, 
        ValidatorList,
        StakePool
    },
    ID as stake_pool_program_id
};
use crate::states::*;
use anchor_spl::{
    stake::{
        Stake,
        StakeAccount
    }, 
    token::{
        Mint, Token, TokenAccount
    }
};
use anchor_lang::solana_program::{
    stake,
    stake::state::StakeStateV2
};
use crate::errors::RampError;
use mpl_token_metadata::{
    accounts::Metadata, 
    ID as metadata_program_id
};

const MAX_VALIDATORS: u32 = 8;

pub fn create_personal_lst(
    ctx: Context<CreatePersonalLst>,
    lst_name: String,
    lst_symbol: String,
    lst_metadata_uri: String,
) -> Result<()> {
    let user = &mut ctx.accounts.user;
    let stake_program = &mut ctx.accounts.stake_program;
    let stake_pool_program = &mut ctx.accounts.stake_pool_program;
    let stake_pool = &mut ctx.accounts.stake_pool;
    let ramp_user_account = &mut ctx.accounts.ramp_user_account;
    let personal_market = &mut ctx.accounts.personal_market;
    let stake_reserve = &mut ctx.accounts.stake_reserve;
    let validator_list = &mut ctx.accounts.validator_list;
    let personal_lst_mint = &mut ctx.accounts.personal_lst_mint;
    let manager_pool_account = &mut ctx.accounts.manager_pool_account;
    let token_program = &mut ctx.accounts.token_program;
    let withdraw_authority = &mut ctx.accounts.withdraw_authority;
    let personal_lst_metadata = &mut ctx.accounts.personal_lst_metadata;
    let rent = &mut ctx.accounts.rent;
    let metadata_program = &mut ctx.accounts.metaplex_program;

    // require!(
    //     ctx.remaining_accounts.len() == 1,
    //     RampError::InvalidRemainingAccountsSchema
    // );
    // let validator_list_account_info = ctx.remaining_accounts[0];
    // let validator_list_data = validator_list_account_info.try_borrow_mut_data()?;
    // let validator_list = ValidatorList::deserialize(&mut validator_list_data.as_ref())?;

    msg!("Successfully parsed all the accounts.");

    { // This is likely not needed since we check derivation path with Anchor.
        let (rederived_withdraw_authority, _) = find_withdraw_authority_program_address(
            &stake_pool_program_id,
            &stake_pool.key()
        );

        msg!("Rederived withdraw auth.");

        require!(
            withdraw_authority.key == &rederived_withdraw_authority,
            RampError::InvalidWithdrawAuthority
        );
    }

    {
        let (rederived_personal_lst_metadata, _) = find_metadata_account(&personal_lst_mint.key());

        msg!("Rederived personal LST metadata.");

        require!(
            personal_lst_metadata.key == &rederived_personal_lst_metadata,
            RampError::InvalidMetadataAddress
        );
    }

    msg!("Validated withdraw auth.");

    let initialize_stake_reserve_ix = stake::instruction::initialize(
        &stake_reserve.key(),
        &stake::state::Authorized {
            staker: withdraw_authority.key(),
            withdrawer: withdraw_authority.key()
        },
        &stake::state::Lockup::default()
    );

    msg!("Initialized stake reserve");

    invoke(
        &initialize_stake_reserve_ix, 
        &[
            stake_reserve.to_account_info(),
            withdraw_authority.to_account_info(),
            stake_pool_program.to_account_info(),
            stake_program.to_account_info(),
            rent.to_account_info()
        ]
    )?;

    let fee = Fee {
        denominator: 0,
        numerator: 0,
    };

    let initialize_stake_pool_ix = initialize(
        stake_pool_program.key,
        stake_pool.key,
        &ramp_user_account.key(),
        &ramp_user_account.key(),
        &withdraw_authority.key(),
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
        "user_account".as_bytes(),
        &user.key().to_bytes(),
        &[ctx.bumps.ramp_user_account]
    ];

    msg!("Rent: {}", rent.key());

    invoke_signed(
        &initialize_stake_pool_ix, 
        &[
            stake_pool_program.to_account_info(),
            stake_pool.to_account_info(),
            ramp_user_account.to_account_info(),
            validator_list.to_account_info(),
            stake_reserve.to_account_info(),
            personal_lst_mint.to_account_info(),
            manager_pool_account.to_account_info(),
            token_program.to_account_info(),
            rent.to_account_info(),
            withdraw_authority.to_account_info()
        ], 
        &[signer_seeds]
    )?;

    let lst_metadata_ix = create_token_metadata(
        stake_pool_program.key,
        stake_pool.key,
        &ramp_user_account.key(),
        &personal_lst_mint.key(),
        user.key,
        lst_name,
        lst_symbol,
        lst_metadata_uri
    );

    invoke_signed(
        &lst_metadata_ix, 
        &[
            stake_pool_program.to_account_info(),
            stake_pool.to_account_info(),
            ramp_user_account.to_account_info(),
            personal_lst_mint.to_account_info(),
            user.to_account_info(),
            rent.to_account_info(),
            personal_lst_metadata.to_account_info(),
            withdraw_authority.to_account_info(),
            metadata_program.to_account_info()
        ], 
        &[signer_seeds]
    )?;

    personal_market.market_currency = personal_lst_mint.key();
    ramp_user_account.personal_lst = Some(personal_lst_mint.key());
    ramp_user_account.personal_stake_pool = Some(stake_pool.key());

    Ok(())
}

#[derive(Accounts)]
pub struct CreatePersonalLst<'info> {
    #[account(
        mut,
    )]
    pub user: Signer<'info>,

    /// CHECK: This is safe. Checking program ID directly.
    #[account(
        mut,
        constraint = stake_pool_program.key() == stake_pool_program_id @ RampError::InvalidStakePoolProgram,
    )]
    pub stake_pool_program: AccountInfo<'info>,

    /// CHECK: Directly checking program ID.
    #[account(
        constraint = stake_program.key() == Stake::id() @ RampError::InvalidStakeProgram
    )]
    pub stake_program: AccountInfo<'info>,
    
    // Initialize stake pool with fixed derivation path, so that there cannot be more than one 
    // personal stake pool initialized via ramp per user.
    /// CHECK: Not reading/writing from/to this account. Only using for CPI to stake pool program.
    #[account(
        init,
        payer = user,
        seeds = [
            &user.key().to_bytes(),
            "personal_stake_pool".as_bytes(),
        ],
        bump,
        space = 656,
        owner = stake_pool_program_id,
    )]
    pub stake_pool: AccountInfo<'info>,

    // Check derivation path.
    /// CHECK: Fixed derivation path. Not reading or writing to this account.
    #[account(
        mut,
        seeds = [
            stake_pool.key().as_ref(),
            b"withdraw"
        ],
        bump,
        seeds::program = stake_pool_program_id
    )]
    pub withdraw_authority: AccountInfo<'info>,

    // Just need to initialize it and pass to the stake pool program.
    /// CHECK: This is safe. We're not writing or reading from this account.
    #[account(
        mut,
        // payer = user,
        // space = 8 + 4 + 1 + 4 + (8 * (73)), // max 8 validators
        owner = stake_pool_program_id,
        // seeds = [
        //     &stake_pool.key().to_bytes(),
        //     "ramp_val_list".as_bytes()
        // ],
        // bump,
    )]
    pub validator_list: AccountInfo<'info>,

    // Initialize stake reserve account. 
    // Transfer ownership to stake program.
    #[account(
        mut,
        // seeds = [
        //     &stake_pool.key().to_bytes(),
        //     "stake_reserve".as_bytes()
        // ],
        // bump,
        // payer = user,
        // space = 200,
        owner = stake_program.key(),
    )]
    pub stake_reserve: Account<'info, StakeAccount>,

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
    pub personal_lst_mint: Box<Account<'info, Mint>>,

    // Personal LST token account owned by the Stake Pool manager.
    #[account(
        mut,
        token::mint = personal_lst_mint,
        token::authority = ramp_user_account,
        token::token_program = token_program,
    )]
    pub manager_pool_account: Box<Account<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [
            "user_account".as_bytes(),
            &user.key().to_bytes()
        ],
        bump,

        // Make sure user does not have personal LST yet.
        constraint = ramp_user_account.personal_lst.is_none(),
    )]
    pub ramp_user_account: Box<Account<'info, RampAccount>>,

    #[account(
        mut,
        seeds = [
            "personal_market".as_bytes(),
            &user.key().to_bytes()
        ],
        bump,
        constraint = personal_market.id == ramp_user_account.id
    )]
    pub personal_market: Box<Account<'info, PersonalMarket>>,

    /// CHECK: Safe, we're not writing to this account. Will be validated by SPL Stake Pool CPI.
    #[account(
        mut,
        seeds = [
            "metadata".as_bytes(),
            metadata_program_id.as_ref(),
            personal_lst_mint.key().as_ref(),
        ],
        bump,
        seeds::program = metaplex_program
    )]
    pub personal_lst_metadata: AccountInfo<'info>,

    #[account(
        constraint = token_program.key() == Token::id()
    )]
    pub token_program: Program<'info, Token>,

    #[account()]
    pub system_program: Program<'info, System>,

    #[account()]
    pub rent: Sysvar<'info, Rent>,

    /// CHECK: Safe, directly checking program id.
    #[account(
        constraint = metaplex_program.key() == metadata_program_id
    )]
    pub metaplex_program: AccountInfo<'info>
}