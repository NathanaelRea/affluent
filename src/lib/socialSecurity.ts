export type SocialSecurityInput = {
  currentAge: number;
  retirementAge: number; // used for projecting years worked; does not have to equal claimAge
  claimAge?: number; // defaults to retirementAge
  annualIncome: number; // assumed constant (no raises)
  workStartAge?: number; // defaults to 22
};

const SSA_2024 = {
  fullRetirementAge: 67,
  taxableWageBase: 168_600,
  bendPoint1Monthly: 1_174,
  bendPoint2Monthly: 7_078,
  bendPointRate1: 0.9,
  bendPointRate2: 0.32,
  bendPointRate3: 0.15,
  earlyClaimReduction: 5 / 9 / 100,
  earlyClaimReductionExtended: 5 / 12 / 100,
  delayedRetirementCredit: 2 / 3 / 100,
  maxDelayAge: 70,
  minClaimAge: 62,
  topEarningYears: 35,
} as const;

export function estimateAnnualSocialSecurity(
  input: SocialSecurityInput,
): number {
  const {
    retirementAge,
    claimAge = retirementAge,
    annualIncome,
    workStartAge = 22,
  } = input;

  if (claimAge < SSA_2024.minClaimAge) {
    return 0;
  }

  const projectedYearsAtRetirement = Math.max(0, retirementAge - workStartAge);
  const yearsWorked = Math.min(
    projectedYearsAtRetirement,
    SSA_2024.topEarningYears,
  );
  const aime = calculateAIME(annualIncome, yearsWorked);
  const pia = calculatePIA(aime);
  const adjustmentFactor = calculateAdjustmentFactor(claimAge);
  return (12 * Math.round(pia * adjustmentFactor * 100)) / 100;
}

export function calculatePIA(aime: number): number {
  let pia = 0;

  if (aime <= SSA_2024.bendPoint1Monthly) {
    pia = aime * SSA_2024.bendPointRate1;
  } else if (aime <= SSA_2024.bendPoint2Monthly) {
    pia =
      SSA_2024.bendPoint1Monthly * SSA_2024.bendPointRate1 +
      (aime - SSA_2024.bendPoint1Monthly) * SSA_2024.bendPointRate2;
  } else {
    pia =
      SSA_2024.bendPoint1Monthly * SSA_2024.bendPointRate1 +
      (SSA_2024.bendPoint2Monthly - SSA_2024.bendPoint1Monthly) *
        SSA_2024.bendPointRate2 +
      (aime - SSA_2024.bendPoint2Monthly) * SSA_2024.bendPointRate3;
  }

  return pia;
}

export function calculateAdjustmentFactor(claimAge: number): number {
  const monthsFromFRA = (claimAge - SSA_2024.fullRetirementAge) * 12;

  if (monthsFromFRA < 0) {
    // Early claim
    const monthsEarly = Math.abs(monthsFromFRA);
    if (monthsEarly <= 36) {
      return 1 - monthsEarly * SSA_2024.earlyClaimReduction;
    } else {
      return (
        1 -
        36 * SSA_2024.earlyClaimReduction -
        (monthsEarly - 36) * SSA_2024.earlyClaimReductionExtended
      );
    }
  } else if (monthsFromFRA > 0) {
    // Delayed claim
    const monthsDelayed = Math.min(
      monthsFromFRA,
      (SSA_2024.maxDelayAge - SSA_2024.fullRetirementAge) * 12,
    );
    return 1 + monthsDelayed * SSA_2024.delayedRetirementCredit;
  }

  return 1.0;
}

function calculateAIME(annualIncome: number, yearsWorked: number): number {
  const cappedAnnualIncome = Math.min(annualIncome, SSA_2024.taxableWageBase);
  const totalEarnings = cappedAnnualIncome * yearsWorked;
  return totalEarnings / SSA_2024.topEarningYears / 12;
}
