'use client';

import {
  IconShieldCheck,
  IconShieldX,
  IconAlertTriangle,
  IconInfoCircle,
  IconChevronRight,
  IconFileAnalytics,
} from '@tabler/icons-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { COMPLIANCE_TESTS } from '@/config/retirement';
import { cn, formatDate } from '@/lib/utils';

type TestStatus = 'passed' | 'failed' | 'warning' | 'pending' | 'not_applicable';

interface TestResult {
  testId: keyof typeof COMPLIANCE_TESTS;
  status: TestStatus;
  hcePercentage?: number;
  nhcePercentage?: number;
  maximumAllowed?: number;
  correctionRequired?: boolean;
  correctionAmount?: number;
  notes?: string;
}

interface ComplianceResultsProps {
  planYear: number;
  testDate: string;
  results: TestResult[];
  className?: string;
  onViewDetails?: (testId: string) => void;
  onRunTests?: () => void;
}

const statusConfig: Record<
  TestStatus,
  { icon: typeof IconShieldCheck; color: string; label: string }
> = {
  passed: {
    icon: IconShieldCheck,
    color: 'text-success bg-success/10',
    label: 'Passed',
  },
  failed: {
    icon: IconShieldX,
    color: 'text-error bg-error/10',
    label: 'Failed',
  },
  warning: {
    icon: IconAlertTriangle,
    color: 'text-warning bg-warning/10',
    label: 'Warning',
  },
  pending: {
    icon: IconInfoCircle,
    color: 'text-muted-foreground bg-muted',
    label: 'Pending',
  },
  not_applicable: {
    icon: IconInfoCircle,
    color: 'text-muted-foreground bg-muted',
    label: 'N/A',
  },
};

function TestResultRow({
  result,
  onViewDetails,
}: {
  result: TestResult;
  onViewDetails?: (testId: string) => void;
}) {
  const test = COMPLIANCE_TESTS[result.testId];
  if (!test) return null;

  const config = statusConfig[result.status];
  const StatusIcon = config.icon;

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
            config.color
          )}
        >
          <StatusIcon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{test.name}</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <IconInfoCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">{test.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-xs text-muted-foreground truncate">{test.fullName}</p>

          {/* Show percentages for ADP/ACP tests */}
          {result.hcePercentage !== undefined && result.nhcePercentage !== undefined && (
            <div className="flex gap-4 mt-1 text-xs">
              <span>
                HCE: <span className="font-medium tabular-nums">{result.hcePercentage.toFixed(2)}%</span>
              </span>
              <span>
                NHCE: <span className="font-medium tabular-nums">{result.nhcePercentage.toFixed(2)}%</span>
              </span>
              {result.maximumAllowed !== undefined && (
                <span>
                  Max: <span className="font-medium tabular-nums">{result.maximumAllowed.toFixed(2)}%</span>
                </span>
              )}
            </div>
          )}

          {/* Correction info */}
          {result.correctionRequired && result.correctionAmount !== undefined && (
            <p className="text-xs text-error mt-1">
              Correction required: ${result.correctionAmount.toLocaleString()}
            </p>
          )}

          {result.notes && (
            <p className="text-xs text-muted-foreground mt-1">{result.notes}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <Badge
          variant={
            result.status === 'passed'
              ? 'default'
              : result.status === 'failed'
                ? 'destructive'
                : 'secondary'
          }
        >
          {config.label}
        </Badge>
        {onViewDetails && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewDetails(result.testId)}
            className="h-8 w-8 p-0"
          >
            <IconChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Display compliance test results
 */
export function ComplianceResults({
  planYear,
  testDate,
  results,
  className,
  onViewDetails,
  onRunTests,
}: ComplianceResultsProps) {
  const passedCount = results.filter((r) => r.status === 'passed').length;
  const failedCount = results.filter((r) => r.status === 'failed').length;
  const warningCount = results.filter((r) => r.status === 'warning').length;

  const overallStatus: TestStatus =
    failedCount > 0 ? 'failed' : warningCount > 0 ? 'warning' : 'passed';

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconFileAnalytics className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{planYear} Compliance Testing</CardTitle>
          </div>
          {onRunTests && (
            <Button variant="outline" size="sm" onClick={onRunTests}>
              Run Tests
            </Button>
          )}
        </div>
        <CardDescription>
          Last tested: {formatDate(testDate)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              statusConfig[overallStatus].color
            )}
          >
            {overallStatus === 'passed' ? (
              <IconShieldCheck className="h-5 w-5" />
            ) : overallStatus === 'failed' ? (
              <IconShieldX className="h-5 w-5" />
            ) : (
              <IconAlertTriangle className="h-5 w-5" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium">
              {overallStatus === 'passed'
                ? 'All Tests Passed'
                : overallStatus === 'failed'
                  ? 'Action Required'
                  : 'Review Recommended'}
            </p>
            <p className="text-sm text-muted-foreground">
              {passedCount} passed, {failedCount} failed, {warningCount} warnings
            </p>
          </div>
        </div>

        {/* Test Results */}
        <div className="space-y-1">
          {results.map((result) => (
            <TestResultRow
              key={result.testId}
              result={result}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact compliance status badge for dashboards
 */
export function ComplianceStatusBadge({
  status,
  testsRun,
  testsFailed,
  className,
}: {
  status: 'compliant' | 'non_compliant' | 'pending';
  testsRun: number;
  testsFailed: number;
  className?: string;
}) {
  const config = {
    compliant: {
      icon: IconShieldCheck,
      color: 'text-success bg-success/10',
      label: 'Compliant',
    },
    non_compliant: {
      icon: IconShieldX,
      color: 'text-error bg-error/10',
      label: 'Non-Compliant',
    },
    pending: {
      icon: IconInfoCircle,
      color: 'text-muted-foreground bg-muted',
      label: 'Pending',
    },
  };

  const { icon: Icon, color, label } = config[status];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex h-8 w-8 items-center justify-center rounded-full', color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          {testsRun} tests, {testsFailed} failed
        </p>
      </div>
    </div>
  );
}
