use anchor_lang::prelude::*;

pub mod instructions;
pub use instructions::*;

pub mod states;
pub use states::*;

pub mod errors;
pub use errors::*;

declare_id!("EXSphcPS7fXSnmVPqo8Q5Hax5yRnc3t4MFWD1NozvMro");

#[program]
pub mod ramp {
    use super::*;

    // Create Account
    // Since user automatically becomes a creator,
    // this has to accept all parameters like bonding curve, etc.
    // Initialize user's stake pool, upload metadata.
    pub fn create_account(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    // Initialize personal LST. Upload metadata, create Personal Stake Pool, etc.
    pub fn create_personal_lst(ctx: Context<CreatePersonalLst>) -> Result<()> {
        Ok(())
    }

    // Purchase Share
    // Calculate price & fees depending on the bonding curve.
    // Execute sale.
    // Charge SOL & deposit into stake pool.
    pub fn purchase_share(ctx: Context<PurchaseShare>) -> Result<()> {
        Ok(())
    }

    // Dump Share
    // Calculate prices & charge fee.
    // Execute sale.
    // Unlock SOL from the stake pool using the LST held in the Ramp.
    pub fn sell_share(ctx: Context<SellShare>) -> Result<()> {
        Ok(())
    }

    // Change settings. Function used to manage all user's settings.
    // Change personal LST metadata.
    // Add/remove validator.
    pub fn change_settings(ctx: Context<ChangeSettings>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
