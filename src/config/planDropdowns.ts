/**
 * Dropdown Configuration for Plan Design Pages
 * Centralizes all dropdown options for Traditional, Safe Harbor, Starter, and Solo 401(k) plans
 */

export const planDropdowns = {
  // Employer Contribution Type (Traditional & Safe Harbor)
  employerContributionType: {
    traditional: [
      { value: 'no-contribution', label: 'No Contribution' },
      { value: 'basic-match', label: 'Basic Match (4%)' },
      { value: 'custom-match', label: 'Custom Match' },
      { value: 'non-elective-basic', label: 'Non-elective Basic (3%)' },
      { value: 'custom-non-elective', label: 'Custom Non-elective' },
    ],
    safeHarbor: [
      { value: 'basic-match', label: 'Basic Match (4%)' },
      { value: 'enhanced-match', label: 'Enhanced Match (Custom)' },
      { value: 'non-elective-minimum', label: 'Non-elective Minimum (3%)' },
      { value: 'non-elective-enhanced', label: 'Non-elective Enhanced (Custom)' },
    ],
  },

  // Safe Harbor - Enhanced Match percentage options (5%-15%)
  safeHarborMatchPercentage: [
    { value: '5', label: '5%' },
    { value: '6', label: '6%' },
    { value: '7', label: '7%' },
    { value: '8', label: '8%' },
    { value: '9', label: '9%' },
    { value: '10', label: '10%' },
    { value: '11', label: '11%' },
    { value: '12', label: '12%' },
    { value: '13', label: '13%' },
    { value: '14', label: '14%' },
    { value: '15', label: '15%' },
  ],

  // Safe Harbor - Non-elective Enhanced percentage options (4%-15%)
  safeHarborNonElectivePercentage: [
    { value: '4', label: '4%' },
    { value: '5', label: '5%' },
    { value: '6', label: '6%' },
    { value: '7', label: '7%' },
    { value: '8', label: '8%' },
    { value: '9', label: '9%' },
    { value: '10', label: '10%' },
    { value: '11', label: '11%' },
    { value: '12', label: '12%' },
    { value: '13', label: '13%' },
    { value: '14', label: '14%' },
    { value: '15', label: '15%' },
  ],

  // Traditional - Custom Match percentage options (1%-15%, no 4%)
  traditionalMatchPercentage: [
    { value: '1', label: '1%' },
    { value: '2', label: '2%' },
    { value: '3', label: '3%' },
    { value: '5', label: '5%' },
    { value: '6', label: '6%' },
    { value: '7', label: '7%' },
    { value: '8', label: '8%' },
    { value: '9', label: '9%' },
    { value: '10', label: '10%' },
    { value: '11', label: '11%' },
    { value: '12', label: '12%' },
    { value: '13', label: '13%' },
    { value: '14', label: '14%' },
    { value: '15', label: '15%' },
  ],

  // Traditional - Custom Non-elective percentage options (1%-15%, no 3%)
  traditionalNonElectivePercentage: [
    { value: '1', label: '1%' },
    { value: '2', label: '2%' },
    { value: '4', label: '4%' },
    { value: '5', label: '5%' },
    { value: '6', label: '6%' },
    { value: '7', label: '7%' },
    { value: '8', label: '8%' },
    { value: '9', label: '9%' },
    { value: '10', label: '10%' },
    { value: '11', label: '11%' },
    { value: '12', label: '12%' },
    { value: '13', label: '13%' },
    { value: '14', label: '14%' },
    { value: '15', label: '15%' },
  ],

  // Vesting Schedules
  vestingSchedules: [
    { value: 'immediate', label: 'Immediate', dbName: 'Immediate Vesting' },
    { value: '1-year-cliff', label: '1 year cliff', dbName: '1-Year Cliff' },
    { value: '2-year-cliff', label: '2 year cliff', dbName: '2-Year Cliff' },
    { value: '3-year-cliff', label: '3 year cliff', dbName: '3-Year Cliff' },
    { value: '2-year-graded', label: '2 year graded', dbName: '2-Year Graded' },
    { value: '3-year-graded', label: '3 year graded', dbName: '3-Year Graded' },
    { value: '4-year-graded', label: '4 year graded', dbName: 'Standard 4-Year Graded' },
    { value: '6-year-graded', label: '6 year graded', dbName: '6-Year Graded' },
  ],

  // Minimum Age for Eligibility
  minimumAge: [
    { value: 'no-minimum', label: 'No minimum age', apiValue: 0 },
    { value: '18', label: '18 years', apiValue: 18 },
    { value: '19', label: '19 years', apiValue: 19 },
    { value: '20', label: '20 years', apiValue: 20 },
    { value: '21', label: '21 years', apiValue: 21 },
  ],

  // Time Employed (Service Requirement)
  timeEmployed: [
    { value: 'immediate', label: 'Immediate', apiValue: 0 },
    { value: '3', label: '3 months', apiValue: 3 },
    { value: '6', label: '6 months', apiValue: 6 },
    { value: '12', label: '12 months', apiValue: 12 },
  ],

  // Employee Exclusions
  exclusions: {
    options: [
      { value: 'none', label: 'None' },
      { value: 'custom', label: 'Select from list' },
    ],
    customOptions: [
      { value: 'part-time', label: 'Part time employees' },
      { value: 'union', label: 'Union employees' },
      { value: 'non-resident-alien', label: 'Non-resident aliens' },
      { value: 'intern-trainee', label: 'Interns or Trainees' },
      { value: 'temporary-seasonal', label: 'Temporary or seasonal workers' },
    ],
  },

  // Default Contribution Rate (Auto-Enrollment)
  defaultContributionRate: [
    { value: '3', label: '3%' },
    { value: '4', label: '4%' },
    { value: '5', label: '5%' },
    { value: '6', label: '6%' },
    { value: '7', label: '7%' },
    { value: '8', label: '8%' },
    { value: '9', label: '9%' },
    { value: '10', label: '10%' },
  ],

  // Annual Increase Mode (Starter 401k)
  annualIncreaseMode: [
    {
      value: 'minimum',
      label: '1% annual increase until it reaches 10%',
    },
    {
      value: 'custom',
      label: 'Customize the annual increase rate',
    },
  ],

  // Annual Increase Rate (for custom)
  annualIncreaseRate: [
    { value: '1', label: '1%' },
    { value: '2', label: '2%' },
    { value: '3', label: '3%' },
    { value: '4', label: '4%' },
    { value: '5', label: '5%' },
  ],

  // Maximum Contribution Rate (for custom annual increase)
  maxContributionRate: [
    { value: '10', label: '10%' },
    { value: '12', label: '12%' },
    { value: '15', label: '15%' },
    { value: '20', label: '20%' },
  ],

  // Profit Sharing Default Contribution
  profitSharingDefault: [
    { value: 'none', label: 'None' },
    { value: '3', label: '3%' },
    { value: '5', label: '5%' },
    { value: '7', label: '7%' },
    { value: '10', label: '10%' },
    { value: '15', label: '15%' },
  ],

  // Profit Sharing Formula
  profitSharingFormula: [
    { value: 'pro-rata', label: 'Pro-rata', apiValue: 'PRO_RATA' },
    { value: 'flat-dollar', label: 'Flat dollar', apiValue: 'FLAT_DOLLAR' },
    { value: 'new-comparability', label: 'New comparability', apiValue: 'NEW_COMPARABILITY' },
    { value: 'age-weighted', label: 'Age-weighted', apiValue: 'AGE_WEIGHTED' },
  ],

  // Starter 401k Specific - Default Rate (3%-15% range per SECURE 2.0)
  starterDefaultRate: [
    { value: '3', label: '3%' },
    { value: '4', label: '4%' },
    { value: '5', label: '5%' },
    { value: '6', label: '6%' },
    { value: '7', label: '7%' },
    { value: '8', label: '8%' },
    { value: '9', label: '9%' },
    { value: '10', label: '10%' },
    { value: '12', label: '12%' },
    { value: '15', label: '15%' },
  ],

  // Solo 401k - Employee Contribution Rate
  soloEmployeeRate: [
    { value: '5', label: '5%' },
    { value: '10', label: '10%' },
    { value: '15', label: '15%' },
    { value: '20', label: '20%' },
    { value: '25', label: '25%' },
  ],

  // Solo 401k - Employer Profit Sharing Rate
  soloEmployerRate: [
    { value: '10', label: '10%' },
    { value: '15', label: '15%' },
    { value: '20', label: '20%' },
    { value: '25', label: '25%' },
  ],
};

/**
 * Helper function to get vesting schedule DB name from dropdown value
 */
export function getVestingScheduleDbName(value: string): string {
  const schedule = planDropdowns.vestingSchedules.find((s) => s.value === value);
  return schedule?.dbName || 'Immediate Vesting';
}

/**
 * Helper function to get API value for profit sharing formula
 */
export function getProfitSharingFormulaApiValue(value: string): string {
  const formula = planDropdowns.profitSharingFormula.find((f) => f.value === value);
  return formula?.apiValue || 'PRO_RATA';
}

/**
 * Helper function to get API value for minimum age
 */
export function getMinimumAgeApiValue(value: string): number {
  const age = planDropdowns.minimumAge.find((a) => a.value === value);
  return age?.apiValue ?? 21;
}

/**
 * Helper function to get API value for time employed
 */
export function getTimeEmployedApiValue(value: string): number {
  const time = planDropdowns.timeEmployed.find((t) => t.value === value);
  return time?.apiValue ?? 0;
}
