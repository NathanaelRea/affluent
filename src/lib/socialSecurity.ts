import { SSA_2024 } from "@/data2024";
export type SocialSecurityInput = {
  currentAge: number;
  retirementAge: number; // used for projecting years worked; does not have to equal claimAge
  claimAge?: number; // defaults to retirementAge
  annualIncome: number; // assumed constant (no raises)
  workStartAge?: number; // defaults to 22
};

/**
 * Rough Social Security benefit estimator (USA).
 * Assumptions:
 * - No wage growth; annual income is constant until retirementAge.
 * - Uses 2024 bend points and taxable wage base.
 * - Full Retirement Age (FRA) assumed to be 67.
 * - AIME approximated using total years worked up to retirementAge with zeros to fill to 35 years.
 * - Claiming adjustments: early reduction and delayed credits applied monthly.
 */
export function estimateAnnualSocialSecurity(input: SocialSecurityInput) {
  const FRA = SSA_2024.fullRetirementAge;
  const taxableWageBase = SSA_2024.taxableWageBase; // 2024 SSA wage base
  const bendPoint1 = SSA_2024.bendPoint1Monthly; // monthly
  const bentPoint2 = SSA_2024.bendPoint2Monthly; // monthly

  const claimAge = input.claimAge ?? input.retirementAge;
  const workStartAge = input.workStartAge ?? 22;

  if (
    input.currentAge <= 0 ||
    input.retirementAge <= input.currentAge ||
    input.annualIncome <= 0
  ) {
    return 0;
  }

  const cappedIncome = Math.min(input.annualIncome, taxableWageBase);

  // Years with covered earnings by retirement
  const yearsWorkedAtRetirement = Math.max(
    0,
    input.retirementAge - workStartAge,
  );
  const yearsUsedInAverage = 35; // SSA averages top 35 years, zeros fill remaining
  const totalCoveredEarnings =
    cappedIncome * Math.min(yearsWorkedAtRetirement, yearsUsedInAverage);
  const aimeMonthly = totalCoveredEarnings / (yearsUsedInAverage * 12);

  // Primary Insurance Amount (PIA) at FRA (monthly)
  const firstPortion = Math.min(aimeMonthly, bendPoint1);
  const secondPortion = Math.min(
    Math.max(aimeMonthly - bendPoint1, 0),
    bentPoint2 - bendPoint1,
  );
  const thirdPortion = Math.max(aimeMonthly - bentPoint2, 0);

  const piaMonthly =
    0.9 * firstPortion + 0.32 * secondPortion + 0.15 * thirdPortion;

  // Adjust for claiming age relative to FRA
  const monthsDiff = Math.round((claimAge - FRA) * 12);
  let adjustedMonthly = piaMonthly;
  if (monthsDiff < 0) {
    // Early claiming reduction: 5/9 of 1% per month for first 36 months, then 5/12 of 1%
    const earlyMonths = Math.abs(monthsDiff);
    const first36 = Math.min(earlyMonths, 36);
    const additional = Math.max(earlyMonths - 36, 0);
    const reduction = first36 * (5 / 9 / 100) + additional * (5 / 12 / 100);
    adjustedMonthly = piaMonthly * (1 - reduction);
  } else if (monthsDiff > 0) {
    // Delayed retirement credits: 2/3 of 1% per month until age 70
    const maxDelayMonths = Math.max(0, (70 - FRA) * 12);
    const effectiveMonths = Math.min(monthsDiff, maxDelayMonths);
    const increase = effectiveMonths * (2 / 3 / 100);
    adjustedMonthly = piaMonthly * (1 + increase);
  }

  if (!Number.isFinite(adjustedMonthly) || adjustedMonthly <= 0) return 0;
  return adjustedMonthly * 12;
}
