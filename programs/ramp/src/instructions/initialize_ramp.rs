use anchor_lang::prelude::*;
use crate::states::RampProtocol;

pub fn initialize_ramp(
    ctx: Context<InitializeRamp>,
    default_currency: Pubkey
) -> Result<()> {
    let admin = &mut ctx.accounts.admin;
    let ramp = &mut ctx.accounts.ramp;

    ramp.admin = admin.key();
    ramp.default_currency = default_currency;
    ramp.index = 0;

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
        space = 8 + 8 + (2 * 32)
    )]
    pub ramp: Account<'info, RampProtocol>,

    pub system_program: Program<'info, System>,
}