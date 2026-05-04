'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Shield, Check, AlertCircle, Copy, QrCode, Key, Smartphone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetMfaStatus,
  useSetupMfa,
  useVerifyMfa,
  useDisableMfa,
} from '@/api/generated/endpoints/superadmin-mfa/superadmin-mfa';

export default function MFASettingsPage() {
  const router = useRouter();
  const [step, setStep] = useState<'generate' | 'verify' | 'complete'>('generate');
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const { data: mfaStatus, refetch: refetchMfaStatus, isLoading } = useGetMfaStatus({
    query: {
      retry: false,
    },
  });

  const setupMfaMutation = useSetupMfa();
  const verifyMfaMutation = useVerifyMfa();
  const disableMfaMutation = useDisableMfa();

  useEffect(() => {
    if (mfaStatus?.mfaEnabled) {
      setStep('complete');
    }
  }, [mfaStatus]);

  const generateMFASecret = async () => {
    try {
      // TODO: API contract issue - setupMfa endpoint doesn't match generated types
      // MfaStatusResponse doesn't have 'secret' or 'qrCodeUrl' properties
      // but the actual API response does. Casting through any as workaround.
      const result = await setupMfaMutation.mutateAsync({
        data: { secret: '' },
      });

      // Cast through any because API response doesn't match generated MfaStatusResponse type
      const response = result as any;
      if (response.secret && response.qrCodeUrl) {
        setSecret(response.secret);
        setQrCodeUrl(response.qrCodeUrl);
        setStep('verify');
        toast.success('MFA secret generated successfully');
      }
    } catch (error) {
      console.error('Error generating MFA secret:', error);
      toast.error('Failed to generate MFA secret');
    }
  };

  const verifyMFACode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    try {
      const result = await verifyMfaMutation.mutateAsync({
        data: { code: verificationCode },
      });

      if (result.mfaEnabled) {
        setStep('complete');
        await refetchMfaStatus();
        toast.success('MFA enabled successfully!');
      } else {
        toast.error('Invalid verification code. Please try again.');
      }
    } catch (error: any) {
      console.error('Error verifying MFA code:', error);
      toast.error(error.message || 'Failed to verify MFA code');
    } finally {
      setVerificationCode('');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const disableMFA = async () => {
    try {
      await disableMfaMutation.mutateAsync();
      setStep('generate');
      setSecret('');
      setQrCodeUrl('');
      await refetchMfaStatus();
      toast.success('MFA disabled successfully');
    } catch (error) {
      console.error('Error disabling MFA:', error);
      toast.error('Failed to disable MFA');
    }
  };

  if (isLoading) {
    return (
      <DashboardContent>
        <div className="space-y-8 max-w-4xl">
          <div className="space-y-4">
            <Button onClick={() => router.push('/admin/settings')} variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <Skeleton className="h-7 w-72 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-3 w-64" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full mb-4" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <div className="space-y-8 max-w-4xl">
        <div className="space-y-4">
          <Button onClick={() => router.push('/admin/settings')} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Multi-Factor Authentication</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Secure your account with two-factor authentication
            </p>
          </div>
        </div>

        <Card className={`hover:shadow-md transition-shadow ${mfaStatus?.mfaEnabled ? 'border-success bg-success/10' : 'border-warning bg-warning/10'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {mfaStatus?.mfaEnabled ? (
                <Check className="h-5 w-5 text-success" />
              ) : (
                <AlertCircle className="h-5 w-5 text-warning" />
              )}
              <div>
                <p className="text-sm font-medium">
                  MFA is currently {mfaStatus?.mfaEnabled ? 'enabled' : 'disabled'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {mfaStatus?.mfaEnabled
                    ? 'Your account is protected with two-factor authentication'
                    : 'Enable MFA to secure your account and enable impersonation features'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {!mfaStatus?.mfaEnabled && step === 'generate' && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Enable Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg bg-muted p-4">
                <h3 className="text-sm font-semibold mb-2">What you'll need:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    <span>An authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    <span>Your phone's camera to scan the QR code</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    <span>A secure place to store your backup codes</span>
                  </li>
                </ul>
              </div>

              <Button onClick={generateMFASecret} disabled={setupMfaMutation.isPending} className="w-full">
                {setupMfaMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate MFA Secret'
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'verify' && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Scan QR Code
              </CardTitle>
              <CardDescription>
                Use your authenticator app to scan this QR code
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {qrCodeUrl && (
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                </div>
              )}

              <div className="space-y-2">
                <Label>Manual Entry Code</Label>
                <div className="flex gap-2">
                  <Input value={secret} readOnly className="font-mono" />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(secret)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  If you can't scan the QR code, manually enter this code into your authenticator app
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verificationCode">Enter Verification Code</Label>
                <Input
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-2xl tracking-wider"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              <Button onClick={verifyMFACode} disabled={verifyMfaMutation.isPending} className="w-full">
                {verifyMfaMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify and Enable MFA'
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {mfaStatus?.mfaEnabled && step === 'complete' && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-success" />
                MFA Enabled Successfully
              </CardTitle>
              <CardDescription>
                Your account is now protected with two-factor authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg bg-success/10 p-4 border border-success/30">
                <p className="text-sm text-success">
                  You will now be required to enter a verification code from your authenticator app when logging in.
                </p>
              </div>

              <Button onClick={disableMFA} disabled={disableMfaMutation.isPending} variant="destructive" className="w-full">
                {disableMfaMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Disabling...
                  </>
                ) : (
                  'Disable MFA'
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardContent>
  );
}
