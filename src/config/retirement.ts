/**
 * 401(k) Plan Constants and Configuration
 * IRS limits, vesting schedules, and retirement plan rules
 */

/**
 * IRS Contribution Limits for 2026
 * Updated annually based on IRS cost-of-living adjustments
 */
export const IRS_LIMITS_2026 = {
  /**
   * Maximum employee deferral (elective deferral limit)
   * Section 402(g) limit
   */
  EMPLOYEE_DEFERRAL: 23500,

  /**
   * Catch-up contribution for participants age 50+
   */
  CATCH_UP_50_PLUS: 7500,

  /**
   * Enhanced catch-up for participants age 60-63
   * SECURE 2.0 provision starting 2025
   */
  CATCH_UP_60_63: 11250,

  /**
   * Maximum total annual contribution (employee + employer)
   * Section 415(c) limit
   */
  TOTAL_CONTRIBUTION: 70000,

  /**
   * Total with catch-up for 50+
   */
  TOTAL_WITH_CATCHUP_50: 77500,

  /**
   * Total with enhanced catch-up for 60-63
   */
  TOTAL_WITH_CATCHUP_60: 81250,

  /**
   * Annual compensation limit
   * Maximum compensation used for contribution calculations
   */
  COMPENSATION_LIMIT: 345000,

  /**
   * Highly Compensated Employee (HCE) threshold
   * Based on prior year compensation
   */
  HCE_THRESHOLD: 160000,

  /**
   * Key employee compensation threshold
   */
  KEY_EMPLOYEE_THRESHOLD: 230000,

  /**
   * Social Security wage base
   */
  SOCIAL_SECURITY_WAGE_BASE: 176100,

  /**
   * Defined benefit plan limit
   */
  DEFINED_BENEFIT_LIMIT: 280000,
} as const;

/**
 * Historical IRS limits for reference
 */
export const IRS_LIMITS_HISTORY = {
  2025: {
    EMPLOYEE_DEFERRAL: 23000,
    CATCH_UP_50_PLUS: 7500,
    TOTAL_CONTRIBUTION: 69000,
    COMPENSATION_LIMIT: 345000,
    HCE_THRESHOLD: 155000,
  },
  2024: {
    EMPLOYEE_DEFERRAL: 23000,
    CATCH_UP_50_PLUS: 7500,
    TOTAL_CONTRIBUTION: 69000,
    COMPENSATION_LIMIT: 345000,
    HCE_THRESHOLD: 155000,
  },
  2023: {
    EMPLOYEE_DEFERRAL: 22500,
    CATCH_UP_50_PLUS: 7500,
    TOTAL_CONTRIBUTION: 66000,
    COMPENSATION_LIMIT: 330000,
    HCE_THRESHOLD: 150000,
  },
} as const;

/**
 * Get IRS limits for a given year. Falls back to 2026 defaults for future years.
 */
export function getIRSLimitsForYear(year: number) {
  if (year === 2026 || year > 2026) return IRS_LIMITS_2026;
  const historical = IRS_LIMITS_HISTORY[year as keyof typeof IRS_LIMITS_HISTORY];
  return historical ?? IRS_LIMITS_2026;
}

/**
 * Pro-rate an IRS limit for a short plan year.
 * Only applicable to 401(a)(17) compensation cap and 415(c) annual additions limit.
 * Other limits (402(g), 414(v)) are NOT pro-rated per IRS rules.
 *
 * @param fullLimit    The full annual IRS limit
 * @param activeMonths Number of months the plan is active (1–12)
 * @returns The pro-rated limit, or full limit if activeMonths >= 12
 */
export function proRateLimit(fullLimit: number, activeMonths: number): number {
  if (activeMonths >= 12) return fullLimit;
  return Math.round((fullLimit * activeMonths / 12) * 100) / 100;
}

/**
 * Determine if a plan year is a short plan year.
 * A short plan year occurs when the plan effective date is after Jan 1 of its first year.
 *
 * @param planEffectiveDate ISO date string of the plan's effective date
 * @param planYear          The plan year to evaluate
 * @returns true if this is a short plan year
 */
export function isShortPlanYear(planEffectiveDate: string | null | undefined, planYear: number): boolean {
  if (!planEffectiveDate) return false;
  const date = new Date(planEffectiveDate);
  return date.getFullYear() === planYear && date.getMonth() > 0; // getMonth() is 0-indexed: Jan=0
}

