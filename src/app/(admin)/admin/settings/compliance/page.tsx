'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetConfigurationByKey,
  useUpdateConfiguration
} from '@/api/generated/endpoints/platform-configuration/platform-configuration';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, FileCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CONFIG_KEY = 'compliance_config';

const complianceConfigSchema = z.object({
  // ADP/ACP Testing
  enableADPTesting: z.boolean(),
  adpTestingPeriod: z.string(),
  adpHCEThreshold: z.number().min(0),
  adpFailureCorrection: z.string(),

  enableACPTesting: z.boolean(),
  acpTestingPeriod: z.string(),
  acpHCEThreshold: z.number().min(0),
  acpFailureCorrection: z.string(),

  // Top-Heavy Testing
  enableTopHeavyTesting: z.boolean(),
  topHeavyRatio: z.number().min(0).max(100),
  topHeavyMinimumContribution: z.number().min(0).max(100),

  // 402(g) Monitoring
  enable402gMonitoring: z.boolean(),
  autoCorrectExcess: z.boolean(),
  excessDeferralDeadline: z.string(),

  // Coverage Testing
  enableCoverageTesting: z.boolean(),
  ratioPercentageTest: z.number().min(0).max(100),
  averageBenefitTest: z.boolean(),

  // Participation Requirements
  minimumParticipationPercentage: z.number().min(0).max(100),
  excludeCollectivelyBargained: z.boolean(),
  excludeNonResidentAliens: z.boolean(),

  // Reporting
  enableAutomatedReporting: z.boolean(),
  form5500AutoFile: z.boolean(),
  form5500Deadline: z.string(),
  auditRequirement: z.boolean(),
  auditThresholdParticipants: z.number().min(0),

  // Compliance Alerts
  enableComplianceAlerts: z.boolean(),
  alertAdministrators: z.boolean(),
  alertDaysBeforeDeadline: z.number().min(1).max(90),
});

type ComplianceConfigForm = z.infer<typeof complianceConfigSchema>;

const defaultValues: ComplianceConfigForm = {
  enableADPTesting: true,
  adpTestingPeriod: 'plan_year',
  adpHCEThreshold: 150000,
  adpFailureCorrection: 'refund',

  enableACPTesting: true,
  acpTestingPeriod: 'plan_year',
  acpHCEThreshold: 150000,
  acpFailureCorrection: 'refund',

  enableTopHeavyTesting: true,
  topHeavyRatio: 60,
  topHeavyMinimumContribution: 3,

  enable402gMonitoring: true,
  autoCorrectExcess: true,
  excessDeferralDeadline: 'april_15',

  enableCoverageTesting: true,
  ratioPercentageTest: 70,
  averageBenefitTest: true,

  minimumParticipationPercentage: 40,
  excludeCollectivelyBargained: true,
  excludeNonResidentAliens: true,

  enableAutomatedReporting: true,
  form5500AutoFile: false,
  form5500Deadline: 'july_31',
  auditRequirement: true,
  auditThresholdParticipants: 100,

  enableComplianceAlerts: true,
  alertAdministrators: true,
  alertDaysBeforeDeadline: 30,
};

