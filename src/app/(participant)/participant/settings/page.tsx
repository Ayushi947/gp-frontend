'use client';

import { useState } from 'react';
import {
  IconUser,
  IconMail,
  IconPhone,
  IconHome,
  IconBell,
  IconLock,
  IconShieldCheck,
  IconUsers,
  IconDeviceFloppy,
  IconAlertTriangle,
  IconRefresh,
  IconCheck,
  IconEdit,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { useGetParticipantPersonalDetails } from '@/api/generated/endpoints/participants/participants';
import { toast } from '@/lib/toast';

/**
 * Page Header
 */
function PageHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and personal information
        </p>
      </div>
    </div>
  );
}

/**
 * Personal Information Card
 */
function PersonalInfoCard() {
  const { data: personalDetails, isLoading, error, refetch } = useGetParticipantPersonalDetails();
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <IconAlertTriangle className="h-12 w-12 text-error mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unable to Load Personal Details</h3>
          <Button onClick={() => refetch()}>
            <IconRefresh className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconUser className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Personal Information</CardTitle>
            <CardDescription>Your basic account details</CardDescription>
          </div>
        </div>
        <Button
          variant={isEditing ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            if (isEditing) {
              toast.success('Changes saved successfully');
            }
            setIsEditing(!isEditing);
          }}
        >
          {isEditing ? (
            <>
              <IconDeviceFloppy className="mr-2 h-4 w-4" />
              Save
            </>
          ) : (
            <>
              <IconEdit className="mr-2 h-4 w-4" />
              Edit
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              defaultValue={personalDetails?.fullName ?? ''}
              disabled={!isEditing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              defaultValue={personalDetails?.dateOfBirth ?? ''}
              disabled={!isEditing}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Contact Information Card
 */
function ContactInfoCard() {
  const { data: personalDetails, isLoading } = useGetParticipantPersonalDetails();
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconMail className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Contact Information</CardTitle>
            <CardDescription>How we can reach you</CardDescription>
          </div>
        </div>
        <Button
          variant={isEditing ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            if (isEditing) {
              toast.success('Contact information updated');
            }
            setIsEditing(!isEditing);
          }}
        >
          {isEditing ? (
            <>
              <IconDeviceFloppy className="mr-2 h-4 w-4" />
              Save
            </>
          ) : (
            <>
              <IconEdit className="mr-2 h-4 w-4" />
              Edit
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              defaultValue={personalDetails?.emailAddress ?? ''}
              disabled={!isEditing}
              className="pl-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <div className="relative">
            <IconPhone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              defaultValue={personalDetails?.phoneNumber ?? ''}
              disabled={!isEditing}
              className="pl-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Mailing Address</Label>
          <div className="relative">
            <IconHome className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="address"
              defaultValue={personalDetails?.address ?? ''}
              disabled={!isEditing}
              className="pl-10"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Notification Preferences Card
 */
function NotificationPreferencesCard() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconBell className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Notification Preferences</CardTitle>
            <CardDescription>Choose how you want to be notified</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="space-y-0.5">
            <p className="font-medium text-sm">Email Notifications</p>
            <p className="text-xs text-muted-foreground">
              Receive account updates and alerts via email
            </p>
          </div>
          <Checkbox
            checked={emailNotifications}
            onCheckedChange={(checked) => setEmailNotifications(checked as boolean)}
          />
        </div>
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="space-y-0.5">
            <p className="font-medium text-sm">SMS Notifications</p>
            <p className="text-xs text-muted-foreground">
              Receive important alerts via text message
            </p>
          </div>
          <Checkbox
            checked={smsNotifications}
            onCheckedChange={(checked) => setSmsNotifications(checked as boolean)}
          />
        </div>
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="space-y-0.5">
            <p className="font-medium text-sm">Marketing Communications</p>
            <p className="text-xs text-muted-foreground">
              Receive tips, news, and retirement planning resources
            </p>
          </div>
          <Checkbox
            checked={marketingEmails}
            onCheckedChange={(checked) => setMarketingEmails(checked as boolean)}
          />
        </div>
        <Button
          className="w-full"
          onClick={() => toast.success('Notification preferences saved')}
        >
          <IconDeviceFloppy className="mr-2 h-4 w-4" />
          Save Preferences
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Security Settings Card
 */
function SecuritySettingsCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconLock className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Security Settings</CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <p className="font-medium">Password</p>
            <p className="text-sm text-muted-foreground">
              Last changed 30 days ago
            </p>
          </div>
          <Button variant="outline" size="sm">
            Change Password
          </Button>
        </div>
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <p className="font-medium">Two-Factor Authentication</p>
              <Badge variant="secondary">Recommended</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security to your account
            </p>
          </div>
          <Button variant="outline" size="sm">
            Enable
          </Button>
        </div>
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <p className="font-medium">Login History</p>
            <p className="text-sm text-muted-foreground">
              Review recent account activity
            </p>
          </div>
          <Button variant="ghost" size="sm">
            View History
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Beneficiaries Card
 */
function BeneficiariesCard() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IconUsers className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Beneficiaries</CardTitle>
            <CardDescription>Who receives your account benefits</CardDescription>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <IconEdit className="mr-2 h-4 w-4" />
          Update
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                J
              </div>
              <div>
                <p className="font-medium text-sm">Jane Doe</p>
                <p className="text-xs text-muted-foreground">Primary - Spouse</p>
              </div>
            </div>
            <Badge>100%</Badge>
          </div>
          <p className="text-xs text-muted-foreground text-center pt-2">
            <IconShieldCheck className="inline h-3 w-3 mr-1" />
            Beneficiary designations are kept confidential
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Participant Settings Page
 */
export default function ParticipantSettingsPage() {
  return (
    <DashboardContent>
      <PageHeader />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          <PersonalInfoCard />
          <ContactInfoCard />
          <BeneficiariesCard />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <NotificationPreferencesCard />
          <SecuritySettingsCard />
        </div>
      </div>
    </DashboardContent>
  );
}
