'use client';

import { useState } from 'react';
import {
  IconUsers,
  IconPlus,
  IconEdit,
  IconTrash,
  IconCheck,
  IconX,
  IconInfoCircle,
  IconAlertTriangle,
  IconRefresh,
  IconUser,
  IconPhone,
  IconMail,
  IconMapPin,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { useUpdateBeneficiary } from '@/api/generated/endpoints/participants/participants';
import { formatPercent, cn } from '@/lib/utils';
import { toast } from '@/lib/toast';

interface Beneficiary {
  id: string;
  type: 'primary' | 'contingent';
  firstName: string;
  lastName: string;
  relationship: string;
  dateOfBirth: string;
  percentage: number;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

// Note: No GET API available for beneficiaries yet - starting with empty state
// When a GET endpoint is available, replace this with API data
const initialBeneficiaries: Beneficiary[] = [];

const relationshipOptions = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'child', label: 'Child' },
  { value: 'parent', label: 'Parent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'domestic-partner', label: 'Domestic Partner' },
  { value: 'trust', label: 'Trust' },
  { value: 'estate', label: 'Estate' },
  { value: 'charity', label: 'Charity' },
  { value: 'other', label: 'Other' },
];

/**
 * Page Header
 */
function PageHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Beneficiaries</h1>
        <p className="text-muted-foreground">
          Designate who receives your 401(k) account
        </p>
      </div>
    </div>
  );
}

/**
 * Allocation Summary Card
 */
