use anchor_lang::error_code;

#[error_code]
pub enum PoolError {
    #[msg("UnsortedMints")]
    UnsortedMints,
}

#[error_code]
pub enum CurveError {
    #[msg("Zero balance encountered")]
    ZeroBalance,
    #[msg("Invalid output amount")]
    InvalidOutputAmount,
    #[msg("Zero LP supply")]
    ZeroSupply,
    #[msg("Slippage limit exceeded")]
    SlippageLimitExceeded,
    #[msg("Pool is not empty")]
    PoolNotEmpty,
    #[msg("Zero amount")]
    ZeroAmount,
}
