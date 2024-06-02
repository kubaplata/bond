use anchor_lang::prelude::*;

#[account]
pub struct RampProtocol {
    pub default_currency: Pubkey,
}