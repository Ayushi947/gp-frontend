'use client';

import { useState, useEffect } from 'react';
import {
  IconUser,
  IconCash,
  IconWallet,
  IconUsers,
  IconCheck,
  IconChevronRight,
  IconChevronLeft,
  IconBuildingBank,
  IconPercentage,
  IconShieldCheck,
  IconRocket,
  IconInfoCircle,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, formatCurrency } from '@/lib/utils';
import { toast } from '@/lib/toast';
import {
  useGetParticipantPersonalDetails,
  useUpdateParticipantPersonalDetails,
  useUpdateSelfContributionRates,
  useUpdateBeneficiary,
} from '@/api/generated/endpoints/participants/participants';
import { useListPortfolios } from '@/api/generated/endpoints/model-portfolios/model-portfolios';
import { useElectPortfolio } from '@/api/generated/endpoints/participant-portfolio-assignment/participant-portfolio-assignment';
import type {
  PersonalDetailsRequestDTO,
  UpdateContributionRatesRequest,
  UpdateBeneficiaryBody,
  ModelPortfolioDTO,
} from '@/api/generated/models';
import { Skeleton } from '@/components/ui/skeleton';

interface StepProps {
  onNext: () => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const steps = [
  { id: 'welcome', title: 'Welcome', icon: IconBuildingBank },
  { id: 'personal', title: 'Personal Info', icon: IconUser },
  { id: 'contribution', title: 'Contribution', icon: IconCash },
  { id: 'investments', title: 'Investments', icon: IconWallet },
  { id: 'beneficiaries', title: 'Beneficiaries', icon: IconUsers },
  { id: 'review', title: 'Review', icon: IconCheck },
];

/**
 * Progress Indicator
 */
function ProgressIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                index < currentStep
                  ? 'bg-primary border-primary text-primary-foreground'
                  : index === currentStep
                  ? 'border-primary text-primary'
                  : 'border-muted text-muted-foreground'
              )}
            >
              {index < currentStep ? (
                <IconCheck className="h-5 w-5" />
              ) : (
                <step.icon className="h-5 w-5" />
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-6 sm:w-12 lg:w-20 mx-1 sm:mx-2',
                  index < currentStep ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </div>
      <Progress value={((currentStep + 1) / steps.length) * 100} className="h-2" />
    </div>
  );
}

/**
 * Step 1: Welcome
 */
