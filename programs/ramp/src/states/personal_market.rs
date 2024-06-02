use anchor_lang::prelude::*;
use crate::states::Share;
use crate::borsh::{BorshSerialize, BorshDeserialize};

#[derive(Clone, BorshSerialize, BorshDeserialize)]
pub enum BondingCurveMode {
    LINEAR,
    EXPONENTIAL,
    RAPID_EXPONENTIAL
}

#[account]
pub struct PersonalMarket {
    pub id: u64,
    pub holders: Vec<Share>,
    pub market_currency: Pubkey,
    pub total_shares: u64,
    pub total_trades: u64,
    pub total_volume: u64,
    pub mode: BondingCurveMode,
    pub current_purchase_price: u64,
    pub current_sale_price: u64,
}