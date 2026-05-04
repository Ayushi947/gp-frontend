'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  IconEye,
  IconEyeOff,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/lib/toast';
import { ROUTES, getDashboardUrl } from '@/config/routes';
import { useLogin1, useResolveTenants } from '@/api/generated/endpoints/authentication/authentication';
import { useLogin as useSuperAdminLogin } from '@/api/generated/endpoints/superadmin-auth/superadmin-auth';
import type { TenantInfo } from '@/api/generated/models';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantInfo | null>(null);
  const [emailForTenantLookup, setEmailForTenantLookup] = useState<string>('');
  const [showTenantSelector, setShowTenantSelector] = useState(false);

  const isSessionExpired = searchParams.get('session') === 'expired';

  const loginMutation = useLogin1();
  const superAdminLoginMutation = useSuperAdminLogin();

  // Resolve tenants when email changes
  const { data: tenantsData, isLoading: isLoadingTenants } = useResolveTenants(
    { email: emailForTenantLookup },
    { query: { enabled: !!emailForTenantLookup } }
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    getValues,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  // Auto-select tenant if only one exists
  useEffect(() => {
    if (tenantsData?.tenants && tenantsData.tenants.length > 0) {
      if (tenantsData.tenants.length === 1) {
        setSelectedTenant(tenantsData.tenants[0] || null);
        setShowTenantSelector(false);
      } else {
        setShowTenantSelector(true);
      }
    }
  }, [tenantsData]);


  const handleEmailBlur = () => {
    const email = getValues('email');
    if (email && email.includes('@')) {
      setEmailForTenantLookup(email);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    const email = data.email.trim();

    // Check if this is a super admin email (no tenant needed)
    const isSuperAdmin = email.toLowerCase() === 'admin@glidingpath.com' ||
                         email.toLowerCase().includes('superadmin');

    // If no tenant resolved yet and not super admin, trigger lookup
    if (!selectedTenant && !emailForTenantLookup && !isSuperAdmin) {
      setEmailForTenantLookup(email);
      return;
    }

    // If tenant lookup is in progress, wait
    if (isLoadingTenants && !isSuperAdmin) {
      return;
    }

    // If multiple tenants and none selected, show selector
    if (tenantsData?.tenants && tenantsData.tenants.length > 1 && !selectedTenant && !isSuperAdmin) {
      setShowTenantSelector(true);
      toast.error('Please select an organization', 'Multiple organizations found for this email.');
      return;
    }

    // Handler for successful login (shared between regular and super admin)
    const handleLoginSuccess = (response: any) => {
      const storage = data.rememberMe ? localStorage : sessionStorage;

      // Store access token for API authentication
      if (response.accessToken) {
        storage.setItem('accessToken', response.accessToken);
        storage.setItem('tokenType', response.tokenType || 'Bearer');
      }

      // Store user info for UI purposes
      if (response.user) {
        storage.setItem('userInfo', JSON.stringify(response.user));
      }

      // Store tenant ID for API requests (X-Tenant-ID header)
      // Priority: response.tenantId > response.user.tenantId > selectedTenant?.orgId
      const tenantIdToStore =
        response.tenantId ||
        response.user?.tenantId ||
        selectedTenant?.orgId;
      if (tenantIdToStore) {
        storage.setItem('tenantId', tenantIdToStore);
      }

      storage.setItem('isAuthenticated', 'true');

      toast.success('Welcome back!', 'You have successfully signed in.');

      // Redirect based on user role using the getDashboardUrl helper
      const userRole = response.user?.role ?? 'SPONSOR';
      const redirectUrl = getDashboardUrl(userRole);

      router.push(redirectUrl);
    };

    const handleLoginError = (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        'Sign in failed',
        err?.response?.data?.message || 'Invalid email or password. Please try again.'
      );
    };

    // Use super admin endpoint for super admin login
    if (isSuperAdmin) {
      superAdminLoginMutation.mutate(
        {
          data: {
            realm: 'platform', // Super admin uses 'platform' realm
            username: email,
            password: data.password,
          },
        },
        {
          onSuccess: handleLoginSuccess,
          onError: handleLoginError,
        }
      );
    } else {
      // Use regular login endpoint for sponsor/participant login
      const realm = selectedTenant?.orgId || 'default';

      loginMutation.mutate(
        {
          data: {
            realm,
            username: email,
            password: data.password,
          },
        },
        {
          onSuccess: handleLoginSuccess,
          onError: handleLoginError,
        }
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-3">
                <Image
                  src="/assets/images/Final Logo.svg"
                  alt="GlidingPath Logo"
                  width={40}
                  height={40}
                  className="w-10 h-10"
                />
                <span className="text-2xl font-bold">GlidingPath</span>
              </div>
            </div>
            {/* <CardTitle className="text-2xl">Welcome Back</CardTitle> */}
            <CardDescription>
              Sign in to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  disabled={loginMutation.isPending}
                  {...register('email')}
                  onBlur={handleEmailBlur}
                  className={errors.email ? 'border-error' : ''}
                />
                {errors.email && (
                  <p className="text-xs text-error">{errors.email.message}</p>
                )}
              </div>

              {/* Tenant Selector - shown when multiple tenants exist */}
              {showTenantSelector && tenantsData?.tenants && tenantsData.tenants.length > 1 && (
                <div className="space-y-2">
                  <Label htmlFor="tenant">Organization</Label>
                  <Select
                    value={selectedTenant?.orgId || ''}
                    onValueChange={(value) => {
                      const tenant = tenantsData.tenants?.find((t) => t.orgId === value);
                      setSelectedTenant(tenant || null);
                    }}
                    disabled={loginMutation.isPending}
                  >
                    <SelectTrigger id="tenant" className="w-full">
                      <SelectValue placeholder="Select an organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenantsData.tenants.filter((tenant) => tenant.orgId).map((tenant) => (
                        <SelectItem key={tenant.orgId} value={tenant.orgId!}>
                          {tenant.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loginMutation.isPending}
                    {...register('password')}
                    className={errors.password ? 'border-error pr-10' : 'pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <IconEyeOff className="h-4 w-4" />
                    ) : (
                      <IconEye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-error">{errors.password.message}</p>
                )}
                <div className="text-right">
                  <Link
                    href={ROUTES.AUTH.FORGOT_PASSWORD}
                    className="text-sm text-muted-foreground hover:text-primary hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <Button
                  type="submit"
                  className="w-full max-w-xs rounded-full bg-gradient-to-r from-[#3B82F6] to-[#A855F7] text-white text-base font-medium shadow-md hover:shadow-lg transition-shadow duration-200"
                  disabled={loginMutation.isPending || isLoadingTenants}
                  loading={loginMutation.isPending}
                  loadingText="Signing in..."
                >
                  Sign In
                </Button>
              </div>
            </form>

            {isSessionExpired && (
              <div className="mt-4 text-sm">
                <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-amber-900">
                  Your session has expired. You can continue your participant enrollment without signing in.
                </div>
              </div>
            )}

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                Don&apos;t have an account?{' '}
              </span>
              <Link
                href={ROUTES.GET_STARTED.ROOT}
                className="text-primary hover:underline font-medium"
              >
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
