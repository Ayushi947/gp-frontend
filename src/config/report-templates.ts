import type { ExportFormat } from '@/lib/export';

export interface ReportField {
  id: string;
  label: string;
  description?: string;
  required?: boolean;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: ReportField[];
  supportedFormats: ExportFormat[];
}

/**
 * 401(k) Compliance Report Templates
 */
export const REPORT_TEMPLATES: ReportTemplate[] = [
  // Compliance Testing Reports
  {
    id: 'adp-acp-test',
    name: 'ADP/ACP Test Report',
    description: 'Actual Deferral Percentage and Actual Contribution Percentage testing results',
    category: 'Compliance Testing',
    fields: [
      { id: 'employeeId', label: 'Employee ID', required: true },
      { id: 'employeeName', label: 'Employee Name', required: true },
      { id: 'hceStatus', label: 'HCE Status', required: true },
      { id: 'compensation', label: 'Compensation', required: true },
      { id: 'deferrals', label: 'Deferrals' },
      { id: 'deferralPercentage', label: 'Deferral %' },
      { id: 'employerMatch', label: 'Employer Match' },
      { id: 'matchPercentage', label: 'Match %' },
      { id: 'afterTaxContributions', label: 'After-Tax Contributions' },
      { id: 'acpPercentage', label: 'ACP %' },
    ],
    supportedFormats: ['csv', 'excel', 'pdf'],
  },
  {
    id: 'top-heavy-test',
    name: 'Top Heavy Test Report',
    description: 'Analysis of key employee account balances for top heavy determination',
    category: 'Compliance Testing',
    fields: [
      { id: 'employeeId', label: 'Employee ID', required: true },
      { id: 'employeeName', label: 'Employee Name', required: true },
      { id: 'keyEmployee', label: 'Key Employee Status', required: true },
      { id: 'accountBalance', label: 'Account Balance', required: true },
      { id: 'ownershipPercentage', label: 'Ownership %' },
      { id: 'compensation', label: 'Compensation' },
      { id: 'familyAggregation', label: 'Family Aggregation' },
    ],
    supportedFormats: ['csv', 'excel', 'pdf'],
  },
  {
    id: 'coverage-test',
    name: '410(b) Coverage Test Report',
    description: 'Plan coverage testing for non-discrimination compliance',
    category: 'Compliance Testing',
    fields: [
      { id: 'employeeId', label: 'Employee ID', required: true },
      { id: 'employeeName', label: 'Employee Name', required: true },
      { id: 'eligibleStatus', label: 'Eligible Status', required: true },
      { id: 'participatingStatus', label: 'Participating Status', required: true },
      { id: 'hceStatus', label: 'HCE Status' },
      { id: 'excludedReason', label: 'Excluded Reason' },
      { id: 'hoursWorked', label: 'Hours Worked' },
      { id: 'hireDate', label: 'Hire Date' },
    ],
    supportedFormats: ['csv', 'excel', 'pdf'],
  },

  // Contribution Reports
  {
    id: 'contribution-summary',
    name: 'Contribution Summary Report',
    description: 'Summary of all contributions by type and participant',
    category: 'Contributions',
    fields: [
      { id: 'employeeId', label: 'Employee ID', required: true },
      { id: 'employeeName', label: 'Employee Name', required: true },
      { id: 'preTaxDeferral', label: 'Pre-Tax Deferral', required: true },
      { id: 'rothDeferral', label: 'Roth Deferral' },
      { id: 'employerMatch', label: 'Employer Match' },
      { id: 'profitSharing', label: 'Profit Sharing' },
      { id: 'safeHarbor', label: 'Safe Harbor' },
      { id: 'catchUp', label: 'Catch-Up' },
      { id: 'rollover', label: 'Rollover' },
      { id: 'totalContributions', label: 'Total Contributions' },
      { id: 'ytdContributions', label: 'YTD Contributions' },
    ],
    supportedFormats: ['csv', 'excel', 'pdf'],
  },
  {
    id: 'payroll-reconciliation',
    name: 'Payroll Reconciliation Report',
    description: 'Reconciliation of payroll contributions with plan deposits',
    category: 'Contributions',
    fields: [
      { id: 'payrollDate', label: 'Payroll Date', required: true },
      { id: 'payrollAmount', label: 'Payroll Amount', required: true },
      { id: 'depositDate', label: 'Deposit Date', required: true },
      { id: 'depositAmount', label: 'Deposit Amount', required: true },
      { id: 'variance', label: 'Variance' },
      { id: 'participantCount', label: 'Participant Count' },
      { id: 'status', label: 'Status' },
      { id: 'notes', label: 'Notes' },
    ],
    supportedFormats: ['csv', 'excel', 'pdf'],
  },
  {
    id: 'excess-contribution',
    name: 'Excess Contribution Report',
    description: 'Participants approaching or exceeding IRS contribution limits',
    category: 'Contributions',
    fields: [
      { id: 'employeeId', label: 'Employee ID', required: true },
      { id: 'employeeName', label: 'Employee Name', required: true },
      { id: 'ytdDeferral', label: 'YTD Deferral', required: true },
      { id: 'irsLimit', label: 'IRS Limit', required: true },
      { id: 'remainingRoom', label: 'Remaining Room' },
      { id: 'projectedYearEnd', label: 'Projected Year-End' },
      { id: 'age', label: 'Age' },
      { id: 'catchUpEligible', label: 'Catch-Up Eligible' },
      { id: 'excessAmount', label: 'Excess Amount' },
    ],
    supportedFormats: ['csv', 'excel', 'pdf'],
  },

  // Participant Reports
  {
    id: 'participant-census',
    name: 'Participant Census Report',
    description: 'Complete participant demographic and employment information',
    category: 'Participants',
    fields: [
      { id: 'employeeId', label: 'Employee ID', required: true },
      { id: 'firstName', label: 'First Name', required: true },
      { id: 'lastName', label: 'Last Name', required: true },
      { id: 'ssn', label: 'SSN (Last 4)' },
      { id: 'dateOfBirth', label: 'Date of Birth' },
      { id: 'hireDate', label: 'Hire Date' },
      { id: 'terminationDate', label: 'Termination Date' },
      { id: 'status', label: 'Status' },
      { id: 'compensation', label: 'Compensation' },
      { id: 'hoursWorked', label: 'Hours Worked' },
      { id: 'department', label: 'Department' },
      { id: 'hceStatus', label: 'HCE Status' },
    ],
    supportedFormats: ['csv', 'excel', 'pdf'],
  },
  {
    id: 'vesting-status',
    name: 'Vesting Status Report',
    description: 'Participant vesting schedules and vested balances',
    category: 'Participants',
    fields: [
      { id: 'employeeId', label: 'Employee ID', required: true },
      { id: 'employeeName', label: 'Employee Name', required: true },
      { id: 'yearsOfService', label: 'Years of Service', required: true },
      { id: 'vestingSchedule', label: 'Vesting Schedule', required: true },
      { id: 'vestingPercentage', label: 'Vesting %', required: true },
      { id: 'totalEmployerBalance', label: 'Total Employer Balance' },
      { id: 'vestedBalance', label: 'Vested Balance' },
      { id: 'forfeitureAmount', label: 'Potential Forfeiture' },
      { id: 'fullVestingDate', label: 'Full Vesting Date' },
    ],
    supportedFormats: ['csv', 'excel', 'pdf'],
  },
  {
    id: 'beneficiary-report',
    name: 'Beneficiary Report',
    description: 'Participant beneficiary designations and missing information',
    category: 'Participants',
    fields: [
      { id: 'employeeId', label: 'Employee ID', required: true },
      { id: 'employeeName', label: 'Employee Name', required: true },
      { id: 'primaryBeneficiary', label: 'Primary Beneficiary' },
      { id: 'primaryPercentage', label: 'Primary %' },
      { id: 'contingentBeneficiary', label: 'Contingent Beneficiary' },
      { id: 'contingentPercentage', label: 'Contingent %' },
      { id: 'designationDate', label: 'Designation Date' },
      { id: 'status', label: 'Status' },
    ],
    supportedFormats: ['csv', 'excel', 'pdf'],
  },

  // Distribution Reports
  {
    id: 'distribution-summary',
    name: 'Distribution Summary Report',
    description: 'Summary of all distributions and withdrawals',
    category: 'Distributions',
    fields: [
      { id: 'distributionId', label: 'Distribution ID', required: true },
      { id: 'employeeId', label: 'Employee ID', required: true },
      { id: 'employeeName', label: 'Employee Name', required: true },
      { id: 'distributionType', label: 'Type', required: true },
      { id: 'amount', label: 'Amount', required: true },
      { id: 'taxWithholding', label: 'Tax Withheld' },
      { id: 'netAmount', label: 'Net Amount' },
      { id: 'requestDate', label: 'Request Date' },
      { id: 'processDate', label: 'Process Date' },
      { id: 'status', label: 'Status' },
    ],
    supportedFormats: ['csv', 'excel', 'pdf'],
  },
  {
    id: 'loan-status',
    name: 'Loan Status Report',
    description: 'Active loans, repayment status, and delinquencies',
    category: 'Distributions',
    fields: [
      { id: 'loanId', label: 'Loan ID', required: true },
      { id: 'employeeId', label: 'Employee ID', required: true },
      { id: 'employeeName', label: 'Employee Name', required: true },
      { id: 'originalAmount', label: 'Original Amount', required: true },
      { id: 'outstandingBalance', label: 'Outstanding Balance', required: true },
      { id: 'interestRate', label: 'Interest Rate' },
      { id: 'paymentAmount', label: 'Payment Amount' },
      { id: 'nextPaymentDate', label: 'Next Payment Date' },
      { id: 'maturityDate', label: 'Maturity Date' },
      { id: 'status', label: 'Status' },
      { id: 'delinquentAmount', label: 'Delinquent Amount' },
    ],
    supportedFormats: ['csv', 'excel', 'pdf'],
  },
  {
    id: 'rmd-report',
    name: 'Required Minimum Distribution Report',
    description: 'Participants subject to RMD and distribution status',
    category: 'Distributions',
    fields: [
      { id: 'employeeId', label: 'Employee ID', required: true },
      { id: 'employeeName', label: 'Employee Name', required: true },
      { id: 'dateOfBirth', label: 'Date of Birth', required: true },
      { id: 'age', label: 'Age', required: true },
      { id: 'accountBalance', label: 'Account Balance' },
      { id: 'rmdAmount', label: 'RMD Amount' },
      { id: 'distributedYTD', label: 'Distributed YTD' },
      { id: 'remainingRMD', label: 'Remaining RMD' },
      { id: 'rmdDeadline', label: 'RMD Deadline' },
      { id: 'status', label: 'Status' },
    ],
    supportedFormats: ['csv', 'excel', 'pdf'],
  },

  // Investment Reports
  {
    id: 'investment-allocation',
    name: 'Investment Allocation Report',
    description: 'Participant investment elections and current allocations',
    category: 'Investments',
    fields: [
      { id: 'employeeId', label: 'Employee ID', required: true },
      { id: 'employeeName', label: 'Employee Name', required: true },
      { id: 'fundName', label: 'Fund Name', required: true },
      { id: 'currentAllocation', label: 'Current Allocation %' },
      { id: 'futureAllocation', label: 'Future Allocation %' },
      { id: 'balance', label: 'Balance' },
      { id: 'shares', label: 'Shares' },
      { id: 'nav', label: 'NAV' },
    ],
    supportedFormats: ['csv', 'excel', 'pdf'],
  },
  {
    id: 'fund-performance',
    name: 'Fund Performance Report',
    description: 'Investment fund performance and fee analysis',
    category: 'Investments',
    fields: [
      { id: 'fundName', label: 'Fund Name', required: true },
      { id: 'ticker', label: 'Ticker', required: true },
      { id: 'assetClass', label: 'Asset Class' },
      { id: 'ytdReturn', label: 'YTD Return' },
      { id: 'oneYearReturn', label: '1-Year Return' },
      { id: 'threeYearReturn', label: '3-Year Return' },
      { id: 'fiveYearReturn', label: '5-Year Return' },
      { id: 'expenseRatio', label: 'Expense Ratio' },
      { id: 'totalAssets', label: 'Total Assets' },
    ],
    supportedFormats: ['csv', 'excel', 'pdf'],
  },

  // Form 5500 Reports
  {
    id: 'form-5500-data',
    name: 'Form 5500 Data Report',
    description: 'Data required for annual Form 5500 filing',
    category: 'Regulatory',
    fields: [
      { id: 'planName', label: 'Plan Name', required: true },
      { id: 'ein', label: 'EIN', required: true },
      { id: 'planNumber', label: 'Plan Number', required: true },
      { id: 'planYear', label: 'Plan Year', required: true },
      { id: 'totalParticipants', label: 'Total Participants' },
      { id: 'activeParticipants', label: 'Active Participants' },
      { id: 'retiredParticipants', label: 'Retired Participants' },
      { id: 'totalAssets', label: 'Total Assets' },
      { id: 'contributions', label: 'Contributions' },
      { id: 'distributions', label: 'Distributions' },
      { id: 'expenses', label: 'Administrative Expenses' },
    ],
    supportedFormats: ['csv', 'excel', 'pdf'],
  },
];

/**
 * Get report template by ID
 */
export function getReportTemplate(id: string): ReportTemplate | undefined {
  return REPORT_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get report templates by category
 */
export function getReportsByCategory(category: string): ReportTemplate[] {
  return REPORT_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get all report categories
 */
export function getReportCategories(): string[] {
  const categories = new Set(REPORT_TEMPLATES.map((t) => t.category));
  return Array.from(categories);
}