export default function ComplianceConfigurationPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: configData, isLoading } = useGetConfigurationByKey(CONFIG_KEY, {
    query: {
      retry: false,
    },
  });

  const updateConfigMutation = useUpdateConfiguration({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/superadmin/config/${CONFIG_KEY}`] });
        toast.success('Compliance configuration saved successfully');
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to save compliance configuration';
        toast.error(message);
      },
    },
  });

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<ComplianceConfigForm>({
    resolver: zodResolver(complianceConfigSchema),
    defaultValues,
  });

  useEffect(() => {
    if (configData?.configValue) {
      try {
        const savedConfig = JSON.parse(configData.configValue) as Partial<ComplianceConfigForm>;
        reset({ ...defaultValues, ...savedConfig });
      } catch (error) {
        console.error('Error parsing config:', error);
      }
    }
  }, [configData, reset]);

  const onSubmit = async (data: ComplianceConfigForm) => {
    try {
      await updateConfigMutation.mutateAsync({
        key: CONFIG_KEY,
        data: { configValue: JSON.stringify(data) },
      });
    } catch (error) {
      // Handled by mutation
    }
  };

  if (isLoading) {
    return (
      <DashboardContent>
        <div className="space-y-8 max-w-6xl">
          <div className="space-y-4">
            <Button onClick={() => router.push('/admin/settings')} variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <Skeleton className="h-7 w-56 mb-2" />
              <Skeleton className="h-4 w-80" />
            </div>
          </div>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {[1, 2].map((j) => (
                      <div key={j} className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <div className="space-y-8 max-w-6xl">
        <div className="space-y-4">
          <Button onClick={() => router.push('/admin/settings')} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Compliance & Testing</h1>
            <p className="text-sm text-muted-foreground mt-1">ADP/ACP testing, compliance rules, and regulatory requirements</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ADP Testing */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              ADP Testing (Actual Deferral Percentage)
            </CardTitle>
            <CardDescription>Configure annual ADP nondiscrimination testing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable ADP Testing</Label>
                <p className="text-xs text-muted-foreground">Test whether plan favors highly compensated employees</p>
              </div>
              <Switch checked={watch('enableADPTesting')} onCheckedChange={(checked) => setValue('enableADPTesting', checked)} />
            </div>

            {watch('enableADPTesting') && (
              <div className="grid gap-6 md:grid-cols-2 ml-6">
                <div className="space-y-2">
                  <Label htmlFor="adpTestingPeriod">Testing Period</Label>
                  <Select value={watch('adpTestingPeriod')} onValueChange={(value) => setValue('adpTestingPeriod', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plan_year">Plan Year</SelectItem>
                      <SelectItem value="calendar_year">Calendar Year</SelectItem>
                      <SelectItem value="prior_year">Prior Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adpHCEThreshold">HCE Threshold ($)</Label>
                  <Input id="adpHCEThreshold" type="number" min={0} {...register('adpHCEThreshold', { valueAsNumber: true })} />
                  <p className="text-xs text-muted-foreground">IRS threshold for highly compensated employees</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adpFailureCorrection">Failure Correction Method</Label>
                  <Select value={watch('adpFailureCorrection')} onValueChange={(value) => setValue('adpFailureCorrection', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="refund">Refund Excess Deferrals</SelectItem>
                      <SelectItem value="qnec">QNEC to NHCEs</SelectItem>
                      <SelectItem value="qmac">QMAC to NHCEs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ACP Testing */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>ACP Testing (Actual Contribution Percentage)</CardTitle>
            <CardDescription>Configure annual ACP nondiscrimination testing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable ACP Testing</Label>
                <p className="text-xs text-muted-foreground">Test matching and after-tax contributions</p>
              </div>
              <Switch checked={watch('enableACPTesting')} onCheckedChange={(checked) => setValue('enableACPTesting', checked)} />
            </div>

            {watch('enableACPTesting') && (
              <div className="grid gap-6 md:grid-cols-2 ml-6">
                <div className="space-y-2">
                  <Label htmlFor="acpTestingPeriod">Testing Period</Label>
                  <Select value={watch('acpTestingPeriod')} onValueChange={(value) => setValue('acpTestingPeriod', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="plan_year">Plan Year</SelectItem>
                      <SelectItem value="calendar_year">Calendar Year</SelectItem>
                      <SelectItem value="prior_year">Prior Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="acpHCEThreshold">HCE Threshold ($)</Label>
                  <Input id="acpHCEThreshold" type="number" min={0} {...register('acpHCEThreshold', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="acpFailureCorrection">Failure Correction Method</Label>
                  <Select value={watch('acpFailureCorrection')} onValueChange={(value) => setValue('acpFailureCorrection', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="refund">Refund Excess Contributions</SelectItem>
                      <SelectItem value="qnec">QNEC to NHCEs</SelectItem>
                      <SelectItem value="forfeit">Forfeit Excess Match</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top-Heavy Testing */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Top-Heavy Testing</CardTitle>
            <CardDescription>Determine if plan benefits favor key employees</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Top-Heavy Testing</Label>
                <p className="text-xs text-muted-foreground">Required for most 401(k) plans</p>
              </div>
              <Switch checked={watch('enableTopHeavyTesting')} onCheckedChange={(checked) => setValue('enableTopHeavyTesting', checked)} />
            </div>

            {watch('enableTopHeavyTesting') && (
              <div className="grid gap-6 md:grid-cols-2 ml-6">
                <div className="space-y-2">
                  <Label htmlFor="topHeavyRatio">Top-Heavy Ratio (%)</Label>
                  <Input id="topHeavyRatio" type="number" min={0} max={100} {...register('topHeavyRatio', { valueAsNumber: true })} />
                  <p className="text-xs text-muted-foreground">Plan is top-heavy if key employee accounts exceed this percentage</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="topHeavyMinimumContribution">Minimum Contribution (%)</Label>
                  <Input id="topHeavyMinimumContribution" type="number" min={0} max={100} {...register('topHeavyMinimumContribution', { valueAsNumber: true })} />
                  <p className="text-xs text-muted-foreground">Required contribution for non-key employees if top-heavy</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 402(g) Monitoring */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>402(g) Excess Deferral Monitoring</CardTitle>
            <CardDescription>Monitor and correct excess elective deferrals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable 402(g) Monitoring</Label>
                <p className="text-xs text-muted-foreground">Track deferrals against annual IRS limit</p>
              </div>
              <Switch checked={watch('enable402gMonitoring')} onCheckedChange={(checked) => setValue('enable402gMonitoring', checked)} />
            </div>

            {watch('enable402gMonitoring') && (
              <div className="grid gap-6 md:grid-cols-2 ml-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-Correct Excess Deferrals</Label>
                    <p className="text-xs text-muted-foreground">Automatically distribute excess amounts</p>
                  </div>
                  <Switch checked={watch('autoCorrectExcess')} onCheckedChange={(checked) => setValue('autoCorrectExcess', checked)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="excessDeferralDeadline">Correction Deadline</Label>
                  <Select value={watch('excessDeferralDeadline')} onValueChange={(value) => setValue('excessDeferralDeadline', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select deadline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="april_15">April 15 (Following Year)</SelectItem>
                      <SelectItem value="plan_year_end">Plan Year End</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coverage Testing */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Coverage Testing (410(b))</CardTitle>
            <CardDescription>Ensure plan covers a sufficient percentage of employees</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Coverage Testing</Label>
                <p className="text-xs text-muted-foreground">IRS 410(b) minimum coverage requirements</p>
              </div>
              <Switch checked={watch('enableCoverageTesting')} onCheckedChange={(checked) => setValue('enableCoverageTesting', checked)} />
            </div>

            {watch('enableCoverageTesting') && (
              <div className="space-y-4 ml-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="ratioPercentageTest">Ratio Percentage (%)</Label>
                    <Input id="ratioPercentageTest" type="number" min={0} max={100} {...register('ratioPercentageTest', { valueAsNumber: true })} />
                    <p className="text-xs text-muted-foreground">Minimum 70% of NHCE coverage ratio to HCE ratio</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minimumParticipationPercentage">Minimum Participation (%)</Label>
                    <Input id="minimumParticipationPercentage" type="number" min={0} max={100} {...register('minimumParticipationPercentage', { valueAsNumber: true })} />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Average Benefit Test</Label>
                    <Switch checked={watch('averageBenefitTest')} onCheckedChange={(checked) => setValue('averageBenefitTest', checked)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Exclude Collectively Bargained</Label>
                    <Switch checked={watch('excludeCollectivelyBargained')} onCheckedChange={(checked) => setValue('excludeCollectivelyBargained', checked)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Exclude Non-Resident Aliens</Label>
                    <Switch checked={watch('excludeNonResidentAliens')} onCheckedChange={(checked) => setValue('excludeNonResidentAliens', checked)} />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reporting */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Compliance Reporting</CardTitle>
            <CardDescription>Form 5500 filing and audit requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Automated Reporting</Label>
                <p className="text-xs text-muted-foreground">Automate compliance report generation</p>
              </div>
              <Switch checked={watch('enableAutomatedReporting')} onCheckedChange={(checked) => setValue('enableAutomatedReporting', checked)} />
            </div>

            {watch('enableAutomatedReporting') && (
              <div className="grid gap-6 md:grid-cols-2 ml-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-File Form 5500</Label>
                    <p className="text-xs text-muted-foreground">Automatically submit to DOL/IRS</p>
                  </div>
                  <Switch checked={watch('form5500AutoFile')} onCheckedChange={(checked) => setValue('form5500AutoFile', checked)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="form5500Deadline">Form 5500 Deadline</Label>
                  <Select value={watch('form5500Deadline')} onValueChange={(value) => setValue('form5500Deadline', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select deadline" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="july_31">July 31 (7 months after plan year)</SelectItem>
                      <SelectItem value="october_15">October 15 (With extension)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Audit Requirement</Label>
                    <p className="text-xs text-muted-foreground">Required for plans with 100+ participants</p>
                  </div>
                  <Switch checked={watch('auditRequirement')} onCheckedChange={(checked) => setValue('auditRequirement', checked)} />
                </div>
                {watch('auditRequirement') && (
                  <div className="space-y-2">
                    <Label htmlFor="auditThresholdParticipants">Audit Threshold (Participants)</Label>
                    <Input id="auditThresholdParticipants" type="number" min={0} {...register('auditThresholdParticipants', { valueAsNumber: true })} />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compliance Alerts */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Compliance Alerts</CardTitle>
            <CardDescription>Automated notifications for compliance deadlines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Compliance Alerts</Label>
                <p className="text-xs text-muted-foreground">Send alerts for upcoming compliance deadlines</p>
              </div>
              <Switch checked={watch('enableComplianceAlerts')} onCheckedChange={(checked) => setValue('enableComplianceAlerts', checked)} />
            </div>

            {watch('enableComplianceAlerts') && (
              <div className="grid gap-6 md:grid-cols-2 ml-6">
                <div className="flex items-center justify-between">
                  <Label>Alert Administrators</Label>
                  <Switch checked={watch('alertAdministrators')} onCheckedChange={(checked) => setValue('alertAdministrators', checked)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="alertDaysBeforeDeadline">Alert Days Before Deadline</Label>
                  <Input id="alertDaysBeforeDeadline" type="number" min={1} max={90} {...register('alertDaysBeforeDeadline', { valueAsNumber: true })} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push('/admin/settings')}>Cancel</Button>
          <Button type="submit" disabled={updateConfigMutation.isPending}>
            {updateConfigMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Configuration'}
          </Button>
          </div>
        </form>
      </div>
    </DashboardContent>
  );
}
