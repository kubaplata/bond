use anchor_lang::prelude::*;

use crate::RampAccount;

pub fn change_lst_settings(
    ctx: Context<ChangeLstSettings>
) -> Result<()> {
    

    Ok(())
}

#[derive(Accounts)]
pub struct ChangeLstSettings<'info> {
    #[account(
        mut
    )]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [
            "user_account".as_bytes(),
            &user.key().to_bytes()
        ],
        bump
    )]
    pub ramp_user_account: Account<'info, RampAccount>,
}