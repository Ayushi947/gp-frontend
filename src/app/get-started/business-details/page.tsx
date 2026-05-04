'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { IconBuilding, IconMapPin, IconCalendar, IconUsers } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OnboardingLayout } from '@/components/onboarding';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/config/routes';
import { useSaveDetails } from '@/api/generated/endpoints/plan-sponsor-details/plan-sponsor-details';
import { FormSelect } from '@/components/ui/FormSelect';

const businessDetailsSchema = z.object({
  legalName: z.string().min(1, 'Legal business name is required'),
  ein: z.string().regex(/^\d{9}$/, 'EIN must be 9 digits'),
  email: z.string().email('Valid email is required'),
  entityType: z.string().min(1, 'Entity type is required'),
  street: z.string().min(1, 'Street address is required'),
  apt: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2 characters'),
  postalCode: z.string().min(5, 'Postal code is required'),
  phoneNumber: z.string().min(10, 'Phone number is required'),
  payrollProvider: z.string().optional(),
  payrollSchedule: z.string().min(1, 'Payroll schedule is required'),
  numberOfDays: z.number().min(0, 'Must be 0 or greater'),
  estimatedEmployeeCount: z.number().min(1, 'At least 1 employee required'),
});

type BusinessDetailsFormData = z.infer<typeof businessDetailsSchema>;

const entityTypes = [
  "S Corporation",
  "C Corporation",
  "Professional Service Corporation",
  "Sole Proprietorship",
  "Partnership (including Limited Liability Partnership)",
  "LLC - Taxed as Partnership",
  "LLC - Taxed as Sole Proprietorship",
  "LLC - Taxed as C Corp",
  "LLC - Taxed as S Corp",
  "Tax-exempt Corporation",
  "Tax-exempt Association"
];

const payrollSchedules = [
  { value: "Every week", label: "Every week (Weekly)" },
  { value: "Every two weeks", label: "Every two weeks (Bi-weekly)" },
  { value: "Twice a month", label: "Twice a month (Semi-monthly)" },
  { value: "Every month", label: "Every month (Monthly)" }
];

/**
 * Build form default values from sessionStorage so Controller-managed
 * fields (FormSelect / Radix Select) render with the correct initial value.
 * Calling setValue after mount does not reliably re-render Radix Select.
 */
function getInitialDefaults(): BusinessDetailsFormData {
  const base: BusinessDetailsFormData = {
    legalName: '',
    ein: '',
    email: '',
    entityType: '',
    street: '',
    apt: '',
    city: '',
    state: '',
    postalCode: '',
    phoneNumber: '',
    payrollProvider: '',
    payrollSchedule: 'Every week',
    numberOfDays: 4,
    estimatedEmployeeCount: 10,
  };

  if (typeof window === 'undefined') return base;

  // Try to restore from previously saved business details
  const saved = sessionStorage.getItem('businessDetailsData');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        legalName: parsed.legalName || base.legalName,
        ein: parsed.ein || base.ein,
        email: parsed.email || base.email,
        entityType: parsed.entityType || base.entityType,
        street: parsed.businessAddress?.street || base.street,
        apt: parsed.businessAddress?.apt || base.apt,
        city: parsed.businessAddress?.city || base.city,
        state: parsed.businessAddress?.state || base.state,
        postalCode: parsed.businessAddress?.postalCode || base.postalCode,
        phoneNumber: parsed.businessAddress?.phoneNumber || base.phoneNumber,
        payrollProvider: parsed.payrollProvider || base.payrollProvider,
        payrollSchedule: parsed.payrollSchedule?.schedule || base.payrollSchedule,
        numberOfDays: parsed.payrollSchedule?.numberOfDays ?? base.numberOfDays,
        estimatedEmployeeCount: parsed.estimatedEmployeeCount || base.estimatedEmployeeCount,
      };
    } catch {
      // Fall through to individual keys
    }
  }

  // Fallback: Pre-fill from individual session storage keys
  const companyName = sessionStorage.getItem('companyName');
  const ein = sessionStorage.getItem('ein');
  const email = sessionStorage.getItem('email') || sessionStorage.getItem('sponsorEmail');
  const businessSize = sessionStorage.getItem('businessSize');
  const payrollProvider = sessionStorage.getItem('payrollProvider');

  if (companyName) base.legalName = companyName;
  if (ein) base.ein = ein.replace(/-/g, '');
  if (email) base.email = email;
  if (payrollProvider) base.payrollProvider = payrollProvider;

  if (businessSize) {
    const sizeMap: Record<string, number> = {
      '0-5': 5,
      '6-10': 10,
      '11-25': 25,
      '26-50': 50,
      '51-100': 100,
      '101-250': 250,
      '251-500': 500,
      '500+': 500,
    };
    base.estimatedEmployeeCount = sizeMap[businessSize] || 10;
  }

  return base;
}