/**
 * Get the number of active months in a short plan year.
 * @returns 1–12
 */
export function getActiveMonths(planEffectiveDate: string | null | undefined, planYear: number): number {
  if (!isShortPlanYear(planEffectiveDate, planYear)) return 12;
  const date = new Date(planEffectiveDate!);
  return 12 - date.getMonth(); // getMonth() is 0-indexed, so 12 - month gives months remaining inclusive
}

/**
 * Plan Types
 */
export const PLAN_TYPES = {
  TRADITIONAL: {
    id: 'traditional',
    name: 'Traditional 401(k)',
    description: 'Standard 401(k) with discretionary employer contributions',
    features: [
      'Flexible employer match formulas',
      'Profit sharing options',
      'Annual compliance testing required',
    ],
  },
  SAFE_HARBOR: {
    id: 'safe-harbor',
    name: 'Safe Harbor 401(k)',
    description: '401(k) with mandatory employer contributions that pass ADP/ACP tests',
    features: [
      'No ADP/ACP testing required',
      'Mandatory employer contributions',
      '100% immediate vesting on safe harbor contributions',
    ],
  },
  QACA: {
    id: 'qaca',
    name: 'QACA Safe Harbor',
    description: 'Qualified Automatic Contribution Arrangement',
    features: [
      'Automatic enrollment',
      'Auto-escalation',
      '2-year cliff vesting allowed',
    ],
  },
  STARTER: {
    id: 'starter',
    name: 'Starter 401(k)',
    description: 'Simplified 401(k) for small businesses (SECURE 2.0)',
    features: [
      'No employer contributions required',
      'Lower administrative burden',
      'Employee deferral only',
    ],
  },
} as const;

/**
 * Standard Vesting Schedules
 */
export const VESTING_SCHEDULES = {
  IMMEDIATE: {
    id: 'immediate',
    name: 'Immediate Vesting',
    description: '100% vested immediately',
    schedule: [{ year: 0, percentage: 100 }],
  },
  THREE_YEAR_CLIFF: {
    id: '3-year-cliff',
    name: '3-Year Cliff',
    description: '0% until year 3, then 100%',
    schedule: [
      { year: 0, percentage: 0 },
      { year: 1, percentage: 0 },
      { year: 2, percentage: 0 },
      { year: 3, percentage: 100 },
    ],
  },
  SIX_YEAR_GRADED: {
    id: '6-year-graded',
    name: '6-Year Graded',
    description: '20% per year starting year 2',
    schedule: [
      { year: 0, percentage: 0 },
      { year: 1, percentage: 0 },
      { year: 2, percentage: 20 },
      { year: 3, percentage: 40 },
      { year: 4, percentage: 60 },
      { year: 5, percentage: 80 },
      { year: 6, percentage: 100 },
    ],
  },
  QACA_TWO_YEAR: {
    id: 'qaca-2-year',
    name: 'QACA 2-Year Cliff',
    description: '0% until year 2, then 100%',
    schedule: [
      { year: 0, percentage: 0 },
      { year: 1, percentage: 0 },
      { year: 2, percentage: 100 },
    ],
  },
} as const;

/**
 * Common Employer Match Formulas
 */
export const MATCH_FORMULAS = {
  DOLLAR_FOR_DOLLAR_3: {
    id: 'dollar-3',
    name: '100% of first 3%',
    description: 'Dollar-for-dollar match on first 3% of compensation',
    matchPercentage: 100,
    maxContribution: 3,
    maxEmployerContribution: 3,
  },
  FIFTY_CENTS_6: {
    id: 'fifty-6',
    name: '50% of first 6%',
    description: '50 cents on the dollar for first 6% of compensation',
    matchPercentage: 50,
    maxContribution: 6,
    maxEmployerContribution: 3,
  },
  SAFE_HARBOR_BASIC: {
    id: 'sh-basic',
    name: 'Safe Harbor Basic Match',
    description: '100% of first 3% + 50% of next 2%',
    tiers: [
      { matchPercentage: 100, maxContribution: 3 },
      { matchPercentage: 50, maxContribution: 2 },
    ],
    maxEmployerContribution: 4,
  },
  SAFE_HARBOR_ENHANCED: {
    id: 'sh-enhanced',
    name: 'Safe Harbor Enhanced Match',
    description: '100% of first 4%',
    matchPercentage: 100,
    maxContribution: 4,
    maxEmployerContribution: 4,
  },
  SAFE_HARBOR_NONELECTIVE: {
    id: 'sh-nonelective',
    name: 'Safe Harbor Non-Elective',
    description: '3% of compensation for all eligible employees',
    nonElectivePercentage: 3,
    requiresEmployeeContribution: false,
  },
} as const;

