'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconArrowRight,
  IconArrowLeft,
  IconTarget,
  IconShieldCheck,
  IconTrendingUp,
  IconCheck,
  IconChartPie,
  IconScale,
  IconLeaf,
  IconRocket,
  IconLoader2,
  IconInfoCircle,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FormSelect } from '@/components/ui/FormSelect';
import { Skeleton } from '@/components/ui/skeleton';
import { OnboardingLayout } from '@/components/onboarding';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/config/routes';
import { useSubmitRiskProfile } from '@/api/generated/endpoints/risk-profile/risk-profile';
import { useFindByRiskProfile, useGetPortfolio } from '@/api/generated/endpoints/model-portfolios/model-portfolios';
import type {
  RiskProfileRequest,
  RiskProfileResponse,
} from '@/api/generated/models';
import {
  RiskAnswersRetirementTimeHorizon,
  RiskAnswersIncomeStability,
  RiskAnswersInvestmentExperience,
  RiskAnswersMarketVolatilityReaction,
  RiskAnswersHistoricalRiskBehavior,
  RiskAnswersReturnExpectations,
  RiskAnswersSavingsConfidence,
} from '@/api/generated/models';
import { cn } from '@/lib/utils';

type FlowStep = 'questionnaire' | 'results' | 'portfolio';

interface RiskQuestion {
  id: keyof typeof QUESTION_KEYS;
  question: string;
  description: string;
  options: { label: string; value: string }[];
}

const QUESTION_KEYS = {
  retirementTimeHorizon: 'retirementTimeHorizon',
  incomeStability: 'incomeStability',
  investmentExperience: 'investmentExperience',
  marketVolatilityReaction: 'marketVolatilityReaction',
  historicalRiskBehavior: 'historicalRiskBehavior',
  returnExpectations: 'returnExpectations',
  savingsConfidence: 'savingsConfidence',
} as const;

