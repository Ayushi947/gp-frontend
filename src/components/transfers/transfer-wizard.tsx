'use client';

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import {
  getGetMyParticipantBalanceQueryKey,
  getGetMyParticipantPortfolioRowsQueryKey,
} from '@/api/generated/endpoints/investment-management/investment-management';
import {
  useCalculateRebalancingTrades,
  useExecuteRebalancing,
} from '@/api/generated/endpoints/fund-rebalancing/fund-rebalancing';
import type { FundRowDto, RebalancingTrade } from '@/api/generated/models';
import { ProgressStepper } from '@/components/onboarding';
import { StepFrom } from './step-from';
import { StepTo } from './step-to';
import { StepReview } from './step-review';
import { StepSuccess } from './step-success';
import {
  buildRebalancingRequest,
  computeSourceTotal,
  createEmptyRow,
  generateConfirmationNumber,
  type DestinationAllocation,
  type TransferRowState,
} from './transfer-utils';

type WizardStep = 'from' | 'to' | 'review' | 'success';

const STEP_NUMBER: Record<WizardStep, number> = {
  from: 1,
  to: 2,
  review: 3,
  success: 4,
};

interface TransferWizardProps {
  allFunds: FundRowDto[];
  fundsWithHoldings: FundRowDto[];
  totalBalance: number;
  participantId: string;
  onViewHistory: () => void;
}

export function TransferWizard({
  allFunds,
  fundsWithHoldings,
  totalBalance,
  participantId,
  onViewHistory,
}: TransferWizardProps) {
  const [step, setStep] = useState<WizardStep>('from');
  const [sources, setSources] = useState<TransferRowState[]>(() => [createEmptyRow()]);
  const [destinations, setDestinations] = useState<DestinationAllocation[]>([]);
  const [previewTrades, setPreviewTrades] = useState<RebalancingTrade[] | null>(null);
  const [confirmationNumber, setConfirmationNumber] = useState<string>('');
  const [submittedAmount, setSubmittedAmount] = useState<number>(0);
  const [submittedSourceCount, setSubmittedSourceCount] = useState<number>(0);
  const [submittedDestCount, setSubmittedDestCount] = useState<number>(0);

  const queryClient = useQueryClient();
  const effectiveDate = useMemo(() => new Date(), []);

  const sourceTotal = useMemo(
    () => computeSourceTotal(sources, fundsWithHoldings),
    [sources, fundsWithHoldings],
  );

  const sourceFundIds = useMemo(
    () => new Set(sources.map((r) => r.fundId).filter(Boolean) as string[]),
    [sources],
  );

  const calculateTradesMutation = useCalculateRebalancingTrades({
    mutation: {
      onError: (error: unknown) => {
        const message =
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Unable to preview rebalancing trades';
        toast.error(message);
      },
    },
  });

  const executeRebalancingMutation = useExecuteRebalancing({
    mutation: {
      onError: (error: unknown) => {
        const message =
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to execute transfer';
        toast.error(message);
      },
    },
  });

  const resetState = () => {
    setSources([createEmptyRow()]);
    setDestinations([]);
    setPreviewTrades(null);
    setConfirmationNumber('');
    setSubmittedAmount(0);
    setSubmittedSourceCount(0);
    setSubmittedDestCount(0);
    setStep('from');
  };

  const handleSourcesChange = (next: TransferRowState[]) => {
    setSources(next);
    setPreviewTrades(null);
  };

  const handleDestinationsChange = (next: DestinationAllocation[]) => {
    setDestinations(next);
    setPreviewTrades(null);
  };

  const handlePreviewTrades = async () => {
    try {
      const request = buildRebalancingRequest({
        participantId,
        sources,
        destinations,
        allFunds,
        totalBalance,
      });
      const resp = (await calculateTradesMutation.mutateAsync({ data: request })) as
        | RebalancingTrade[]
        | { trades?: RebalancingTrade[] }
        | undefined;
      const trades = Array.isArray(resp)
        ? resp
        : ((resp as { trades?: RebalancingTrade[] })?.trades ?? []);
      setPreviewTrades(trades);
    } catch (error: unknown) {
      const message =
        (error as Error)?.message ||
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Unable to preview rebalancing trades';
      toast.error(message);
    }
  };

  const handleConfirm = async () => {
    try {
      const request = buildRebalancingRequest({
        participantId,
        sources,
        destinations,
        allFunds,
        totalBalance,
      });
      const response = (await executeRebalancingMutation.mutateAsync({
        data: request,
      })) as { id?: string; rebalancingId?: string; confirmationNumber?: string } | undefined;

      const apiConfirmation =
        response?.confirmationNumber || response?.rebalancingId || response?.id;
      const confNumber = apiConfirmation
        ? `GP-${String(apiConfirmation).slice(-6).toUpperCase()}`
        : generateConfirmationNumber();

      const sourceCount = sources.filter((r) => r.fundId && r.value).length;
      const destCount = destinations.filter((d) => d.fundId && d.percent).length;

      setConfirmationNumber(confNumber);
      setSubmittedAmount(sourceTotal);
      setSubmittedSourceCount(sourceCount);
      setSubmittedDestCount(destCount);
      setStep('success');

      queryClient.invalidateQueries({ queryKey: getGetMyParticipantBalanceQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetMyParticipantPortfolioRowsQueryKey() });
    } catch (error: unknown) {
      const message =
        (error as Error)?.message ||
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to execute transfer';
      toast.error(message);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      {step !== 'success' && (
        <ProgressStepper
          currentStep={STEP_NUMBER[step]}
          totalSteps={4}
          stepLabels={['From', 'To', 'Review', 'Done']}
          className="mb-6"
        />
      )}

      {step === 'from' && (
        <StepFrom
          fundsWithHoldings={fundsWithHoldings}
          totalBalance={totalBalance}
          sources={sources}
          onChange={handleSourcesChange}
          onNext={() => setStep('to')}
        />
      )}

      {step === 'to' && (
        <StepTo
          allFunds={allFunds}
          sourceTotal={sourceTotal}
          sourceFundIds={sourceFundIds}
          destinations={destinations}
          onChange={handleDestinationsChange}
          onBack={() => setStep('from')}
          onNext={() => setStep('review')}
        />
      )}

      {step === 'review' && (
        <StepReview
          allFunds={allFunds}
          sources={sources}
          destinations={destinations}
          sourceTotal={sourceTotal}
          effectiveDate={effectiveDate}
          previewTrades={previewTrades}
          onPreviewTrades={handlePreviewTrades}
          onConfirm={handleConfirm}
          onBack={() => setStep('to')}
          isPreviewing={calculateTradesMutation.isPending}
          isSubmitting={executeRebalancingMutation.isPending}
        />
      )}

      {step === 'success' && (
        <StepSuccess
          amount={submittedAmount}
          sourceCount={submittedSourceCount}
          destinationCount={submittedDestCount}
          confirmationNumber={confirmationNumber}
          effectiveDate={effectiveDate}
          onViewActivity={() => {
            resetState();
            onViewHistory();
          }}
          onDone={resetState}
        />
      )}
    </div>
  );
}