/**
 * Compliance Test Types
 */
export const COMPLIANCE_TESTS = {
  ADP: {
    id: 'adp',
    name: 'ADP Test',
    fullName: 'Actual Deferral Percentage Test',
    description: 'Tests that HCE deferrals are not excessive compared to NHCEs',
  },
  ACP: {
    id: 'acp',
    name: 'ACP Test',
    fullName: 'Actual Contribution Percentage Test',
    description: 'Tests employer matching and after-tax contributions',
  },
  TOP_HEAVY: {
    id: 'top-heavy',
    name: 'Top Heavy Test',
    fullName: 'Top Heavy Test',
    description: 'Ensures key employees don\'t own more than 60% of plan assets',
  },
  COVERAGE: {
    id: 'coverage',
    name: 'Coverage Test',
    fullName: '410(b) Coverage Test',
    description: 'Tests that plan covers enough non-HCEs',
  },
  MINIMUM_PARTICIPATION: {
    id: 'min-participation',
    name: 'Minimum Participation',
    fullName: '401(a)(26) Minimum Participation Test',
    description: 'Ensures minimum number of participants are covered',
  },
} as const;

/**
 * Participant Status Types
 */
export const PARTICIPANT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  TERMINATED: 'terminated',
  RETIRED: 'retired',
  DECEASED: 'deceased',
  ON_LEAVE: 'on-leave',
  PENDING_ENROLLMENT: 'pending-enrollment',
} as const;

/**
 * Contribution Types
 */
export const CONTRIBUTION_TYPES = {
  EMPLOYEE_PRETAX: 'employee-pretax',
  EMPLOYEE_ROTH: 'employee-roth',
  EMPLOYER_MATCH: 'employer-match',
  EMPLOYER_PROFIT_SHARING: 'employer-profit-sharing',
  EMPLOYER_NONELECTIVE: 'employer-nonelective',
  ROLLOVER: 'rollover',
  QNEC: 'qnec',
  QMAC: 'qmac',
} as const;

/**
 * Distribution/Withdrawal Types
 */
export const DISTRIBUTION_TYPES = {
  HARDSHIP: 'hardship',
  LOAN: 'loan',
  IN_SERVICE: 'in-service',
  TERMINATION: 'termination',
  RETIREMENT: 'retirement',
  DEATH: 'death',
  DISABILITY: 'disability',
  QDRO: 'qdro',
  RMD: 'rmd',
} as const;

/**
 * Get current year IRS limits
 */
export function getCurrentIRSLimits() {
  return IRS_LIMITS_2026;
}

/**
 * Calculate maximum contribution based on age
 */
export function getMaxContribution(age: number): number {
  const limits = getCurrentIRSLimits();

  if (age >= 60 && age <= 63) {
    return limits.EMPLOYEE_DEFERRAL + limits.CATCH_UP_60_63;
  }

  if (age >= 50) {
    return limits.EMPLOYEE_DEFERRAL + limits.CATCH_UP_50_PLUS;
  }

  return limits.EMPLOYEE_DEFERRAL;
}

/**
 * Calculate vested amount based on schedule and years of service
 */
export function calculateVestedAmount(
  amount: number,
  yearsOfService: number,
  scheduleId: keyof typeof VESTING_SCHEDULES
): number {
  const schedule = VESTING_SCHEDULES[scheduleId];
  if (!schedule) return amount;

  // Find the applicable vesting percentage
  let vestingPercentage = 0;
  for (const tier of schedule.schedule) {
    if (yearsOfService >= tier.year) {
      vestingPercentage = tier.percentage;
    }
  }

  return (amount * vestingPercentage) / 100;
}

/**
 * Check if an employee is HCE
 */
export function isHighlyCompensatedEmployee(
  priorYearCompensation: number,
  isOwner: boolean = false,
  ownershipPercentage: number = 0
): boolean {
  const limits = getCurrentIRSLimits();

  // 5% owner at any time during current or prior year
  if (isOwner && ownershipPercentage >= 5) {
    return true;
  }

  // Prior year compensation above HCE threshold
  return priorYearCompensation >= limits.HCE_THRESHOLD;
}
