use anchor_lang::prelude::*;

#[derive(Default, AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq, Eq)]
pub struct Share {
    pub user: Pubkey, // User's address. 32
    pub market: Pubkey, // Market's pubkey. 32
    pub owned: u64, // Number of shares owned by this user. 8
}

#[account]
pub struct RampAccount {
    pub id: u64, // 8
    pub vault: Pubkey, // 32
    pub display_name: String, // 8 + string len
    pub held_shares: Vec<Share>, // 4 + 72 * vec len
    pub personal_market: Pubkey, // 32
    pub personal_stake_pool: Option<Pubkey>, // 1 + 32
    pub personal_lst: Option<Pubkey>, // 1 + 32
}