export default function BusinessDetailsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { mutateAsync: saveDetails } = useSaveDetails();

  const {
    register,
    handleSubmit,
    formState: { errors },
    control
  } = useForm<BusinessDetailsFormData>({
    resolver: zodResolver(businessDetailsSchema),
    defaultValues: getInitialDefaults(),
  });

  useEffect(() => {
    // Check if plan type was selected
    const selectedPlanType = sessionStorage.getItem('selectedPlanType');
    if (!selectedPlanType) {
      toast.error('Missing information', 'Please select a plan type first.');
      router.push(ROUTES.GET_STARTED.PLAN_RECOMMENDATION);
    }
  }, [router]);

  const onSubmit = async (data: BusinessDetailsFormData) => {
    console.log('=== FORM SUBMIT STARTED ===');
    console.log('Form data:', data);

    setIsLoading(true);
    try {
      const requestBody = {
        legalName: data.legalName,
        ein: data.ein,
        email: data.email,
        businessAddress: {
          street: data.street,
          apt: data.apt || '',
          city: data.city,
          state: data.state.toUpperCase(),
          postalCode: data.postalCode,
          phoneNumber: data.phoneNumber,
          mailingDifferent: false,
          mailingStreet: '',
          mailingApt: '',
          mailingCity: '',
          mailingState: '',
          mailingPostalCode: '',
          mailingPhoneNumber: '',
        },
        entityType: data.entityType,
        payrollProvider: data.payrollProvider || 'Paylocity',
        payrollSchedule: {
          schedule: data.payrollSchedule,
          numberOfDays: data.numberOfDays,
        },
        estimatedEmployeeCount: data.estimatedEmployeeCount,
        unionEmployees: false,
        leasedEmployees: false,
        existingRetirementPlan: sessionStorage.getItem('existingPlan') === 'yes',
        relatedEntities: sessionStorage.getItem('multipleBusinesses') === 'yes',
        employmentStatus: sessionStorage.getItem('employmentStatus') || '',
        businessSize: sessionStorage.getItem('businessSize') || '',
        retirementPlanPriority: '',
        hasExisting401k: sessionStorage.getItem('existingPlan') === 'yes',
        hasMultipleBusinesses: sessionStorage.getItem('multipleBusinesses') === 'yes',
      };

      console.log('Request payload:', JSON.stringify(requestBody, null, 2));

      await saveDetails({ data: requestBody });
      console.log('✅ Business details saved successfully');

      // Save to sessionStorage for next step
      sessionStorage.setItem('businessDetailsData', JSON.stringify(requestBody));
      sessionStorage.setItem('estimatedEmployeeCount', data.estimatedEmployeeCount.toString());

      toast.success('Business details saved successfully');
      router.push(ROUTES.GET_STARTED.REVIEW_PRICING);
    } catch (error) {
      console.error('❌ Failed to save business details:', error);
      toast.error('Failed to save business details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    const selectedPlanType = sessionStorage.getItem('selectedPlanType');
    const planRoutes: Record<string, string> = {
      'traditional-401k': '/get-started/traditional',
      'safe-harbor-401k': '/get-started/safe-harbor',
      'starter-401k': '/get-started/starter',
      'solo-401k': '/get-started/solo',
    };
    const targetRoute = selectedPlanType ? planRoutes[selectedPlanType] : null;
    router.push(targetRoute || ROUTES.GET_STARTED.PLAN_RECOMMENDATION);
  };

  return (
    <OnboardingLayout
      title="Business Details"
      description="Provide your company and payroll details"
      currentStep={10}
      totalSteps={19}
      milestoneStep={9}
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit(onSubmit, (errors) => {
        console.log('❌ FORM VALIDATION ERRORS:', errors);
      })} className="space-y-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconBuilding className="w-5 h-5 text-primary" />
              <CardTitle>Company Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="legalName">
                Legal Business Name <span className="text-error">*</span>
              </Label>
              <Input
                id="legalName"
                {...register('legalName')}
                placeholder="Enter your legal business name"
                className={errors.legalName ? 'border-error' : ''}
              />
              {errors.legalName && (
                <p className="text-xs text-error">{errors.legalName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Business Email <span className="text-error">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="business@example.com"
                className={errors.email ? 'border-error' : ''}
              />
              {errors.email && (
                <p className="text-xs text-error">{errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ein">
                  EIN <span className="text-error">*</span>
                </Label>
                <Input
                  id="ein"
                  {...register('ein')}
                  placeholder="123456789"
                  maxLength={9}
                  className={errors.ein ? 'border-error' : ''}
                />
                {errors.ein && (
                  <p className="text-xs text-error">{errors.ein.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="entityType">
                  Entity Type <span className="text-error">*</span>
                </Label>
                <Controller
                  name="entityType"
                  control={control}
                  render={({ field }) => (
                    <FormSelect
                      label=""
                      options={entityTypes.map((type) => ({
                        value: type,
                        label: type,
                      }))}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select entity type"
                      required
                      error={errors.entityType?.message}
                    />
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Address */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconMapPin className="w-5 h-5 text-primary" />
              <CardTitle>Business Address</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="street">
                  Street Address <span className="text-error">*</span>
                </Label>
                <Input
                  id="street"
                  {...register('street')}
                  placeholder="123 Main Street"
                  className={errors.street ? 'border-error' : ''}
                />
                {errors.street && (
                  <p className="text-xs text-error">{errors.street.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="apt">Apt/Suite</Label>
                <Input
                  id="apt"
                  {...register('apt')}
                  placeholder="Suite 100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">
                  City <span className="text-error">*</span>
                </Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="San Francisco"
                  className={errors.city ? 'border-error' : ''}
                />
                {errors.city && (
                  <p className="text-xs text-error">{errors.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">
                  State <span className="text-error">*</span>
                </Label>
                <Input
                  id="state"
                  {...register('state')}
                  placeholder="CA"
                  maxLength={2}
                  className={errors.state ? 'border-error' : ''}
                />
                {errors.state && (
                  <p className="text-xs text-error">{errors.state.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">
                  Postal Code <span className="text-error">*</span>
                </Label>
                <Input
                  id="postalCode"
                  {...register('postalCode')}
                  placeholder="94102"
                  className={errors.postalCode ? 'border-error' : ''}
                />
                {errors.postalCode && (
                  <p className="text-xs text-error">{errors.postalCode.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">
                Business Phone <span className="text-error">*</span>
              </Label>
              <Input
                id="phoneNumber"
                {...register('phoneNumber')}
                placeholder="(415) 555-0123"
                className={errors.phoneNumber ? 'border-error' : ''}
              />
              {errors.phoneNumber && (
                <p className="text-xs text-error">{errors.phoneNumber.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payroll Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconCalendar className="w-5 h-5 text-primary" />
              <CardTitle>Payroll Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payrollProvider">Payroll Provider</Label>
                <Input
                  id="payrollProvider"
                  {...register('payrollProvider')}
                  placeholder="e.g., Paylocity, ADP, Gusto"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payrollSchedule">
                  Payroll Schedule <span className="text-error">*</span>
                </Label>
                <Controller
                  name="payrollSchedule"
                  control={control}
                  render={({ field }) => (
                    <FormSelect
                      label=""
                      options={payrollSchedules.map((schedule) => ({
                        value: schedule.value,
                        label: schedule.label,
                      }))}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select payroll schedule"
                      required
                      error={errors.payrollSchedule?.message}
                    />
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numberOfDays">
                Days before payday that payroll is submitted <span className="text-error">*</span>
              </Label>
              <Input
                id="numberOfDays"
                type="number"
                min="0"
                max="30"
                {...register('numberOfDays', { valueAsNumber: true })}
                placeholder="4"
                className={errors.numberOfDays ? 'border-error' : ''}
              />
              <p className="text-xs text-muted-foreground">
                For example, if employees are paid on Friday and payroll is submitted 4 days early, the cutoff date would be Monday.
              </p>
              {errors.numberOfDays && (
                <p className="text-xs text-error">{errors.numberOfDays.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Employee Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconUsers className="w-5 h-5 text-primary" />
              <CardTitle>Employee Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="estimatedEmployeeCount">
                Estimated Employee Count <span className="text-error">*</span>
              </Label>
              <Input
                id="estimatedEmployeeCount"
                type="number"
                min="1"
                {...register('estimatedEmployeeCount', { valueAsNumber: true })}
                className={errors.estimatedEmployeeCount ? 'border-error' : ''}
              />
              {errors.estimatedEmployeeCount && (
                <p className="text-xs text-error">{errors.estimatedEmployeeCount.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={isLoading}
            size="default"
            className="min-w-[140px] text-sm"
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            loading={isLoading}
            loadingText="Saving..."
            size="default"
            className="min-w-[140px] text-sm"
          >
            Continue
          </Button>
        </div>
      </form>
    </OnboardingLayout>
  );
}
