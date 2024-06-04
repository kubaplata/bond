use anchor_lang::prelude::*;
use crate::states::*;
use crate::errors::RampError;

pub fn create_account(
    ctx: Context<CreateAccount>,
    display_name: String,
    bonding_curve_mode: BondingCurveMode,
) -> Result<()> {
    let ramp_protocol = &mut ctx.accounts.ramp_protocol;
    let user_ramp_account = &mut ctx.accounts.user_ramp_account;
    let personal_market = &mut ctx.accounts.personal_market;

    user_ramp_account.display_name = display_name;
    user_ramp_account.held_shares = vec![];
    user_ramp_account.id = ramp_protocol.index;
    user_ramp_account.personal_lst = None;
    user_ramp_account.personal_market = personal_market.key();
    user_ramp_account.personal_stake_pool = None;

    personal_market.id = ramp_protocol.index;

    // Market properties.
    personal_market.mode = bonding_curve_mode;
    personal_market.holders = vec![];
    personal_market.market_currency = ramp_protocol.default_currency;

    // Prices.
    personal_market.current_purchase_price = 0;
    personal_market.current_sale_price = 0;

    // Stats
    personal_market.total_shares = 0;
    personal_market.total_trades = 0;
    personal_market.total_volume = 0;

    Ok(())
}

#[derive(Accounts)]
#[instruction(
    display_name: String,
)]
pub struct CreateAccount<'info> {
    #[account(
        mut
    )]
    pub user: Signer<'info>,

    #[account(
        mut
    )]
    pub ramp_protocol: Account<'info, RampProtocol>,

    #[account(
        init,
        payer = user,
        seeds = [
            "user_account".as_bytes(),
            &user.key().to_bytes()
        ],
        space = 8 + 8 + (1 * 32) + (2 * (1 + 32)) + 4 + 8 + display_name.len(),
        bump
    )]
    pub user_ramp_account: Account<'info, RampAccount>,

    #[account(
        init,
        payer = user,
        seeds = [
            "personal_market".as_bytes(),
            &user.key().to_bytes()
        ],
        space = 8 + (6 * 8) + 32 + 2 + 4,
        bump,
    )]
    pub personal_market: Account<'info, PersonalMarket>,

    #[account()]
    pub system_program: Program<'info, System>,
}