// FINRA/DOL compliant risk profiling questions based on industry standards
const riskQuestions: RiskQuestion[] = [
  {
    id: 'retirementTimeHorizon',
    question: 'When do you plan to retire?',
    description: 'Your investment time horizon affects how much risk you can take. Longer horizons allow more time to recover from market downturns.',
    options: [
      { label: 'Before age 60', value: RiskAnswersRetirementTimeHorizon.BEFORE_60 },
      { label: 'Age 60-64', value: RiskAnswersRetirementTimeHorizon.AGE_60_64 },
      { label: 'Age 65-69', value: RiskAnswersRetirementTimeHorizon.AGE_65_69 },
      { label: 'Age 70 or later', value: RiskAnswersRetirementTimeHorizon.AGE_70_OR_LATER },
      { label: "I'm not sure", value: RiskAnswersRetirementTimeHorizon.NOT_SURE },
    ],
  },
  {
    id: 'incomeStability',
    question: 'How stable is your current income?',
    description: 'Stable income allows for more aggressive investing since you have a reliable financial cushion.',
    options: [
      { label: 'Very unpredictable - income varies significantly', value: RiskAnswersIncomeStability.VERY_UNPREDICTABLE },
      { label: 'Somewhat stable - occasional fluctuations', value: RiskAnswersIncomeStability.SOMEWHAT_STABLE },
      { label: 'Stable - consistent income', value: RiskAnswersIncomeStability.STABLE },
      { label: 'Very secure - guaranteed income source', value: RiskAnswersIncomeStability.VERY_SECURE },
    ],
  },
  {
    id: 'investmentExperience',
    question: 'How would you describe your investment experience?',
    description: 'Experience with investing affects your comfort level with market fluctuations and complex investment decisions.',
    options: [
      { label: 'No experience - new to investing', value: RiskAnswersInvestmentExperience.NONE },
      { label: 'Limited - basic understanding of stocks and bonds', value: RiskAnswersInvestmentExperience.LIMITED },
      { label: 'Moderate - comfortable with most investment concepts', value: RiskAnswersInvestmentExperience.MODERATE },
      { label: 'Advanced - extensive knowledge and active investor', value: RiskAnswersInvestmentExperience.ADVANCED },
    ],
  },
  {
    id: 'marketVolatilityReaction',
    question: 'If your investments dropped 20% in value, what would you do?',
    description: 'Your reaction to market volatility reveals your true risk tolerance and emotional capacity for investment risk.',
    options: [
      { label: 'Sell everything to prevent further losses', value: RiskAnswersMarketVolatilityReaction.SELL_EVERYTHING },
      { label: 'Sell some investments to reduce exposure', value: RiskAnswersMarketVolatilityReaction.REDUCE_INVESTMENTS },
      { label: 'Stay invested and wait for recovery', value: RiskAnswersMarketVolatilityReaction.STAY_INVESTED },
      { label: 'Invest more to take advantage of lower prices', value: RiskAnswersMarketVolatilityReaction.INVEST_MORE },
    ],
  },
  {
    id: 'historicalRiskBehavior',
    question: 'How would you describe your past investment decisions?',
    description: 'Past behavior is often the best predictor of future investment decisions under stress.',
    options: [
      { label: 'I have always avoided risk - safety first', value: RiskAnswersHistoricalRiskBehavior.AVOID_RISK },
      { label: 'I take small, calculated risks', value: RiskAnswersHistoricalRiskBehavior.SMALL_RISKS },
      { label: 'I take moderate risks for potential gains', value: RiskAnswersHistoricalRiskBehavior.MODERATE_RISKS },
      { label: 'I take aggressive risks for higher returns', value: RiskAnswersHistoricalRiskBehavior.AGGRESSIVE_RISKS },
    ],
  },
  {
    id: 'returnExpectations',
    question: 'What average annual return do you expect from your investments?',
    description: 'Higher expected returns typically require accepting more investment risk and volatility.',
    options: [
      { label: '2-4% (Low risk, stable returns)', value: RiskAnswersReturnExpectations.TWO_TO_FOUR },
      { label: '5-6% (Moderate risk, balanced returns)', value: RiskAnswersReturnExpectations.FIVE_TO_SIX },
      { label: '7-8% (Higher risk, growth-oriented)', value: RiskAnswersReturnExpectations.SEVEN_TO_EIGHT },
      { label: '9%+ (Aggressive risk, maximum growth)', value: RiskAnswersReturnExpectations.NINE_PLUS },
    ],
  },
  {
    id: 'savingsConfidence',
    question: 'How confident are you in meeting your retirement savings goals?',
    description: 'Your confidence level helps us understand if you need a more conservative approach to protect what you have.',
    options: [
      { label: 'Not confident at all', value: RiskAnswersSavingsConfidence.NOT_CONFIDENT },
      { label: 'Somewhat confident', value: RiskAnswersSavingsConfidence.SOMEWHAT_CONFIDENT },
      { label: 'Confident', value: RiskAnswersSavingsConfidence.CONFIDENT },
      { label: 'Very confident', value: RiskAnswersSavingsConfidence.VERY_CONFIDENT },
    ],
  },
];

