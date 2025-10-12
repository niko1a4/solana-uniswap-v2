use crate::error::CurveError;
use anchor_lang::prelude::*;
use integer_sqrt::IntegerSquareRoot;
/// Returns amount of output tokens given an input amount and pool reserves.
/// Formula:
/// amount_out = (amount_in * reserve_out * (10_000 - fee_bps))
///             / (reserve_in * 10_000 + amount_in * (10_000 - fee_bps))
pub fn get_amount_out(
    amount_in: u64,   //amount of token selling
    reserve_in: u64,  //amount of tokens selling in the pool
    reserve_out: u64, //amount of tokens buying in the pool
    fee_bps: u16,     // e.g. 30 = 0.3%
) -> Result<u64> {
    if amount_in == 0 || reserve_in == 0 || reserve_out == 0 {
        return err!(CurveError::ZeroBalance);
    }

    let amount_in_with_fee = amount_in as u128 * (10_000 - fee_bps as u128);
    let numerator = amount_in_with_fee * reserve_out as u128;
    let denominator = reserve_in as u128 * 10_000 + amount_in_with_fee;
    Ok((numerator / denominator) as u64)
}

/// Returns required input amount to receive exact `amount_out`
/// given pool reserves and fee.
/// Formula:
/// amount_in = (reserve_in * amount_out * 10_000)  
///            / ((reserve_out - amount_out) * (10_000 - fee_bps)) + 1
pub fn get_amount_in(
    amount_out: u64,
    reserve_in: u64,
    reserve_out: u64,
    fee_bps: u16,
) -> Result<u64> {
    if amount_out == 0 || reserve_in == 0 || reserve_out == 0 || amount_out >= reserve_out {
        return err!(CurveError::InvalidOutputAmount);
    }

    let numerator = reserve_in as u128 * amount_out as u128 * 10_000;
    let denominator = (reserve_out as u128 - amount_out as u128) * (10_000 - fee_bps as u128);

    Ok(((numerator / denominator) as u64) + 1)
}

/// Quote returns equivalent amount of token B given token A amount and reserves.
/// Used for calculating optimal deposit ratios.
/// Formula:
/// amount_b = amount_a * reserve_b / reserve_a
pub fn quote(amount_x: u64, reserve_x: u64, reserve_y: u64) -> Result<u64> {
    if reserve_x == 0 || reserve_y == 0 {
        return err!(CurveError::ZeroBalance);
    }

    Ok((amount_x as u128 * reserve_y as u128 / reserve_x as u128) as u64)
}

/// Calculates token amounts when removing liquidity.
/// Formula:
/// amount_a = lp_amount * reserve_a / total_supply
/// amount_b = lp_amount * reserve_b / total_supply
pub fn remove_liquidity(
    lp_amount: u64,
    total_supply: u64,
    reserve_a: u64,
    reserve_b: u64,
) -> Result<(u64, u64)> {
    if total_supply == 0 {
        return err!(CurveError::ZeroSupply);
    }

    let amount_a = lp_amount as u128 * reserve_a as u128 / total_supply as u128;
    let amount_b = lp_amount as u128 * reserve_b as u128 / total_supply as u128;

    Ok((amount_a as u64, amount_b as u64))
}

/// Checks if actual output differs from expected by more than allowed slippage.
/// `max_slippage_bps` = allowed difference in basis points (e.g. 100 = 1%).
pub fn check_slippage(expected: u64, actual: u64, max_slippage_bps: u64) -> Result<()> {
    let diff = if expected > actual {
        expected - actual
    } else {
        actual - expected
    };
    let allowed = expected.saturating_mul(max_slippage_bps) / 10_000;
    if diff > allowed {
        return err!(CurveError::SlippageLimitExceeded);
    }
    Ok(())
}

///Calculates how many LP tokens should be minted when one adds liquidity to the pool
/// If pool is empty -> sqrt(amount_x * amount_y)
/// If pool isn't empy -> proportional to existing reserves

pub fn calculate_lp_mint_amount(
    amount_x: u64,
    amount_y: u64,
    reserve_x: u64,
    reserve_y: u64,
    total_supply: u64,
) -> Result<u64> {
    if amount_x == 0 || amount_y == 0 {
        return err!(CurveError::ZeroBalance);
    }
    let lp_to_mint = if total_supply == 0 {
        let num = (amount_x as u128 * amount_y as u128) as u64;
        let num_sqrt = num.integer_sqrt();
        num_sqrt
    } else {
        if reserve_x == 0 || reserve_y == 0 {
            return err!(CurveError::ZeroBalance);
        }

        let lp_from_x = amount_x as u128 * total_supply as u128 / reserve_x as u128;
        let lp_from_y = amount_y as u128 * total_supply as u128 / reserve_y as u128;
        lp_from_x.min(lp_from_y) as u64
    };
    Ok(lp_to_mint)
}
