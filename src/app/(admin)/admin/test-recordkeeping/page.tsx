'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { toast } from '@/lib/toast';
import {
  IconLoader2,
  IconCircleCheck,
  IconFileText,
  IconDatabase,
  IconCloudUpload,
  IconArrowLeft,
} from '@tabler/icons-react';
import { useCompleteWorkflowDemo } from '@/api/generated/endpoints/payroll-demo/payroll-demo';
import { useCompleteTradeWorkflow } from '@/api/generated/endpoints/btc-trade-demo/btc-trade-demo';

function RecordkeepingDemoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenantId');

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // Date states
  const [payrollPeriodStart, setPayrollPeriodStart] = useState(
    `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`
  );
  const [payrollPeriodEnd, setPayrollPeriodEnd] = useState(
    `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${new Date(currentYear, currentMonth + 1, 0).getDate()}`
  );

  // Results
  const [payrollResults, setPayrollResults] = useState<any>(null);
  const [btcResults, setBtcResults] = useState<any>(null);

  // Mutations with better error handling
  const payrollMutation = useCompleteWorkflowDemo({
    mutation: {
      onSuccess: (data) => {
        console.log('Payroll workflow response:', data);
        const result = data as unknown as any;
        setPayrollResults(result);
        toast.success('Payroll Workflow Complete!', result?.summary?.totalDuration || 'Workflow completed successfully');
      },
      onError: (error: any) => {
        console.error('Payroll workflow error:', error);
        const errorMsg = error?.response?.data?.message || error?.message || 'An error occurred';
        toast.error('Payroll Workflow Failed', errorMsg);
      },
    },
  });

  const btcMutation = useCompleteTradeWorkflow({
    mutation: {
      onSuccess: (data) => {
        console.log('BTC workflow response:', data);
        const result = data as unknown as any;
        setBtcResults(result);
        toast.success('BTC Trade Workflow Complete!', result?.summary?.totalDuration || 'Workflow completed successfully');
      },
      onError: (error: any) => {
        console.error('BTC workflow error:', error);
        const errorMsg = error?.response?.data?.message || error?.message || 'An error occurred';
        toast.error('BTC Workflow Failed', errorMsg);
      },
    },
  });

  const runPayrollWorkflow = () => {
    if (!tenantId) {
      toast.error('Tenant ID Required', 'Please navigate from a tenant details page');
      return;
    }

    console.log('Running payroll workflow with dates:', { tenantId, payrollPeriodStart, payrollPeriodEnd });
    setPayrollResults(null);
    payrollMutation.mutate({
      params: {
        tenantId,
        payrollPeriodStart,
        payrollPeriodEnd,
      },
    });
  };

  const runBtcWorkflow = () => {
    if (!tenantId) {
      toast.error('Tenant ID Required', 'Please navigate from a tenant details page');
      return;
    }

    console.log('Running BTC workflow with tenantId:', tenantId);
    setBtcResults(null);
    btcMutation.mutate({
      params: {
        tenantId,
        batchIdentifier: `batch-${Date.now()}`,
      },
    });
  };

  return (
    <DashboardContent>
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <IconArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recordkeeping & Payroll Demo</h1>
          <p className="text-muted-foreground">
            Comprehensive demonstration of the complete payroll and BTC trade workflow
          </p>
          {tenantId && (
            <p className="text-sm text-muted-foreground mt-1">
              Tenant ID: <span className="font-mono">{tenantId}</span>
            </p>
          )}
        </div>
      </div>

      {/* PAYROLL WORKFLOW */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFileText className="h-5 w-5" />
            Payroll Workflow
          </CardTitle>
          <CardDescription>Complete end-to-end payroll processing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start">Payroll Period Start</Label>
              <Input
                id="start"
                type="date"
                value={payrollPeriodStart}
                onChange={(e) => setPayrollPeriodStart(e.target.value)}
                disabled={payrollMutation.isPending}
              />
            </div>
            <div>
              <Label htmlFor="end">Payroll Period End</Label>
              <Input
                id="end"
                type="date"
                value={payrollPeriodEnd}
                onChange={(e) => setPayrollPeriodEnd(e.target.value)}
                disabled={payrollMutation.isPending}
              />
            </div>
          </div>

          <div className="text-sm text-muted-foreground bg-primary/5 p-4 rounded-lg border">
            <p className="font-medium mb-2">Workflow Steps:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Pre-payroll calculations (contributions + matching)</li>
              <li>Batch processing via Spring Batch</li>
              <li>Trade instruction aggregation (participant → sponsor)</li>
              <li>Payroll report generation</li>
            </ul>
          </div>

          <Button onClick={runPayrollWorkflow} disabled={payrollMutation.isPending} className="w-full" size="lg">
            {payrollMutation.isPending && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
            {payrollMutation.isPending ? 'Processing Payroll...' : 'Run Complete Payroll Workflow'}
          </Button>

          {payrollResults && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <IconCircleCheck className="h-6 w-6 text-green-600" />
                  Payroll Workflow Complete!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="text-2xl font-bold text-green-600 capitalize">
                      {payrollResults?.status || payrollResults?.overallStatus || 'success'}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="text-2xl font-bold text-primary">{payrollResults?.summary?.totalDuration || 'N/A'}</p>
                  </div>
                </div>
                <details className="bg-white p-4 rounded-lg border">
                  <summary className="font-medium cursor-pointer py-2 hover:text-primary">View Full Results</summary>
                  <pre className="mt-2 text-xs overflow-x-auto max-h-96 p-4 bg-muted rounded border font-mono">
                    {JSON.stringify(payrollResults, null, 2)}
                  </pre>
                </details>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* BTC TRADE WORKFLOW */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconCloudUpload className="h-5 w-5" />
            BTC Trade Workflow
          </CardTitle>
          <CardDescription>Complete BTC trade file generation, acknowledgments, and confirmations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground bg-purple-50 p-4 rounded-lg border border-purple-200">
            <p className="font-medium mb-2">Complete Workflow:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Aggregate participant trades to sponsor level</li>
              <li>Generate TR (Trade) file and send to BTC via SFTP</li>
              <li>Wait for AK (Acknowledgment) file (~2 seconds)</li>
              <li>Wait for TM (Trade Confirmation) file (~4 seconds)</li>
              <li>Update trade statuses to EXECUTED</li>
            </ul>
          </div>

          <div className="text-sm text-muted-foreground bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="font-medium mb-2">Prerequisites:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>BTC Mock Server must be running (port 2222)</li>
              <li>Pending trades must exist (run Payroll Workflow first)</li>
            </ul>
          </div>

          <Button onClick={runBtcWorkflow} disabled={btcMutation.isPending || !tenantId} className="w-full" size="lg">
            {btcMutation.isPending && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
            {btcMutation.isPending ? 'Processing BTC Workflow...' : 'Run Complete BTC Trade Workflow'}
          </Button>

          {btcResults && (
            <Card className="bg-purple-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <IconCircleCheck className="h-6 w-6 text-purple-600" />
                  BTC Trade Workflow Complete!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="text-2xl font-bold text-green-600 capitalize">
                      {btcResults?.status || btcResults?.overallStatus || 'success'}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="text-2xl font-bold text-primary">{btcResults?.summary?.totalDuration || 'N/A'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <p className="text-sm text-muted-foreground">Trades Processed</p>
                    <p className="text-2xl font-bold text-purple-600">{btcResults?.summary?.tradesProcessed || 0}</p>
                  </div>
                </div>
                <details className="bg-white p-4 rounded-lg border">
                  <summary className="font-medium cursor-pointer py-2 hover:text-purple-600">View Full Results</summary>
                  <pre className="mt-2 text-xs overflow-x-auto max-h-96 p-4 bg-muted rounded border font-mono">
                    {JSON.stringify(btcResults, null, 2)}
                  </pre>
                </details>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </DashboardContent>
  );
}

export default function RecordkeepingDemoPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <RecordkeepingDemoContent />
    </Suspense>
  );
}
