use std::borrow::Borrow;

use anchor_lang::prelude::*;
use crate::states::Share;
use crate::borsh::{BorshSerialize, BorshDeserialize};
use crate::RampError;

#[derive(Clone, BorshSerialize, BorshDeserialize)]
pub enum BondingCurveMode {
    Linear,
    Exponential,
    RapidExponential
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

impl PersonalMarket {
    // Returns share price in lamports.
    pub fn calculate_share_price(&self, index: u64) -> u64 {
        match self.mode {
            BondingCurveMode::Linear => {
                // Price increases by 0.25 SOL.
                return ((index as f64) * 0.25_f64 * 10_f64.powf(9_f64)) as u64
            }

            BondingCurveMode::Exponential => {
                return ((0.05_f64 + ((index as f64).powf(2_f64) / 700_f64)) * 10_f64.powf(9_f64)) as u64
            }

            BondingCurveMode::RapidExponential => {
                return ((0.05_f64 + ((index as f64).powf(2_f64) / 250_f64)) * 10_f64.powf(9_f64)) as u64
            }
        }
    }

    pub fn calculate_purchase_price(&self) -> u64 {
        self.calculate_share_price(self.total_shares + 1)
    }

    pub fn calculate_sale_price(&self) -> u64 {
        self.calculate_share_price(self.total_shares)
    }

    pub fn add_shares(
        &mut self, 
        shares: u64,
        buyer: Pubkey, 
        personal_market_account: Account<PersonalMarket>
    ) -> Result<()> {
        self.total_shares += shares;

        // If the buyer is not new, just assign to already existing vec element.
        let mut found_holder: bool = false;
        for holder in self.holders.iter_mut() {
            if holder.user == buyer {
                holder.owned += shares;
                found_holder = true;

                break;
            }
        }

        // If the buyer is new, reallocate account & assign.
        if !found_holder {
            let account_len = personal_market_account.to_account_info().data_len();
            personal_market_account.to_account_info().realloc(
                account_len, 
                false
            )?;

            self.holders.push(
                Share {
                    market: personal_market_account.key(),
                    owned: shares,
                    user: buyer
                }
            );
        }

        Ok(())
    }

    pub fn sub_shares(
        &mut self, 
        shares: u64,
        seller: Pubkey,
    ) -> Result<()> {
        self.total_shares -= shares;

        let mut found_holder: bool = false;
        for holder in self.holders.iter_mut() {
            if holder.user == seller {
                require!(
                    holder.owned >= shares,
                    RampError::InvalidShareBalance
                );

                holder.owned -= shares;
                found_holder = true;

                break;
            }
        }

        require!(
            found_holder,
            RampError::InvalidShareSeller
        );

        Ok(())
    }
}