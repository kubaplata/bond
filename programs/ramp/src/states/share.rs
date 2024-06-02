use anchor_lang::prelude::*;
use crate::borsh::{BorshSerialize, BorshDeserialize};

#[derive(Clone, BorshSerialize, BorshDeserialize)]
pub struct Share {
    pub user: Pubkey, // User's address. 32
    pub market: Pubkey, // Market's pubkey. 32
    pub owned: u64, // Number of shares owned by this user. 8
}