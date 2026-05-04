'use client';

import { useState } from 'react';
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
                <li>100% match on the first 3% you contribute</li>
                <li>50% match on the next 2% you contribute</li>
                <li>That&apos;s up to 4% in free money!</li>
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
function PersonalInfoStep({ onNext, onBack }: StepProps) {
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
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" defaultValue="John" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" defaultValue="Doe" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input id="dob" type="date" defaultValue="1985-06-15" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ssn">Social Security Number</Label>
            <Input id="ssn" defaultValue="***-**-1234" disabled />
            <p className="text-xs text-muted-foreground">
              Contact HR to update
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" type="email" defaultValue="john.doe@company.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" type="tel" defaultValue="(555) 123-4567" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Mailing Address</Label>
          <Input id="address" defaultValue="123 Main Street, Apt 4B" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" defaultValue="San Francisco" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Select defaultValue="CA">
              <SelectTrigger id="state">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CA">California</SelectItem>
                <SelectItem value="NY">New York</SelectItem>
                <SelectItem value="TX">Texas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="zip">ZIP Code</Label>
            <Input id="zip" defaultValue="94102" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <IconChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={onNext}>
          Continue
          <IconChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Step 3: Contribution Rate
 */
function ContributionStep({ onNext, onBack }: StepProps) {
  const [contributionRate, setContributionRate] = useState(6);
  const [rothEnabled, setRothEnabled] = useState(false);
  const [rothPercent, setRothPercent] = useState(0);

  const salary = 75000;
  const annualContribution = (salary * contributionRate) / 100;
  const matchRate = contributionRate >= 5 ? 4 : contributionRate >= 3 ? 3.5 : contributionRate;
  const employerMatch = (salary * matchRate) / 100;
  const perPaycheck = annualContribution / 26;

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
        {/* Contribution Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Your Contribution Rate</Label>
            <span className="text-2xl font-bold text-primary">{contributionRate}%</span>
          </div>
          <Slider
            value={[contributionRate]}
            onValueChange={(value) => setContributionRate(value[0] ?? 6)}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span className="text-success font-medium">6% = Max Match</span>
            <span>100%</span>
          </div>
        </div>

        {/* Impact Preview */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Per Paycheck</p>
            <p className="text-xl font-bold">{formatCurrency(perPaycheck)}</p>
          </div>
          <div className="p-4 bg-success/10 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Employer Match</p>
            <p className="text-xl font-bold text-success">+{formatCurrency(employerMatch / 26)}</p>
          </div>
          <div className="p-4 bg-primary/10 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Annual Total</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(annualContribution + employerMatch)}</p>
          </div>
        </div>

        {/* Match Info */}
        {contributionRate < 5 && (
          <div className="p-4 border border-warning/30 bg-warning/5 rounded-lg">
            <div className="flex items-start gap-3">
              <IconInfoCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-warning">You&apos;re leaving money on the table!</p>
                <p className="text-muted-foreground mt-1">
                  Increase to at least 5% to get the full employer match of 4%.
                </p>
              </div>
            </div>
          </div>
        )}

        {contributionRate >= 5 && (
          <div className="p-4 border border-success/30 bg-success/5 rounded-lg">
            <div className="flex items-start gap-3">
              <IconCheck className="h-5 w-5 text-success shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-success">You&apos;re maximizing your match!</p>
                <p className="text-muted-foreground mt-1">
                  Great choice! You&apos;re getting the full 4% employer match.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Roth Option */}
        <div className="p-4 border rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Roth 401(k) Option</h4>
              <p className="text-sm text-muted-foreground">
                Contribute after-tax dollars for tax-free growth
              </p>
            </div>
            <Checkbox
              checked={rothEnabled}
              onCheckedChange={(checked) => setRothEnabled(checked as boolean)}
            />
          </div>
          {rothEnabled && (
            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center justify-between">
                <Label>Roth Portion</Label>
                <span className="font-medium">{rothPercent}% of {contributionRate}%</span>
              </div>
              <Slider
                value={[rothPercent]}
                onValueChange={(value) => setRothPercent(value[0] ?? 0)}
                min={0}
                max={100}
                step={10}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>100% Pre-Tax</span>
                <span>100% Roth</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <IconChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={onNext}>
          Continue
          <IconChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Step 4: Investment Selection
 */
function InvestmentsStep({ onNext, onBack }: StepProps) {
  const [investmentChoice, setInvestmentChoice] = useState('target-date');

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
        <div className="space-y-3">
          {/* Target Date Fund */}
          <div
            className={cn(
              'p-4 border-2 rounded-lg cursor-pointer transition-colors',
              investmentChoice === 'target-date'
                ? 'border-primary bg-primary/5'
                : 'hover:border-primary/50'
            )}
            onClick={() => setInvestmentChoice('target-date')}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 mt-0.5',
                  investmentChoice === 'target-date'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground'
                )}
              >
                {investmentChoice === 'target-date' && <IconCheck className="h-3 w-3" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">Target Date Fund 2055</h4>
                  <Badge>Recommended</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  A professionally managed fund that automatically adjusts based on your expected retirement date.
                  Set it and forget it!
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span>Expense Ratio: 0.12%</span>
                  <span>Diversified Portfolio</span>
                </div>
              </div>
            </div>
          </div>

          {/* Model Portfolio */}
          <div
            className={cn(
              'p-4 border-2 rounded-lg cursor-pointer transition-colors',
              investmentChoice === 'model'
                ? 'border-primary bg-primary/5'
                : 'hover:border-primary/50'
            )}
            onClick={() => setInvestmentChoice('model')}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 mt-0.5',
                  investmentChoice === 'model'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground'
                )}
              >
                {investmentChoice === 'model' && <IconCheck className="h-3 w-3" />}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Model Portfolio - Moderate Growth</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  A pre-built portfolio with a balanced mix of stocks and bonds based on your risk tolerance.
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span>70% Stocks / 30% Bonds</span>
                  <span>Rebalanced Quarterly</span>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Selection */}
          <div
            className={cn(
              'p-4 border-2 rounded-lg cursor-pointer transition-colors',
              investmentChoice === 'custom'
                ? 'border-primary bg-primary/5'
                : 'hover:border-primary/50'
            )}
            onClick={() => setInvestmentChoice('custom')}
          >
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 mt-0.5',
                  investmentChoice === 'custom'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground'
                )}
              >
                {investmentChoice === 'custom' && <IconCheck className="h-3 w-3" />}
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Build My Own Portfolio</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose from our lineup of individual funds to create your own investment mix.
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span>20+ Funds Available</span>
                  <span>Full Control</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {investmentChoice === 'target-date' && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-3">Target Date Fund 2055 Allocation</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>US Stocks</span>
                <span className="font-medium">54%</span>
              </div>
              <Progress value={54} className="h-2" />
              <div className="flex items-center justify-between text-sm">
                <span>International Stocks</span>
                <span className="font-medium">36%</span>
              </div>
              <Progress value={36} className="h-2" />
              <div className="flex items-center justify-between text-sm">
                <span>Bonds</span>
                <span className="font-medium">10%</span>
              </div>
              <Progress value={10} className="h-2" />
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <IconChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={onNext}>
          Continue
          <IconChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Step 5: Beneficiaries
 */
function BeneficiariesStep({ onNext, onBack }: StepProps) {
  const [primaryName, setPrimaryName] = useState('');
  const [relationship, setRelationship] = useState('');

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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="beneficiaryName">Full Legal Name</Label>
              <Input
                id="beneficiaryName"
                placeholder="Jane Doe"
                value={primaryName}
                onChange={(e) => setPrimaryName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="relationship">Relationship</Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger id="relationship">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spouse">Spouse</SelectItem>
                  <SelectItem value="child">Child</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                  <SelectItem value="sibling">Sibling</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="beneficiaryDob">Date of Birth</Label>
              <Input id="beneficiaryDob" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="beneficiaryPercent">Percentage</Label>
              <Input id="beneficiaryPercent" type="number" defaultValue="100" />
            </div>
          </div>
        </div>

        <Button variant="outline" className="w-full">
          + Add Contingent Beneficiary
        </Button>

        <div className="flex items-start gap-3 p-4 border rounded-lg">
          <Checkbox id="skipBeneficiary" />
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
        <Button onClick={onNext}>
          Continue
          <IconChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Step 6: Review & Submit
 */
function ReviewStep({ onBack }: StepProps) {
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = () => {
    if (!agreed) {
      toast.error('Please agree to the terms to complete enrollment');
      return;
    }
    toast.success('Enrollment complete! Welcome to your 401(k)!');
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
            <h4 className="text-sm text-muted-foreground mb-1">Contribution Rate</h4>
            <p className="text-lg font-bold">6% Pre-Tax</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm text-muted-foreground mb-1">Employer Match</h4>
            <p className="text-lg font-bold text-success">+4%</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm text-muted-foreground mb-1">Investment Selection</h4>
            <p className="text-lg font-bold">Target Date 2055</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm text-muted-foreground mb-1">Primary Beneficiary</h4>
            <p className="text-lg font-bold">Jane Doe (Spouse)</p>
          </div>
        </div>

        <div className="p-4 border border-primary/30 bg-primary/5 rounded-lg">
          <h4 className="font-medium mb-2">Your Annual Savings</h4>
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Your Contributions (6%)</span>
            <span className="font-medium">{formatCurrency(4500)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Employer Match (4%)</span>
            <span className="font-medium text-success">+{formatCurrency(3000)}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="font-medium">Total Annual Savings</span>
            <span className="text-xl font-bold text-primary">{formatCurrency(7500)}</span>
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
        <Button size="lg" onClick={handleSubmit} disabled={!agreed}>
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
        return <PersonalInfoStep {...stepProps} />;
      case 2:
        return <ContributionStep {...stepProps} />;
      case 3:
        return <InvestmentsStep {...stepProps} />;
      case 4:
        return <BeneficiariesStep {...stepProps} />;
      case 5:
        return <ReviewStep {...stepProps} />;
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
