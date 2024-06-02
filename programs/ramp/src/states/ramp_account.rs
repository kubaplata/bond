use anchor_lang::prelude::*;
use crate::states::Share;

#[account]
pub struct RampAccount {
    pub id: u64, // 8
    pub display_name: String, // 8 + string len
    pub held_shares: Vec<Share>, // 4 + 72 * vec len
    pub personal_market: Pubkey, // 32
    pub personal_lst: Option<Pubkey>, // 1 + 32
}