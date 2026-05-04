import type { FundRowDto, RebalancingRequest } from '@/api/generated/models';

export type TransferRowMode = 'amount' | 'percent';

export interface TransferRowState {
  rowId: string;
  fundId: string;
  mode: TransferRowMode;
  value: string;
}

export interface DestinationAllocation {
  fundId: string;
  percent: string;
}

export function createEmptyRow(): TransferRowState {
  const rowId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return { rowId, fundId: '', mode: 'amount', value: '' };
}

export function formatDollar(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

export function resolveSourceRowDollars(
  row: TransferRowState,
  fund: FundRowDto | undefined,
): number {
  const raw = parseFloat(row.value);
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  if (row.mode === 'amount') return raw;
  const marketValue = fund?.marketValue ?? 0;
  return (marketValue * raw) / 100;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  rowErrors: Record<string, string>;
}

export function validateSources(input: {
  sources: TransferRowState[];
  allFunds: FundRowDto[];
}): ValidationResult {
  const errors: string[] = [];
  const rowErrors: Record<string, string> = {};
  const fundsById = new Map(input.allFunds.map((f) => [f.fundId ?? '', f]));
  const sources = input.sources.filter((r) => r.fundId && r.value);

  if (sources.length === 0) errors.push('Pick at least one fund to transfer from');

  for (const row of sources) {
    const n = parseFloat(row.value);
    if (!Number.isFinite(n) || n <= 0) {
      rowErrors[row.rowId] = 'Enter an amount greater than zero';
      continue;
    }
    if (row.mode === 'percent' && (n < 0 || n > 100)) {
      rowErrors[row.rowId] = 'Percent must be between 0 and 100';
      continue;
    }
    const fund = fundsById.get(row.fundId);
    const dollars = resolveSourceRowDollars(row, fund);
    const available = fund?.marketValue ?? 0;
    if (dollars > available + 0.005) {
      rowErrors[row.rowId] = `Cannot transfer more than ${formatDollar(available)} from ${fund?.name ?? 'this fund'}`;
    }
  }

  return {
    ok: errors.length === 0 && Object.keys(rowErrors).length === 0,
    errors,
    rowErrors,
  };
}

export function validateDestinations(input: {
  destinations: DestinationAllocation[];
  sourceFundIds: Set<string>;
  allFunds: FundRowDto[];
}): ValidationResult {
  const errors: string[] = [];
  const rowErrors: Record<string, string> = {};
  const fundsById = new Map(input.allFunds.map((f) => [f.fundId ?? '', f]));

  const active = input.destinations.filter((d) => d.fundId && d.percent);
  if (active.length === 0) {
    errors.push('Pick at least one fund to transfer into');
  }

  for (const d of active) {
    if (input.sourceFundIds.has(d.fundId)) {
      const fund = fundsById.get(d.fundId);
      errors.push(`${fund?.name ?? 'Fund'} cannot be both a source and a destination`);
    }
    const pct = parseFloat(d.percent);
    if (!Number.isFinite(pct) || pct <= 0) {
      rowErrors[d.fundId] = 'Enter a percent greater than zero';
    } else if (pct > 100) {
      rowErrors[d.fundId] = 'Percent must be 100 or less';
    }
  }

  const sum = active.reduce((s, d) => s + (parseFloat(d.percent) || 0), 0);
  if (active.length > 0 && Math.abs(sum - 100) > 0.01) {
    errors.push(`Allocation must total 100% (currently ${sum.toFixed(0)}%)`);
  }

  return {
    ok: errors.length === 0 && Object.keys(rowErrors).length === 0,
    errors,
    rowErrors,
  };
}

export function computeSourceTotal(
  sources: TransferRowState[],
  allFunds: FundRowDto[],
): number {
  const fundsById = new Map(allFunds.map((f) => [f.fundId ?? '', f]));
  return sources.reduce((sum, r) => {
    if (!r.fundId || !r.value) return sum;
    return sum + resolveSourceRowDollars(r, fundsById.get(r.fundId));
  }, 0);
}

export function computeDestinationPercentTotal(
  destinations: DestinationAllocation[],
): number {
  return destinations.reduce((s, d) => {
    const n = parseFloat(d.percent);
    return s + (Number.isFinite(n) ? n : 0);
  }, 0);
}

export function buildRebalancingRequest(input: {
  participantId: string;
  sources: TransferRowState[];
  destinations: DestinationAllocation[];
  allFunds: FundRowDto[];
  totalBalance: number;
}): RebalancingRequest {
  const { participantId, sources, destinations, allFunds, totalBalance } = input;

  if (!participantId) throw new Error('Participant information is still loading');
  if (totalBalance <= 0) throw new Error('Portfolio balance is zero');

  const fundsById = new Map(allFunds.map((f) => [f.fundId ?? '', f]));

  const activeSources = sources.filter((r) => r.fundId && r.value);
  const activeDest = destinations.filter((d) => d.fundId && d.percent);
  if (activeSources.length === 0 || activeDest.length === 0) {
    throw new Error('Add at least one source and one destination');
  }

  const sourceDollarsByFund = new Map<string, number>();
  for (const r of activeSources) {
    const fund = fundsById.get(r.fundId);
    const dollars = resolveSourceRowDollars(r, fund);
    if (dollars <= 0) continue;
    sourceDollarsByFund.set(r.fundId, (sourceDollarsByFund.get(r.fundId) ?? 0) + dollars);
  }

  const totalSource = Array.from(sourceDollarsByFund.values()).reduce((s, v) => s + v, 0);
  if (totalSource <= 0) throw new Error('Source amounts must be positive');

  const pctSum = activeDest.reduce((s, d) => s + (parseFloat(d.percent) || 0), 0);
  if (Math.abs(pctSum - 100) > 0.01) {
    throw new Error(`Destination allocation must total 100% (got ${pctSum.toFixed(2)}%)`);
  }

  const destDollarsByFund = new Map<string, number>();
  for (const d of activeDest) {
    const pct = parseFloat(d.percent) || 0;
    const dollars = (totalSource * pct) / 100;
    destDollarsByFund.set(d.fundId, (destDollarsByFund.get(d.fundId) ?? 0) + dollars);
  }

  const targetValues: Record<string, number> = {};
  for (const fund of allFunds) {
    if (!fund.fundId) continue;
    const current = fund.marketValue ?? 0;
    if (current > 0) targetValues[fund.fundId] = current;
  }
  for (const [fundId, dollars] of sourceDollarsByFund.entries()) {
    targetValues[fundId] = Math.max(0, (targetValues[fundId] ?? 0) - dollars);
  }
  for (const [fundId, dollars] of destDollarsByFund.entries()) {
    targetValues[fundId] = (targetValues[fundId] ?? 0) + dollars;
  }

  const total = Object.values(targetValues).reduce((s, v) => s + v, 0);
  if (total <= 0) throw new Error('Computed total allocation is zero');

  const entries = Object.entries(targetValues)
    .filter(([, v]) => v > 0)
    .sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) throw new Error('No funds in resulting allocation');

  const targetAllocation: Record<string, number> = {};
  let runningSum = 0;
  entries.forEach(([fundId, value], idx) => {
    if (idx === entries.length - 1) {
      targetAllocation[fundId] = Number((100 - runningSum).toFixed(4));
    } else {
      const pct = Number(((value / total) * 100).toFixed(4));
      targetAllocation[fundId] = pct;
      runningSum += pct;
    }
  });

  return {
    participantId,
    targetAllocation,
    rebalancingDate: new Date().toISOString().slice(0, 10),
    rebalancingThreshold: 0.01,
    forceRebalancing: true,
    rebalancingType: 'MANUAL',
  };
}

const FUND_PALETTE: readonly string[] = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const DEFAULT_FUND_COLOR = 'hsl(var(--chart-1))';

export function colorForFund(fundId: string | undefined): string {
  if (!fundId) return DEFAULT_FUND_COLOR;
  let hash = 0;
  for (let i = 0; i < fundId.length; i++) {
    hash = (hash * 31 + fundId.charCodeAt(i)) >>> 0;
  }
  return FUND_PALETTE[hash % FUND_PALETTE.length] ?? DEFAULT_FUND_COLOR;
}

export function generateConfirmationNumber(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `GP-${n}`;
}
