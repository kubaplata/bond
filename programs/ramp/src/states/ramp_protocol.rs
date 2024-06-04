use anchor_lang::prelude::*;

#[account]
pub struct RampProtocol {
    pub index: u64, // 8
    pub default_currency: Pubkey, // 32
    pub admin: Pubkey, // 32
}