function AllocationSummaryCard({
  primaryTotal,
  contingentTotal,
}: {
  primaryTotal: number;
  contingentTotal: number;
}) {
  const primaryComplete = primaryTotal === 100;
  const contingentComplete = contingentTotal === 100 || contingentTotal === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Allocation Summary</CardTitle>
        <CardDescription>
          Beneficiaries must total 100% for each type
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Primary Beneficiaries</span>
            <div className="flex items-center gap-2">
              <span className={cn('text-sm font-bold', primaryComplete ? 'text-success' : 'text-warning')}>
                {formatPercent(primaryTotal)}
              </span>
              {primaryComplete ? (
                <IconCheck className="h-4 w-4 text-success" />
              ) : (
                <IconAlertTriangle className="h-4 w-4 text-warning" />
              )}
            </div>
          </div>
          <Progress value={primaryTotal} className="h-2" />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Contingent Beneficiaries</span>
            <div className="flex items-center gap-2">
              <span className={cn('text-sm font-bold', contingentComplete ? 'text-success' : 'text-warning')}>
                {formatPercent(contingentTotal)}
              </span>
              {contingentComplete ? (
                <IconCheck className="h-4 w-4 text-success" />
              ) : (
                <IconAlertTriangle className="h-4 w-4 text-warning" />
              )}
            </div>
          </div>
          <Progress value={contingentTotal} className="h-2" />
        </div>

        {(!primaryComplete || !contingentComplete) && (
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
            <p className="text-xs text-warning">
              {!primaryComplete && 'Primary beneficiaries must total 100%. '}
              {!contingentComplete && contingentTotal > 0 && 'Contingent beneficiaries must total 100%.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Beneficiary Card
 */
function BeneficiaryCard({
  beneficiary,
  onEdit,
  onDelete,
}: {
  beneficiary: Beneficiary;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const relationshipLabel = relationshipOptions.find((r) => r.value === beneficiary.relationship)?.label ?? beneficiary.relationship;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <IconUser className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold">
                {beneficiary.firstName} {beneficiary.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">{relationshipLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={beneficiary.type === 'primary' ? 'default' : 'secondary'}>
              {beneficiary.type === 'primary' ? 'Primary' : 'Contingent'}
            </Badge>
            <span className="text-xl font-bold">{formatPercent(beneficiary.percentage)}</span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          {beneficiary.dateOfBirth && (
            <div>
              <span className="text-muted-foreground">Date of Birth:</span>
              <span className="ml-2 font-medium">
                {new Date(beneficiary.dateOfBirth).toLocaleDateString()}
              </span>
            </div>
          )}
          {beneficiary.email && (
            <div className="flex items-center gap-1">
              <IconMail className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{beneficiary.email}</span>
            </div>
          )}
          {beneficiary.phone && (
            <div className="flex items-center gap-1">
              <IconPhone className="h-4 w-4 text-muted-foreground" />
              <span>{beneficiary.phone}</span>
            </div>
          )}
          {beneficiary.address && (
            <div className="flex items-center gap-1 sm:col-span-2">
              <IconMapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">
                {beneficiary.address.street}, {beneficiary.address.city}, {beneficiary.address.state} {beneficiary.address.zipCode}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
            <IconEdit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive">
            <IconTrash className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Add/Edit Beneficiary Dialog
 */
function BeneficiaryDialog({
  open,
  onOpenChange,
  beneficiary,
  onSave,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  beneficiary: Beneficiary | null;
  onSave: (data: Partial<Beneficiary>) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<Partial<Beneficiary>>({
    type: 'primary',
    firstName: '',
    lastName: '',
    relationship: '',
    dateOfBirth: '',
    percentage: 0,
    email: '',
    phone: '',
    ...beneficiary,
  });

  const isEditing = !!beneficiary;

  const handleChange = (field: keyof Beneficiary, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.firstName || !formData.lastName || !formData.relationship || !formData.percentage) {
      toast.error('Missing fields', 'Please fill in all required fields.');
      return;
    }
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Beneficiary' : 'Add Beneficiary'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the beneficiary information below.'
              : 'Add a new beneficiary to receive your 401(k) account.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Type Selection */}
          <div className="space-y-2">
            <Label>Beneficiary Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleChange('type', value as 'primary' | 'contingent')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary Beneficiary</SelectItem>
                <SelectItem value="contingent">Contingent Beneficiary</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Contingent beneficiaries receive benefits only if primary beneficiaries are unavailable.
            </p>
          </div>

          {/* Name */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder="First name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder="Last name"
              />
            </div>
          </div>

          {/* Relationship & DOB */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Relationship *</Label>
              <Select
                value={formData.relationship}
                onValueChange={(value) => handleChange('relationship', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {relationshipOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
              />
            </div>
          </div>

          {/* Percentage */}
          <div className="space-y-2">
            <Label htmlFor="percentage">Percentage *</Label>
            <Input
              id="percentage"
              type="number"
              min="0"
              max="100"
              value={formData.percentage}
              onChange={(e) => handleChange('percentage', parseInt(e.target.value) || 0)}
              placeholder="Enter percentage (0-100)"
            />
            <p className="text-xs text-muted-foreground">
              All beneficiaries of the same type must total 100%.
            </p>
          </div>

          {/* Contact Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            <IconX className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            <IconCheck className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Beneficiary'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Empty State
 */
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
          <IconUsers className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Beneficiaries Designated</h3>
        <p className="text-muted-foreground text-center mb-6 max-w-sm">
          Designate beneficiaries to ensure your 401(k) account is distributed according to your wishes.
        </p>
        <Button onClick={onAdd}>
          <IconPlus className="h-4 w-4 mr-2" />
          Add Beneficiary
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Beneficiaries Page
 */
export default function BeneficiariesPage() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(initialBeneficiaries);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingBeneficiaryId, setDeletingBeneficiaryId] = useState<string | null>(null);

  const updateBeneficiaryMutation = useUpdateBeneficiary();

  // Calculate totals
  const primaryTotal = beneficiaries
    .filter((b) => b.type === 'primary')
    .reduce((sum, b) => sum + b.percentage, 0);
  const contingentTotal = beneficiaries
    .filter((b) => b.type === 'contingent')
    .reduce((sum, b) => sum + b.percentage, 0);

  const primaryBeneficiaries = beneficiaries.filter((b) => b.type === 'primary');
  const contingentBeneficiaries = beneficiaries.filter((b) => b.type === 'contingent');

  const handleAdd = () => {
    setEditingBeneficiary(null);
    setDialogOpen(true);
  };

  const handleEdit = (beneficiary: Beneficiary) => {
    setEditingBeneficiary(beneficiary);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingBeneficiaryId(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (deletingBeneficiaryId) {
      setBeneficiaries((prev) => prev.filter((b) => b.id !== deletingBeneficiaryId));
      toast.success('Beneficiary removed', 'The beneficiary has been removed from your account.');
    }
    setDeleteConfirmOpen(false);
    setDeletingBeneficiaryId(null);
  };

  const handleSave = (data: Partial<Beneficiary>) => {
    if (editingBeneficiary) {
      // Update existing
      setBeneficiaries((prev) =>
        prev.map((b) =>
          b.id === editingBeneficiary.id ? { ...b, ...data } : b
        )
      );
      toast.success('Beneficiary updated', 'Your changes have been saved.');
    } else {
      // Add new
      const newBeneficiary: Beneficiary = {
        id: Date.now().toString(),
        type: data.type ?? 'primary',
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
        relationship: data.relationship ?? '',
        dateOfBirth: data.dateOfBirth ?? '',
        percentage: data.percentage ?? 0,
        email: data.email,
        phone: data.phone,
      };
      setBeneficiaries((prev) => [...prev, newBeneficiary]);
      toast.success('Beneficiary added', 'The new beneficiary has been added to your account.');
    }
    setDialogOpen(false);
  };

  return (
    <DashboardContent>
      <PageHeader />

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-info/10 border border-info/30">
        <IconInfoCircle className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">Important Information</p>
          <p className="text-xs text-muted-foreground mt-1">
            Your beneficiary designation determines who will receive your 401(k) account balance.
            Keep this information up to date, especially after major life events like marriage, divorce, or the birth of a child.
          </p>
        </div>
      </div>

      {beneficiaries.length === 0 ? (
        <EmptyState onAdd={handleAdd} />
      ) : (
        <>
          {/* Allocation Summary */}
          <AllocationSummaryCard primaryTotal={primaryTotal} contingentTotal={contingentTotal} />

          {/* Primary Beneficiaries */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Primary Beneficiaries</h2>
              <Button variant="outline" size="sm" onClick={handleAdd}>
                <IconPlus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            {primaryBeneficiaries.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {primaryBeneficiaries.map((beneficiary) => (
                  <BeneficiaryCard
                    key={beneficiary.id}
                    beneficiary={beneficiary}
                    onEdit={() => handleEdit(beneficiary)}
                    onDelete={() => handleDelete(beneficiary.id)}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No primary beneficiaries designated. Click &quot;Add&quot; to add one.
                </CardContent>
              </Card>
            )}
          </div>

          {/* Contingent Beneficiaries */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Contingent Beneficiaries</h2>
              <Button variant="outline" size="sm" onClick={handleAdd}>
                <IconPlus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            {contingentBeneficiaries.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {contingentBeneficiaries.map((beneficiary) => (
                  <BeneficiaryCard
                    key={beneficiary.id}
                    beneficiary={beneficiary}
                    onEdit={() => handleEdit(beneficiary)}
                    onDelete={() => handleDelete(beneficiary.id)}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No contingent beneficiaries designated. Contingent beneficiaries receive benefits only if primary beneficiaries are unavailable.
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Add/Edit Dialog */}
      <BeneficiaryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        beneficiary={editingBeneficiary}
        onSave={handleSave}
        isLoading={updateBeneficiaryMutation.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Beneficiary?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this beneficiary from your account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardContent>
  );
}