function WelcomeStep({ onNext }: StepProps) {
  return (
    <Card>
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconRocket className="h-8 w-8" />
          </div>
        </div>
        <CardTitle className="text-2xl">Welcome to Your 401(k)!</CardTitle>
        <CardDescription className="text-base">
          Take the first step toward a secure retirement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <IconCash className="h-8 w-8 mx-auto mb-2 text-primary" />
            <h4 className="font-medium">Save Pre-Tax</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Reduce your taxable income
            </p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <IconPercentage className="h-8 w-8 mx-auto mb-2 text-success" />
            <h4 className="font-medium">Employer Match</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Get free money from your employer
            </p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <IconWallet className="h-8 w-8 mx-auto mb-2 text-warning" />
            <h4 className="font-medium">Grow Wealth</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Invest for your future
            </p>
          </div>
        </div>

        <div className="p-4 border rounded-lg bg-success/5 border-success/20">
          <div className="flex items-start gap-3">
            <IconShieldCheck className="h-6 w-6 text-success shrink-0" />
            <div>
              <h4 className="font-medium text-success">Your Employer Offers:</h4>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>Employer matching contributions</li>
                <li>Professional investment management</li>
                <li>Tax-advantaged retirement savings</li>
              </ul>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground text-center">
          This enrollment takes about 5 minutes to complete.
        </p>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button size="lg" onClick={onNext}>
          Let&apos;s Get Started
          <IconChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Step 2: Personal Information
 */
interface PersonalInfoStepProps extends StepProps {
  personalData: any;
  setPersonalData: (data: any) => void;
}

function PersonalInfoStep({ onNext, onBack, personalData, setPersonalData }: PersonalInfoStepProps) {
  const { data: existingData, isLoading } = useGetParticipantPersonalDetails();
  const updateMutation = useUpdateParticipantPersonalDetails({
    mutation: {
      onSuccess: () => {
        toast.success('Personal information saved');
        onNext();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to save personal information';
        toast.error('Save Failed', message);
      },
    },
  });

  // Load existing data when available
  useEffect(() => {
    if (existingData && !personalData.firstName) {
      const [firstName, ...lastNameParts] = existingData.fullName?.split(' ') || [];
      const lastName = lastNameParts.join(' ');

      setPersonalData({
        firstName: firstName || '',
        lastName: lastName || '',
        dateOfBirth: existingData.dateOfBirth || '',
        email: existingData.emailAddress || '',
        phoneNumber: existingData.phoneNumber || '',
        // This assumes the address from the backend is a simple string.
        // The form has separate fields which is a mismatch. We'll populate line 1 for now.
        addressLine1: existingData.address || '',
      });
    }
  }, [existingData, personalData, setPersonalData]);

  const handleSave = () => {
    // Basic validation
    if (!personalData.firstName || !personalData.lastName || !personalData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    const requestData: PersonalDetailsRequestDTO = {
      fullName: `${personalData.firstName} ${personalData.lastName}`,
      dateOfBirth: personalData.dateOfBirth,
      phoneNumber: personalData.phoneNumber,
      emailAddress: personalData.email,
      address: [
        personalData.addressLine1,
        personalData.addressLine2,
        personalData.city,
        personalData.state,
        personalData.zipCode,
      ]
        .filter(Boolean)
        .join(', '),
    };

    updateMutation.mutate({ data: requestData });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-12 w-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconUser className="h-6 w-6" />
          </div>
          <div>
            <CardTitle>Verify Your Information</CardTitle>
            <CardDescription>Confirm your personal details</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={personalData.firstName || ''}
              onChange={(e) => setPersonalData({ ...personalData, firstName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              value={personalData.lastName || ''}
              onChange={(e) => setPersonalData({ ...personalData, lastName: e.target.value })}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              type="date"
              value={personalData.dateOfBirth || ''}
              onChange={(e) => setPersonalData({ ...personalData, dateOfBirth: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={personalData.phoneNumber || ''}
              onChange={(e) => setPersonalData({ ...personalData, phoneNumber: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={personalData.email || ''}
            onChange={(e) => setPersonalData({ ...personalData, email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Address Line 1</Label>
          <Input
            id="address"
            value={personalData.addressLine1 || ''}
            onChange={(e) => setPersonalData({ ...personalData, addressLine1: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address2">Address Line 2</Label>
          <Input
            id="address2"
            value={personalData.addressLine2 || ''}
            onChange={(e) => setPersonalData({ ...personalData, addressLine2: e.target.value })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={personalData.city || ''}
              onChange={(e) => setPersonalData({ ...personalData, city: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={personalData.state || ''}
              onChange={(e) => setPersonalData({ ...personalData, state: e.target.value })}
              maxLength={2}
              placeholder="CA"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zip">ZIP Code</Label>
            <Input
              id="zip"
              value={personalData.zipCode || ''}
              onChange={(e) => setPersonalData({ ...personalData, zipCode: e.target.value })}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <IconChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Saving...' : 'Continue'}
          <IconChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Step 3: Contribution Rate
 */
interface ContributionStepProps extends StepProps {
  contributionData: UpdateContributionRatesRequest;
  setContributionData: (data: UpdateContributionRatesRequest) => void;
}

function ContributionStep({ onNext, onBack, contributionData, setContributionData }: ContributionStepProps) {
  const updateMutation = useUpdateSelfContributionRates({
    mutation: {
      onSuccess: () => {
        toast.success('Contribution rates saved');
        onNext();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to save contribution rates';
        toast.error('Save Failed', message);
      },
    },
  });

  const preTaxRate = contributionData.preTaxDeferralPercentage || 0;
  const rothRate = contributionData.rothDeferralPercentage || 0;
  const totalRate = preTaxRate + rothRate;

  // Mock salary for calculation - in real app this would come from backend
  const salary = 75000;
  const annualContribution = (salary * totalRate) / 100;
  const perPaycheck = annualContribution / 26;

  const handleSave = () => {
    if (totalRate === 0) {
      toast.error('Please set a contribution rate greater than 0%');
      return;
    }
    updateMutation.mutate({ data: contributionData });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconCash className="h-6 w-6" />
          </div>
          <div>
            <CardTitle>Choose Your Contribution Rate</CardTitle>
            <CardDescription>Decide how much to save from each paycheck</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pre-Tax Contribution */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Pre-Tax Contribution Rate</Label>
            <span className="text-2xl font-bold text-primary">{preTaxRate}%</span>
          </div>
          <Slider
            value={[preTaxRate]}
            onValueChange={(value) =>
              setContributionData({ ...contributionData, preTaxDeferralPercentage: value[0] })
            }
            min={0}
            max={50}
            step={1}
            className="w-full"
          />
        </div>

        {/* Roth Contribution */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Roth (After-Tax) Contribution Rate</Label>
            <span className="text-2xl font-bold text-primary">{rothRate}%</span>
          </div>
          <Slider
            value={[rothRate]}
            onValueChange={(value) =>
              setContributionData({ ...contributionData, rothDeferralPercentage: value[0] })
            }
            min={0}
            max={50}
            step={1}
            className="w-full"
          />
        </div>

        {/* Total Rate Display */}
        <div className="p-4 bg-primary/10 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-medium">Total Contribution Rate</span>
            <span className="text-2xl font-bold text-primary">{totalRate}%</span>
          </div>
        </div>

        {/* Impact Preview */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Per Paycheck</p>
            <p className="text-xl font-bold">{formatCurrency(perPaycheck)}</p>
          </div>
          <div className="p-4 bg-primary/10 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Annual Total</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(annualContribution)}</p>
          </div>
        </div>

        {totalRate < 3 && (
          <div className="p-4 border border-warning/30 bg-warning/5 rounded-lg">
            <div className="flex items-start gap-3">
              <IconInfoCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-warning">Consider contributing more</p>
                <p className="text-muted-foreground mt-1">
                  Financial experts recommend saving at least 10-15% of your income for retirement.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <IconChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Saving...' : 'Continue'}
          <IconChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Step 4: Investment Selection
 */
interface InvestmentsStepProps extends StepProps {
  selectedPortfolioId: string;
  setSelectedPortfolioId: (id: string) => void;
  participantId: string;
}

function InvestmentsStep({
  onNext,
  onBack,
  selectedPortfolioId,
  setSelectedPortfolioId,
  participantId,
}: InvestmentsStepProps) {
  const { data: portfoliosPage, isLoading } = useListPortfolios();
  const electMutation = useElectPortfolio({
    mutation: {
      onSuccess: () => {
        toast.success('Portfolio selection saved');
        onNext();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to save portfolio selection';
        toast.error('Save Failed', message);
      },
    },
  });

  const portfolios = portfoliosPage?.content || [];

  const handleSave = () => {
    if (!selectedPortfolioId) {
      toast.error('Please select a portfolio');
      return;
    }
    if (!participantId) {
      toast.error('Participant ID not found. Please try refreshing the page.');
      return;
    }
    electMutation.mutate({ participantId, portfolioId: selectedPortfolioId });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-12 w-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconWallet className="h-6 w-6" />
          </div>
          <div>
            <CardTitle>Choose Your Investments</CardTitle>
            <CardDescription>Select how your contributions will be invested</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {portfolios.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No portfolios available. Please contact your plan administrator.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {portfolios.map((portfolio) => (
              <div
                key={portfolio.id}
                className={cn(
                  'p-4 border-2 rounded-lg cursor-pointer transition-colors',
                  selectedPortfolioId === portfolio.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-primary/50'
                )}
                onClick={() => setSelectedPortfolioId(portfolio.id || '')}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 mt-0.5',
                      selectedPortfolioId === portfolio.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground'
                    )}
                  >
                    {selectedPortfolioId === portfolio.id && <IconCheck className="h-3 w-3" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{portfolio.portfolioName}</h4>
                      {portfolio.isDefault && <Badge>Recommended</Badge>}
                    </div>
                    {portfolio.description && (
                      <p className="text-sm text-muted-foreground mt-1">{portfolio.description}</p>
                    )}
                     {portfolio.riskProfile && (
                       <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                         <span>Risk Level: {portfolio.riskProfile}</span>
                       </div>
                     )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <IconChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleSave} disabled={electMutation.isPending || portfolios.length === 0}>
          {electMutation.isPending ? 'Saving...' : 'Continue'}
          <IconChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Step 5: Beneficiaries
 */
interface BeneficiariesStepProps extends StepProps {
  beneficiaryData: UpdateBeneficiaryBody;
  setBeneficiaryData: (data: UpdateBeneficiaryBody) => void;
  participantId: string;
}

function BeneficiariesStep({
  onNext,
  onBack,
  beneficiaryData,
  setBeneficiaryData,
  participantId,
}: BeneficiariesStepProps) {
  const [skipBeneficiary, setSkipBeneficiary] = useState(false);

  const updateMutation = useUpdateBeneficiary({
    mutation: {
      onSuccess: () => {
        toast.success('Beneficiary information saved');
        onNext();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to save beneficiary information';
        toast.error('Save Failed', message);
      },
    },
  });

  const handleSave = () => {
    if (skipBeneficiary) {
      // Just proceed without saving beneficiary
      onNext();
      return;
    }

    if (!beneficiaryData.beneficiaryName) {
      toast.error('Please enter beneficiary name or choose to skip');
      return;
    }

    if (!participantId) {
      toast.error('Participant ID not found. Please try refreshing the page.');
      return;
    }

    updateMutation.mutate({ participantId, data: beneficiaryData });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconUsers className="h-6 w-6" />
          </div>
          <div>
            <CardTitle>Designate Beneficiaries</CardTitle>
            <CardDescription>Choose who receives your account if something happens to you</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <IconInfoCircle className="inline h-4 w-4 mr-1" />
            Your beneficiary designation determines who will receive your 401(k) account balance.
            You can update this at any time.
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Primary Beneficiary</h4>
          <div className="space-y-2">
            <Label htmlFor="beneficiaryName">Full Legal Name</Label>
            <Input
              id="beneficiaryName"
              placeholder="Jane Doe"
              value={(beneficiaryData.beneficiaryName as string) || ''}
              onChange={(e) =>
                setBeneficiaryData({ ...beneficiaryData, beneficiaryName: e.target.value })
              }
              disabled={skipBeneficiary}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="relationship">Relationship</Label>
            <Input
              id="relationship"
              placeholder="Spouse, Child, Parent, etc."
              value={(beneficiaryData.relationship as string) || ''}
              onChange={(e) => setBeneficiaryData({ ...beneficiaryData, relationship: e.target.value })}
              disabled={skipBeneficiary}
            />
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 border rounded-lg">
          <Checkbox
            id="skipBeneficiary"
            checked={skipBeneficiary}
            onCheckedChange={(checked) => setSkipBeneficiary(checked as boolean)}
          />
          <Label htmlFor="skipBeneficiary" className="text-sm font-normal">
            I&apos;ll add beneficiaries later. I understand my account may be distributed according to
            my plan&apos;s default provisions.
          </Label>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <IconChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Saving...' : 'Continue'}
          <IconChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Step 6: Review & Submit
 */
interface ReviewStepProps extends StepProps {
  personalData: any;
  contributionData: UpdateContributionRatesRequest;
  selectedPortfolioId: string;
  beneficiaryData: UpdateBeneficiaryBody;
  portfolios: ModelPortfolioDTO[];
}

function ReviewStep({
  onBack,
  personalData,
  contributionData,
  selectedPortfolioId,
  beneficiaryData,
  portfolios,
}: ReviewStepProps) {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);

  const selectedPortfolio = portfolios.find((p) => p.id === selectedPortfolioId);
  const preTaxRate = contributionData.preTaxDeferralPercentage || 0;
  const rothRate = contributionData.rothDeferralPercentage || 0;
  const totalRate = preTaxRate + rothRate;

  // Mock salary for calculation
  const salary = 75000;
  const annualContribution = (salary * totalRate) / 100;

  const handleComplete = () => {
    if (!agreed) {
      toast.error('Please agree to the terms to complete enrollment');
      return;
    }

    toast.success('Enrollment Complete!', 'Welcome to your 401(k) plan!');

    // Redirect to participant dashboard
    setTimeout(() => {
      router.push('/participant/dashboard');
    }, 1500);
  };

  return (
    <Card>
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
            <IconCheck className="h-8 w-8" />
          </div>
        </div>
        <CardTitle className="text-2xl">Review Your Enrollment</CardTitle>
        <CardDescription>
          Confirm your selections before completing enrollment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm text-muted-foreground mb-1">Name</h4>
            <p className="text-lg font-bold">
              {personalData.firstName} {personalData.lastName}
            </p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm text-muted-foreground mb-1">Email</h4>
            <p className="text-lg font-bold">{personalData.email}</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm text-muted-foreground mb-1">Contribution Rate</h4>
            <p className="text-lg font-bold">
              {preTaxRate > 0 && `${preTaxRate}% Pre-Tax`}
              {preTaxRate > 0 && rothRate > 0 && ' + '}
              {rothRate > 0 && `${rothRate}% Roth`}
            </p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm text-muted-foreground mb-1">Investment Selection</h4>
            <p className="text-lg font-bold">{selectedPortfolio?.portfolioName || 'Not selected'}</p>
          </div>
          {Boolean(beneficiaryData.beneficiaryName) && (
            <div className="p-4 bg-muted/50 rounded-lg sm:col-span-2">
              <h4 className="text-sm text-muted-foreground mb-1">Primary Beneficiary</h4>
              <p className="text-lg font-bold">
                {beneficiaryData.beneficiaryName as string}
                {Boolean(beneficiaryData.relationship) && ` (${beneficiaryData.relationship as string})`}
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border border-primary/30 bg-primary/5 rounded-lg">
          <h4 className="font-medium mb-2">Your Annual Savings</h4>
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Your Contributions ({totalRate}%)</span>
            <span className="font-medium">{formatCurrency(annualContribution)}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="font-medium">Annual Contribution</span>
            <span className="text-xl font-bold text-primary">{formatCurrency(annualContribution)}</span>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
          <Checkbox
            id="agree"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked as boolean)}
          />
          <Label htmlFor="agree" className="text-sm font-normal leading-relaxed">
            I understand that my contributions will begin with my next paycheck.
            I have reviewed the plan documents and agree to the{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Terms and Conditions
            </Link>
            .
          </Label>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <IconChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button size="lg" onClick={handleComplete} disabled={!agreed}>
          <IconRocket className="mr-2 h-4 w-4" />
          Complete Enrollment
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Participant Enrollment Page
 */
export default function EnrollmentPage() {
  const [currentStep, setCurrentStep] = useState(0);

  // Form data state
  const [personalData, setPersonalData] = useState<any>({});
  const [contributionData, setContributionData] = useState<UpdateContributionRatesRequest>({
    preTaxDeferralPercentage: 6,
    rothDeferralPercentage: 0,
  });
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [beneficiaryData, setBeneficiaryData] = useState<UpdateBeneficiaryBody>({});

  // Fetch data to get participant ID and portfolios
  const { data: personalDetails } = useGetParticipantPersonalDetails();
  const { data: portfoliosPage } = useListPortfolios();

  // Note: The backend API doesn't have a direct endpoint to get participant ID from current user
  // In a real scenario, this would be returned from the auth context or personal details API
  // For now, we'll use the email as a fallback identifier
  const participantId = personalDetails?.participantId || personalDetails?.emailAddress || '';

  const portfolios = portfoliosPage?.content || [];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const stepProps: StepProps = {
    onNext: handleNext,
    onBack: handleBack,
    isFirst: currentStep === 0,
    isLast: currentStep === steps.length - 1,
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep {...stepProps} />;
      case 1:
        return (
          <PersonalInfoStep
            {...stepProps}
            personalData={personalData}
            setPersonalData={setPersonalData}
          />
        );
      case 2:
        return (
          <ContributionStep
            {...stepProps}
            contributionData={contributionData}
            setContributionData={setContributionData}
          />
        );
      case 3:
        return (
          <InvestmentsStep
            {...stepProps}
            selectedPortfolioId={selectedPortfolioId}
            setSelectedPortfolioId={setSelectedPortfolioId}
            participantId={participantId}
          />
        );
      case 4:
        return (
          <BeneficiariesStep
            {...stepProps}
            beneficiaryData={beneficiaryData}
            setBeneficiaryData={setBeneficiaryData}
            participantId={participantId}
          />
        );
      case 5:
        return (
          <ReviewStep
            {...stepProps}
            personalData={personalData}
            contributionData={contributionData}
            selectedPortfolioId={selectedPortfolioId}
            beneficiaryData={beneficiaryData}
            portfolios={portfolios}
          />
        );
      default:
        return <WelcomeStep {...stepProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container max-w-3xl py-8 px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <IconBuildingBank className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">GlidingPath</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">401(k) Enrollment</h1>
        </div>

        {/* Progress */}
        <ProgressIndicator currentStep={currentStep} />

        {/* Step Content */}
        {renderStep()}
      </div>
    </div>
  );
}
