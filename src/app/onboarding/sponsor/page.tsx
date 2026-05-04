'use client';

import { useState } from 'react';
import {
  IconBuilding,
  IconUsers,
  IconCash,
  IconShieldCheck,
  IconSettings,
  IconCheck,
  IconChevronRight,
  IconChevronLeft,
  IconBuildingBank,
  IconCalendar,
  IconPercentage,
  IconFileCheck,
  IconRocket,
} from '@tabler/icons-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';

interface StepProps {
  onNext: () => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
}

const steps = [
  { id: 'company', title: 'Company Info', icon: IconBuilding },
  { id: 'plan-type', title: 'Plan Type', icon: IconBuildingBank },
  { id: 'eligibility', title: 'Eligibility', icon: IconUsers },
  { id: 'contributions', title: 'Contributions', icon: IconCash },
  { id: 'vesting', title: 'Vesting', icon: IconCalendar },
  { id: 'review', title: 'Review', icon: IconFileCheck },
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
                  'h-0.5 w-8 sm:w-16 lg:w-24 mx-2',
                  index < currentStep ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        {steps.map((step, index) => (
          <span
            key={step.id}
            className={cn(
              'hidden sm:block',
              index === currentStep && 'text-primary font-medium'
            )}
          >
            {step.title}
          </span>
        ))}
      </div>
      <Progress value={((currentStep + 1) / steps.length) * 100} className="mt-4 h-2" />
    </div>
  );
}

/**
 * Step 1: Company Information
 */
