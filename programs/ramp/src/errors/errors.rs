use anchor_lang::prelude::*;

#[error_code]
pub enum RampError {
    #[msg("")]
    EmptyError,

    #[msg("Invalid withdraw authority provided with the instruction.")]
    InvalidWithdrawAuthority,

    #[msg("Invalid Stake Pool program ID.")]
    InvalidStakePoolProgram,

    #[msg("Invalid Stake program ID.")]
    InvalidStakeProgram,

    #[msg("Personal LST cannot be pre-minted.")]
    LstPreMinted,

    #[msg("LST decimals have to equal SOL decimals, 9.")]
    InvalidLstDecimals,

    #[msg("Invalid LST authorities. Make sure the token cannot be frozen.")]
    InvalidLstAuthority
}