// Risk profile icons and colors
const riskProfileConfig: Record<string, { icon: typeof IconLeaf; color: string; bgColor: string }> = {
  'Capital Preservation': { icon: IconShieldCheck, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  'Conservative': { icon: IconLeaf, color: 'text-green-600', bgColor: 'bg-green-100' },
  'Moderate': { icon: IconScale, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  'Growth': { icon: IconTrendingUp, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  'Aggressive Growth': { icon: IconRocket, color: 'text-red-600', bgColor: 'bg-red-100' },
};

// Allocation bar colors
const ALLOCATION_COLORS = [
  'bg-green-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-yellow-500',
  'bg-red-500',
];

export default function RetirementPlansPage() {
  const router = useRouter();
  const submitRiskProfileMutation = useSubmitRiskProfile();

  const [currentStep, setCurrentStep] = useState<FlowStep>('questionnaire');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [riskResult, setRiskResult] = useState<RiskProfileResponse | null>(null);
  const [openInfoId, setOpenInfoId] = useState<string | null>(null);

  // Fetch portfolios matching the risk profile
  const riskProfileForQuery = riskResult?.riskProfile ?? '';
  const {
    data: portfoliosData,
    isLoading: isLoadingPortfoliosList,
    error: portfolioListError,
  } = useFindByRiskProfile(riskProfileForQuery, {
    query: {
      enabled: !!riskProfileForQuery && currentStep === 'portfolio',
    },
  });

  // Get the first portfolio ID from the list
  const portfolioId = portfoliosData?.[0]?.id ?? '';

  // Fetch the full portfolio with allocations using the portfolio ID
  const {
    data: portfolioWithAllocations,
    isLoading: isLoadingPortfolioDetails,
    error: portfolioDetailsError,
  } = useGetPortfolio(portfolioId, {
    query: {
      enabled: !!portfolioId && currentStep === 'portfolio',
    },
  });

  // Combined loading and error states
  const isLoadingPortfolio = isLoadingPortfoliosList || isLoadingPortfolioDetails;
  const portfolioError = portfolioListError || portfolioDetailsError;

  const allQuestionsAnswered = riskQuestions.every((q) => answers[q.id]);
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = riskQuestions.length;

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmitQuestionnaire = async () => {
    if (!allQuestionsAnswered) {
      toast.error('Please answer all questions', 'All questions must be answered to calculate your risk profile.');
      return;
    }

    try {
      const request: RiskProfileRequest = {
        answers: {
          retirementTimeHorizon: answers.retirementTimeHorizon as RiskProfileRequest['answers']['retirementTimeHorizon'],
          incomeStability: answers.incomeStability as RiskProfileRequest['answers']['incomeStability'],
          investmentExperience: answers.investmentExperience as RiskProfileRequest['answers']['investmentExperience'],
          marketVolatilityReaction: answers.marketVolatilityReaction as RiskProfileRequest['answers']['marketVolatilityReaction'],
          historicalRiskBehavior: answers.historicalRiskBehavior as RiskProfileRequest['answers']['historicalRiskBehavior'],
          returnExpectations: answers.returnExpectations as RiskProfileRequest['answers']['returnExpectations'],
          savingsConfidence: answers.savingsConfidence as RiskProfileRequest['answers']['savingsConfidence'],
        },
      };

      const result = await submitRiskProfileMutation.mutateAsync({ data: request });
      setRiskResult(result);
      setCurrentStep('results');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        'Submission failed',
        err?.response?.data?.message || 'Please try again.'
      );
    }
  };

  const handleViewPortfolio = () => {
    setCurrentStep('portfolio');
  };

  const handleConfirmPortfolio = () => {
    toast.success('Portfolio selected!', 'Your investment portfolio has been set up.');
    router.push(ROUTES.PARTICIPANT.CONTRIBUTIONS.ROOT);
  };

  const handleBack = () => {
    if (currentStep === 'results') {
      setCurrentStep('questionnaire');
    } else if (currentStep === 'portfolio') {
      setCurrentStep('results');
    } else {
      router.push(ROUTES.PARTICIPANT_ENROLLMENT.CHOOSE_INVESTMENT_PATH);
    }
  };

  const profileConfig = riskResult?.riskProfile ? riskProfileConfig[riskResult.riskProfile] : null;
  const ProfileIcon = profileConfig?.icon ?? IconTarget;
  // Use portfolio with full allocations from the detailed fetch
  const recommendedPortfolio = portfolioWithAllocations ?? portfoliosData?.[0];
  const hasPortfolioError = !!portfolioError;

  // Step 1: Questionnaire
  if (currentStep === 'questionnaire') {
    return (
      <OnboardingLayout
        title="Personalize Your Portfolio"
        description="Answer a few questions to tailor an investment strategy based on your goals and risk tolerance"
        maxWidth="lg"
      >
        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <IconTarget className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">
                {answeredCount} of {totalQuestions} questions answered
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {Math.round((answeredCount / totalQuestions) * 100)}%
              </span>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            {riskQuestions.map((question, index) => (
              <div
                key={question.id}
                className="space-y-3 p-4 rounded-lg border bg-muted/40 hover:border-primary/40 transition-colors"
              >
                <Label
                  htmlFor={question.id}
                  className="text-sm font-medium flex items-start gap-2"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="flex items-center gap-2 flex-1">
                    {question.question}
                    <button
                      type="button"
                      onClick={() =>
                        setOpenInfoId((current) =>
                          current === question.id ? null : question.id
                        )
                      }
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label="More information"
                    >
                      <IconInfoCircle className="h-4 w-4" />
                    </button>
                  </span>
                </Label>
                {openInfoId === question.id && (
                  <p className="text-xs text-muted-foreground ml-8 mt-1">
                    {question.description}
                  </p>
                )}
                <div className="ml-8 max-w-md">
                  <FormSelect
                    label=""
                    options={question.options}
                    value={answers[question.id] || ''}
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                    placeholder="Select an option..."
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <IconShieldCheck className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Your answers are confidential</p>
              <p className="text-xs text-muted-foreground mt-1">
                We use this information only to recommend an appropriate investment mix based on your
                risk tolerance and time horizon. You can change your portfolio at any time.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={submitRiskProfileMutation.isPending}
              size="default"
              className="min-w-[140px] text-sm"
            >
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              type="button"
              onClick={handleSubmitQuestionnaire}
              disabled={!allQuestionsAnswered || submitRiskProfileMutation.isPending}
              loading={submitRiskProfileMutation.isPending}
              loadingText="Calculating..."
              size="default"
              className="min-w-[140px] text-sm"
            >
              Calculate My Risk Profile
              <IconArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </OnboardingLayout>
    );
  }

  // Step 2: Results
  if (currentStep === 'results') {
    return (
      <OnboardingLayout
        title="Your Risk Profile"
        description="Based on your answers, we've determined your investment risk profile"
        maxWidth="lg"
      >
        <div className="space-y-6">
          {/* Risk Profile Card */}
          <div className="p-6 rounded-xl border-2 border-primary bg-primary/5">
            <div className="flex items-center gap-4 mb-4">
              <div className={cn('p-4 rounded-full', profileConfig?.bgColor ?? 'bg-primary/10')}>
                <ProfileIcon className={cn('h-8 w-8', profileConfig?.color ?? 'text-primary')} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your Risk Profile</p>
                <h2 className="text-2xl font-bold">{riskResult?.riskProfile}</h2>
              </div>
            </div>

            {/* Risk Score */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Risk Score</span>
                <span className="font-medium">{riskResult?.riskScore} / 28</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500 transition-all duration-500"
                  style={{ width: `${((riskResult?.riskScore ?? 0) / 28) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Conservative</span>
                <span>Aggressive</span>
              </div>
            </div>

            {/* Description */}
            {riskResult?.description && (
              <p className="text-sm text-muted-foreground">{riskResult.description}</p>
            )}
          </div>

          {/* Industry Compliance Notice */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <IconShieldCheck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">ERISA Compliant Assessment</p>
              <p className="text-xs text-muted-foreground mt-1">
                This risk assessment follows DOL guidelines and FINRA suitability standards
                to ensure your investment recommendations are appropriate for your situation.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              size="default"
              className="min-w-[140px] text-sm"
            >
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Retake Assessment
            </Button>
            <Button
              type="button"
              onClick={handleViewPortfolio}
              size="default"
              className="min-w-[140px] text-sm"
            >
              View Recommended Portfolio
              <IconArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </OnboardingLayout>
    );
  }

  // Step 3: Portfolio Confirmation
  return (
    <OnboardingLayout
      title="Your Recommended Portfolio"
      description="Based on your risk profile, we recommend the following investment allocation"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Loading State */}
        {isLoadingPortfolio && (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {/* Error State */}
        {hasPortfolioError && !isLoadingPortfolio && (
          <div className="p-6 rounded-lg border border-destructive/50 bg-destructive/10 text-center">
            <p className="text-sm text-destructive mb-2">Unable to load portfolio recommendations</p>
            <p className="text-xs text-muted-foreground">
              Please contact your plan administrator to ensure portfolios are configured for your risk profile.
            </p>
          </div>
        )}

        {/* Portfolio Content */}
        {!isLoadingPortfolio && !hasPortfolioError && (
          <>
            {/* Portfolio Header */}
            <div className="p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-3 mb-2">
                <div className={cn('p-2 rounded-full', profileConfig?.bgColor ?? 'bg-primary/10')}>
                  <IconChartPie className={cn('h-5 w-5', profileConfig?.color ?? 'text-primary')} />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {recommendedPortfolio?.portfolioName ?? `${riskResult?.riskProfile} Portfolio`}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {recommendedPortfolio?.description ?? `Aligned with your ${riskResult?.riskProfile} risk profile`}
                  </p>
                </div>
              </div>
            </div>

            {/* Portfolio Investments */}
            {recommendedPortfolio && (
              <div className="p-6 rounded-lg border bg-card">
                <h4 className="font-medium mb-4">Portfolio Investments</h4>

                {/* Show allocation bar if allocations exist */}
                {recommendedPortfolio.allocations && recommendedPortfolio.allocations.length > 0 && (
                  <div className="h-8 rounded-full overflow-hidden flex mb-6">
                    {recommendedPortfolio.allocations.map((allocation, i) => (
                      <div
                        key={allocation.fundId ?? i}
                        className={cn('h-full transition-all', ALLOCATION_COLORS[i % ALLOCATION_COLORS.length])}
                        style={{ width: `${allocation.allocationPercentage ?? 0}%` }}
                        title={`${allocation.fundName}: ${allocation.allocationPercentage}%`}
                      />
                    ))}
                  </div>
                )}

                {/* Funds Table - Show funds from allocations if available, otherwise show all active funds */}
                {recommendedPortfolio.allocations && recommendedPortfolio.allocations.length > 0 ? (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-3 font-medium text-sm text-muted-foreground">Fund Name</th>
                            <th className="text-right p-3 font-medium text-sm text-muted-foreground">Allocation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recommendedPortfolio.allocations
                            .sort((a, b) => (b.allocationPercentage ?? 0) - (a.allocationPercentage ?? 0))
                            .map((allocation, i) => (
                              <tr key={allocation.fundId ?? i} className="border-b hover:bg-muted/50">
                                <td className="p-3">
                                  <div>
                                    <p className="font-medium text-sm">{allocation.fundName ?? 'Unknown Fund'}</p>
                                    {allocation.ticker && (
                                      <p className="text-xs text-muted-foreground">{allocation.ticker}</p>
                                    )}
                                    {allocation.bucket && (
                                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                                        {allocation.bucket}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="p-3 text-right">
                                  <span className="font-medium tabular-nums">
                                    {allocation.allocationPercentage?.toFixed(1) ?? '0.0'}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Total Allocation Indicator */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Total Allocation</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-success">
                            {recommendedPortfolio.allocations
                              .reduce((sum, a) => sum + (a.allocationPercentage ?? 0), 0)
                              .toFixed(1)}%
                          </span>
                          <IconCheck className="h-4 w-4 text-success" />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-6 rounded-lg border border-amber-200 bg-amber-50">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-full bg-amber-100 flex-shrink-0">
                        <IconAlertTriangle className="h-6 w-6 text-amber-600" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-amber-800">Portfolio Setup In Progress</h4>
                        <p className="text-sm text-amber-700">
                          Your <span className="font-semibold">{riskResult?.riskProfile}</span> portfolio has been selected,
                          but the specific fund allocations are still being configured by your plan administrator.
                        </p>
                        <div className="pt-2 space-y-1">
                          <p className="text-xs text-amber-600 font-medium">What this means:</p>
                          <ul className="text-xs text-amber-600 list-disc list-inside space-y-0.5">
                            <li>Your risk profile has been saved</li>
                            <li>Fund allocations will be set up shortly</li>
                            <li>You can proceed and allocations will be applied automatically</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Key Features */}
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-3">Portfolio Features</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <IconCheck className="h-4 w-4 text-success" />
                  <span>Automatic rebalancing</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <IconCheck className="h-4 w-4 text-success" />
                  <span>Low-cost index funds</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <IconCheck className="h-4 w-4 text-success" />
                  <span>Diversified holdings</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <IconCheck className="h-4 w-4 text-success" />
                  <span>Professional management</span>
                </div>
              </div>
            </div>

            {/* QDIA Notice if applicable */}
            {recommendedPortfolio?.isQdia && (
              <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200">
                <IconShieldCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Qualified Default Investment Alternative (QDIA)</p>
                  <p className="text-xs text-blue-600 mt-1">
                    This portfolio meets DOL requirements under ERISA Section 404(c)(5) as a qualified
                    default investment alternative, providing fiduciary protection for your employer.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            size="default"
            className="min-w-[140px] text-sm"
          >
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            type="button"
            onClick={handleConfirmPortfolio}
            disabled={isLoadingPortfolio}
            size="default"
            className="min-w-[140px] text-sm"
          >
            {isLoadingPortfolio ? (
              <>
                <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Confirm Portfolio
                <IconCheck className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Skip Option */}
        <p className="text-center text-xs text-muted-foreground">
          You can change your investment allocation at any time from your dashboard.
        </p>
      </div>
    </OnboardingLayout>
  );
}
