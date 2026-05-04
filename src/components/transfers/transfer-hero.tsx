'use client';

import { cn, formatCurrency } from '@/lib/utils';

interface TransferHeroProps {
  label: string;
  amount: number;
  meta?: {
    left?: string;
    right?: string;
  };
  progress?: {
    value: number;
    complete?: boolean;
  };
}

export function TransferHero({ label, amount, meta, progress }: TransferHeroProps) {
  return (
    <div className="rounded-xl border border-[#0e52e8] bg-white px-5 py-6 mb-4 shadow-[0_0_8px_0_rgba(201,203,255,1)]">
      <p className="text-[14px] font-normal text-[#6c6d74]">{label}</p>
      <p className="mt-3 text-[32px] font-medium leading-none text-[#4a4b50] tabular-nums">
        {formatCurrency(amount)}
      </p>
      {meta && (
        <div className="mt-4 flex items-center justify-between text-[13px]">
          <span className="text-[#6c6d74]">{meta.left}</span>
          <span
            className={cn(
              'font-mono',
              progress?.complete ? 'text-success font-medium' : 'text-[#4a4b50]',
            )}
          >
            {meta.right}
          </span>
        </div>
      )}
      {progress && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              progress.complete ? 'bg-success' : 'bg-primary',
            )}
            style={{ width: `${Math.min(100, Math.max(0, progress.value))}%` }}
          />
        </div>
      )}
    </div>
  );
}