function CompanyInfoStep({ onNext, isFirst }: StepProps) {
  const [companyName, setCompanyName] = useState('');
  const [ein, setEin] = useState('');
  const [entityType, setEntityType] = useState('');
  const [employees, setEmployees] = useState('');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconBuilding className="h-6 w-6" />
          </div>
          <div>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Tell us about your business</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">Legal Company Name *</Label>
            <Input
              id="companyName"
              placeholder="Acme Corporation"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ein">Employer Identification Number (EIN) *</Label>
            <Input
              id="ein"
              placeholder="XX-XXXXXXX"
              value={ein}
              onChange={(e) => setEin(e.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="entityType">Entity Type *</Label>
            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger id="entityType">
                <SelectValue placeholder="Select entity type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="c-corp">C Corporation</SelectItem>
                <SelectItem value="s-corp">S Corporation</SelectItem>
                <SelectItem value="llc">LLC</SelectItem>
                <SelectItem value="partnership">Partnership</SelectItem>
                <SelectItem value="sole-prop">Sole Proprietorship</SelectItem>
                <SelectItem value="nonprofit">Non-Profit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="employees">Number of Employees *</Label>
            <Input
              id="employees"
              type="number"
              placeholder="25"
              value={employees}
              onChange={(e) => setEmployees(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Business Address</Label>
          <Input id="address" placeholder="123 Main Street, Suite 100" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" placeholder="San Francisco" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Select>
              <SelectTrigger id="state">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CA">California</SelectItem>
                <SelectItem value="NY">New York</SelectItem>
                <SelectItem value="TX">Texas</SelectItem>
                <SelectItem value="FL">Florida</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="zip">ZIP Code</Label>
            <Input id="zip" placeholder="94102" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={onNext}>
          Continue
          <IconChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Step 2: Plan Type Selection
 */
function PlanTypeStep({ onNext, onBack }: StepProps) {
  const [selectedPlan, setSelectedPlan] = useState('');

  const planTypes = [
    {
      id: 'traditional',
      title: 'Traditional 401(k)',
      description: 'Standard plan with ADP/ACP testing',
      features: ['Flexible contribution limits', 'Employee & employer contributions', 'Annual compliance testing required'],
      recommended: false,
    },
    {
      id: 'safe-harbor',
      title: 'Safe Harbor 401(k)',
      description: 'Automatic compliance with required employer contributions',
      features: ['No ADP/ACP testing required', 'Immediate vesting on safe harbor contributions', '3% non-elective or 4% match required'],
      recommended: true,
    },
    {
      id: 'qaca',
      title: 'QACA Safe Harbor',
      description: 'Safe harbor with auto-enrollment',
      features: ['Combines safe harbor and auto-enrollment', '2-year cliff vesting allowed', 'Enhanced match formula'],
      recommended: false,
    },
    {
      id: 'starter',
      title: 'Starter 401(k)',
      description: 'Simplified plan for small businesses',
      features: ['No employer contributions required', 'Lower administrative burden', 'Employee-only deferrals'],
      recommended: false,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconBuildingBank className="h-6 w-6" />
          </div>
          <div>
            <CardTitle>Select Plan Type</CardTitle>
            <CardDescription>Choose the right 401(k) structure for your business</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {planTypes.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'relative p-4 border-2 rounded-lg cursor-pointer transition-colors',
                selectedPlan === plan.id
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-primary/50'
              )}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.recommended && (
                <Badge className="absolute -top-2 right-4">Recommended</Badge>
              )}
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 mt-0.5',
                    selectedPlan === plan.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground'
                  )}
                >
                  {selectedPlan === plan.id && <IconCheck className="h-3 w-3" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{plan.title}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                  <ul className="space-y-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <IconCheck className="h-3 w-3 text-success" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <IconChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={onNext} disabled={!selectedPlan}>
          Continue
          <IconChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Step 3: Eligibility Requirements
 */
function EligibilityStep({ onNext, onBack }: StepProps) {
  const [minAge, setMinAge] = useState('none');
  const [serviceReq, setServiceReq] = useState('immediate');
  const [entryDates, setEntryDates] = useState('monthly');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconUsers className="h-6 w-6" />
          </div>
          <div>
            <CardTitle>Eligibility Requirements</CardTitle>
            <CardDescription>Define who can participate in your plan</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Minimum Age Requirement</Label>
            <Select value={minAge} onValueChange={setMinAge}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="18">18 years</SelectItem>
                <SelectItem value="21">21 years (IRS Maximum)</SelectItem>
                <SelectItem value="none">No minimum age</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Service Requirement</Label>
            <Select value={serviceReq} onValueChange={setServiceReq}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate eligibility</SelectItem>
                <SelectItem value="1month">1 month of service</SelectItem>
                <SelectItem value="3months">3 months of service</SelectItem>
                <SelectItem value="6months">6 months of service</SelectItem>
                <SelectItem value="1year">1 year of service (IRS Maximum)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Plan Entry Dates</Label>
          <Select value={entryDates} onValueChange={setEntryDates}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="immediate">Immediate upon eligibility</SelectItem>
              <SelectItem value="monthly">First of each month</SelectItem>
              <SelectItem value="quarterly">First of each quarter</SelectItem>
              <SelectItem value="semi-annual">January 1 and July 1</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <IconShieldCheck className="h-4 w-4 text-primary" />
            Excluded Employee Classes
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox id="exclude-union" />
              <Label htmlFor="exclude-union" className="text-sm font-normal">
                Union employees covered by collective bargaining
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="exclude-nonres" />
              <Label htmlFor="exclude-nonres" className="text-sm font-normal">
                Nonresident aliens with no US income
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="exclude-parttime" />
              <Label htmlFor="exclude-parttime" className="text-sm font-normal">
                Part-time employees (less than 1,000 hours/year)
              </Label>
            </div>
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
 * Step 4: Contribution Settings
 */
function ContributionsStep({ onNext, onBack }: StepProps) {
  const [autoEnroll, setAutoEnroll] = useState(true);
  const [defaultRate, setDefaultRate] = useState('6');
  const [matchType, setMatchType] = useState('basic');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconCash className="h-6 w-6" />
          </div>
          <div>
            <CardTitle>Contribution Settings</CardTitle>
            <CardDescription>Configure employee and employer contributions</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto-Enrollment */}
        <div className="p-4 border rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Auto-Enrollment</h4>
              <p className="text-sm text-muted-foreground">
                Automatically enroll eligible employees
              </p>
            </div>
            <Checkbox
              checked={autoEnroll}
              onCheckedChange={(checked) => setAutoEnroll(checked as boolean)}
            />
          </div>
          {autoEnroll && (
            <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t">
              <div className="space-y-2">
                <Label>Default Deferral Rate</Label>
                <Select value={defaultRate} onValueChange={setDefaultRate}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3%</SelectItem>
                    <SelectItem value="4">4%</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="6">6% (Recommended)</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Annual Auto-Increase</Label>
                <Select defaultValue="1">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No auto-increase</SelectItem>
                    <SelectItem value="1">1% per year</SelectItem>
                    <SelectItem value="2">2% per year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Employer Match */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <IconPercentage className="h-4 w-4 text-primary" />
            Employer Matching Contribution
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { id: 'basic', label: 'Basic Match', desc: '100% match on first 3%, 50% on next 2%' },
              { id: 'enhanced', label: 'Enhanced Match', desc: '100% match on first 4%' },
              { id: 'tiered', label: 'Tiered Match', desc: 'Custom tiered matching formula' },
              { id: 'none', label: 'No Match', desc: 'Employee contributions only' },
            ].map((option) => (
              <div
                key={option.id}
                className={cn(
                  'p-3 border rounded-lg cursor-pointer transition-colors',
                  matchType === option.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-primary/50'
                )}
                onClick={() => setMatchType(option.id)}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'h-4 w-4 rounded-full border-2',
                      matchType === option.id
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    )}
                  />
                  <span className="font-medium text-sm">{option.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-6">{option.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Profit Sharing */}
        <div className="p-4 border rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Profit Sharing</h4>
              <p className="text-sm text-muted-foreground">
                Optional employer discretionary contributions
              </p>
            </div>
            <Checkbox />
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
 * Step 5: Vesting Schedule
 */
function VestingStep({ onNext, onBack }: StepProps) {
  const [vestingSchedule, setVestingSchedule] = useState('cliff-3');

  const vestingOptions = [
    { id: 'immediate', label: 'Immediate', desc: '100% vested immediately' },
    { id: 'cliff-2', label: '2-Year Cliff', desc: '0% until year 2, then 100%' },
    { id: 'cliff-3', label: '3-Year Cliff', desc: '0% until year 3, then 100%' },
    { id: 'graded-6', label: '6-Year Graded', desc: '20% per year starting year 2' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconCalendar className="h-6 w-6" />
          </div>
          <div>
            <CardTitle>Vesting Schedule</CardTitle>
            <CardDescription>Define how employer contributions vest over time</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Employee contributions are always 100% vested. Select a vesting schedule for employer contributions.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {vestingOptions.map((option) => (
            <div
              key={option.id}
              className={cn(
                'p-4 border-2 rounded-lg cursor-pointer transition-colors',
                vestingSchedule === option.id
                  ? 'border-primary bg-primary/5'
                  : 'hover:border-primary/50'
              )}
              onClick={() => setVestingSchedule(option.id)}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 mt-0.5',
                    vestingSchedule === option.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground'
                  )}
                >
                  {vestingSchedule === option.id && <IconCheck className="h-3 w-3" />}
                </div>
                <div>
                  <h4 className="font-medium">{option.label}</h4>
                  <p className="text-sm text-muted-foreground">{option.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Vesting Preview */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-3">Vesting Preview</h4>
          <div className="grid grid-cols-6 gap-2 text-center text-sm">
            {[1, 2, 3, 4, 5, 6].map((year) => {
              let percent = 0;
              if (vestingSchedule === 'immediate') percent = 100;
              else if (vestingSchedule === 'cliff-2') percent = year >= 2 ? 100 : 0;
              else if (vestingSchedule === 'cliff-3') percent = year >= 3 ? 100 : 0;
              else if (vestingSchedule === 'graded-6') percent = year >= 2 ? Math.min((year - 1) * 20, 100) : 0;

              return (
                <div key={year} className="space-y-1">
                  <div className="text-xs text-muted-foreground">Year {year}</div>
                  <div
                    className={cn(
                      'py-2 rounded font-medium',
                      percent === 100
                        ? 'bg-success/20 text-success'
                        : percent > 0
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {percent}%
                  </div>
                </div>
              );
            })}
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
 * Step 6: Review & Submit
 */
function ReviewStep({ onBack }: StepProps) {
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = () => {
    if (!agreed) {
      toast.error('Please agree to the terms to continue');
      return;
    }
    toast.success('Plan setup submitted successfully!');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconFileCheck className="h-6 w-6" />
          </div>
          <div>
            <CardTitle>Review Your Plan</CardTitle>
            <CardDescription>Confirm your plan settings before submission</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Plan Type</h4>
            <p className="text-sm text-muted-foreground">Safe Harbor 401(k)</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Eligibility</h4>
            <p className="text-sm text-muted-foreground">21 years, Immediate entry</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Employer Match</h4>
            <p className="text-sm text-muted-foreground">Basic Match (4%)</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Vesting</h4>
            <p className="text-sm text-muted-foreground">3-Year Cliff</p>
          </div>
        </div>

        {/* What's Next */}
        <div className="p-4 border rounded-lg">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <IconRocket className="h-4 w-4 text-primary" />
            What Happens Next
          </h4>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">1</span>
              We&apos;ll review your plan setup and prepare documents
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">2</span>
              Connect your payroll provider for seamless contributions
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">3</span>
              Invite employees to enroll in the plan
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">4</span>
              Start processing contributions!
            </li>
          </ol>
        </div>

        {/* Agreement */}
        <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
          <Checkbox
            id="agree"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked as boolean)}
          />
          <Label htmlFor="agree" className="text-sm font-normal leading-relaxed">
            I confirm that the information provided is accurate and I agree to the{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
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
        <Button onClick={handleSubmit} disabled={!agreed}>
          <IconCheck className="mr-2 h-4 w-4" />
          Submit Plan Setup
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Get Started Page - Sponsor Onboarding
 */
export default function GetStartedPage() {
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
        return <CompanyInfoStep {...stepProps} />;
      case 1:
        return <PlanTypeStep {...stepProps} />;
      case 2:
        return <EligibilityStep {...stepProps} />;
      case 3:
        return <ContributionsStep {...stepProps} />;
      case 4:
        return <VestingStep {...stepProps} />;
      case 5:
        return <ReviewStep {...stepProps} />;
      default:
        return <CompanyInfoStep {...stepProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container max-w-4xl py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <IconBuildingBank className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">GlidingPath</span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Set Up Your 401(k) Plan</h1>
          <p className="text-muted-foreground">
            Complete the steps below to configure your company&apos;s retirement plan
          </p>
        </div>

        {/* Progress */}
        <ProgressIndicator currentStep={currentStep} />

        {/* Step Content */}
        {renderStep()}
      </div>
    </div>
  );
}
