use anchor_lang::prelude::*;
use spl_stake_pool;
use std::ops::Deref;

#[derive(Clone)]
pub struct StakePool(spl_stake_pool::state::StakePool);

impl anchor_lang::AccountDeserialize for StakePool {
    fn try_deserialize(buf: &mut &[u8]) -> anchor_lang::Result<Self> {
        Self::try_deserialize_unchecked(buf)
    }

    fn try_deserialize_unchecked(buf: &mut &[u8]) -> anchor_lang::Result<Self> {
        spl_stake_pool::state::StakePool::deserialize(buf).map(Self).map_err(Into::into)
    }
}

impl anchor_lang::AccountSerialize for StakePool {}

impl anchor_lang::Owner for StakePool {
    fn owner() -> Pubkey {
        spl_stake_pool::ID
    }
}

impl Deref for StakePool {
    type Target = spl_stake_pool::state::StakePool;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}