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

    // Helper function to initialize rampSOL stake pool and LST before initializing protocol.
    // Remove on production.
    pub fn initialize_stake_pool(
        ctx: Context<InitializeStakePool>
    ) -> Result<()> {
        instructions::initialize_stake_pool(
            ctx
        )
    }

    pub fn initialize_ramp(
        ctx: Context<InitializeRamp>
    ) -> Result<()> {
        instructions::initialize_ramp(ctx)
    }

    // Create Account
    // Since user automatically becomes a creator,
    // this has to accept all parameters like bonding curve, etc.
    // Initialize user's stake pool, upload metadata.
    pub fn create_account(
        ctx: Context<CreateAccount>,
        display_name: String,
        bonding_curve_mode: BondingCurveMode
    ) -> Result<()> {
        instructions::create_account(
            ctx, 
            display_name,
            bonding_curve_mode
        )
    }

    // Initialize personal LST. Upload metadata, create Personal Stake Pool, etc.
    pub fn create_personal_lst(
        ctx: Context<CreatePersonalLst>,
        lst_name: String,
        lst_symbol: String,
        lst_metadata: String,
    ) -> Result<()> {
        instructions::create_personal_lst(
            ctx,
            lst_name,
            lst_symbol,
            lst_metadata
        )
    }

    // Purchase Share
    // Calculate price & fees depending on the bonding curve.
    // Execute sale.
    // Charge SOL & deposit into stake pool.
    pub fn purchase_share(
        ctx: Context<PurchaseShare>,
        seller: Pubkey
    ) -> Result<()> {
        instructions::purchase_share(ctx, seller)
    }

    // Dump Share
    // Calculate prices & charge fee.
    // Execute sale.
    // Unlock SOL from the stake pool using the LST held in the Ramp.
    // pub fn sell_share(ctx: Context<SellShare>) -> Result<()> {
    //     Ok(())
    // }

    // Change settings. Function used to manage all user's settings.
    // Change personal LST metadata.
    // Add/remove validator.
    // pub fn change_settings(ctx: Context<ChangeSettings>) -> Result<()> {
    //     Ok(())
    // }
}
