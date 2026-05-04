'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useGetAllRules,
  useCreateRule,
  useUpdateRule,
  useDeleteRule,
  useValidateRule,
  useReloadRules,
  useHealth,
  useGetDiagnostics,
} from '@/api/generated/endpoints/rules-management/rules-management';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconLoader2,
  IconSearch,
  IconRefresh,
  IconCode,
  IconCheckbox,
  IconAlertCircle,
  IconCircleCheck,
  IconInfoCircle,
  IconActivity,
  IconEngine,
  IconFileCode,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

const ruleSchema = z.object({
  name: z
    .string()
    .min(1, 'Rule name is required')
    .max(100)
    .regex(
      /^[a-z0-9-]+$/,
      'Name must be lowercase with hyphens only (e.g., eligibility-rule)',
    ),
  ruleContent: z.string().min(10, 'Rule content is required (minimum 10 characters)'),
  description: z.string().optional().or(z.literal('')),
  version: z.string().optional().or(z.literal('')),
  active: z.boolean().default(true),
});

type RuleFormData = z.infer<typeof ruleSchema>;

export default function AdminRulesPage() {
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [diagnosticsDialogOpen, setDiagnosticsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any | null>(null);
  const [viewingRule, setViewingRule] = useState<any | null>(null);
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [validating, setValidating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reloadDialogOpen, setReloadDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

  const { data: rules, isLoading, refetch } = useGetAllRules();
  const { data: healthData, refetch: refetchHealth } = useHealth();
  const { data: diagnosticsData } = useGetDiagnostics();

  const createMutation = useCreateRule({
    mutation: {
      onSuccess: () => {
        toast.success('Rule created successfully');
        setDialogOpen(false);
        form.reset();
        setValidationResult(null);
        refetch();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to create rule';
        toast.error(message);
      },
    },
  });

  const updateMutation = useUpdateRule({
    mutation: {
      onSuccess: () => {
        toast.success('Rule updated successfully');
        setDialogOpen(false);
        setEditingRule(null);
        form.reset();
        setValidationResult(null);
        refetch();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to update rule';
        toast.error(message);
      },
    },
  });

  const deleteMutation = useDeleteRule({
    mutation: {
      onSuccess: () => {
        toast.success('Rule deleted successfully');
        refetch();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to delete rule';
        toast.error(message);
      },
    },
  });

  const validateMutation = useValidateRule({
    mutation: {
      onSuccess: (data: any) => {
        setValidationResult(data);
        if (data.valid) {
          toast.success('Rule validation passed');
        } else {
          toast.error('Rule validation failed - check errors below');
        }
        setValidating(false);
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to validate rule';
        toast.error(message);
        setValidating(false);
      },
    },
  });

  const reloadMutation = useReloadRules({
    mutation: {
      onSuccess: () => {
        toast.success('Rules engine reloaded successfully');
        refetchHealth();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message || 'Failed to reload rules engine';
        toast.error(message);
      },
    },
  });

  const form = useForm<RuleFormData>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      name: '',
      ruleContent: '',
      description: '',
      version: '1.0',
      active: true,
    },
  });

  const rulesArray = Array.isArray(rules) ? rules : [];

  const filteredRules = rulesArray.filter((rule: any) => {
    const matchesSearch =
      !search ||
      rule.name?.toLowerCase().includes(search.toLowerCase()) ||
      rule.description?.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  const handleOpenDialog = (rule: any = null) => {
    if (rule) {
      setEditingRule(rule);
      form.reset({
        name: rule.name || '',
        ruleContent: rule.ruleContent || '',
        description: rule.description || '',
        version: rule.version || '1.0',
        active: rule.active !== false,
      });
    } else {
      setEditingRule(null);
      form.reset({
        name: '',
        ruleContent: `package rules;\n\nrule "New Rule"\nwhen\n    // Add conditions here\nthen\n    // Add actions here\nend`,
        description: '',
        version: '1.0',
        active: true,
      });
    }
    setValidationResult(null);
    setDialogOpen(true);
  };

  const handleViewRule = (rule: any) => {
    setViewingRule(rule);
    setViewDialogOpen(true);
  };

  const handleValidate = async () => {
    const ruleContent = form.getValues('ruleContent');
    if (!ruleContent || ruleContent.trim().length < 10) {
      toast.error('Please enter rule content to validate');
      return;
    }

    setValidating(true);
    await validateMutation.mutateAsync({ data: ruleContent });
  };

  const handleSubmit = async (data: RuleFormData) => {
    if (editingRule) {
      await updateMutation.mutateAsync({
        id: editingRule.id,
        data,
      });
    } else {
      await createMutation.mutateAsync({ data });
    }
  };

  const handleDelete = (ruleId: string) => {
    setRuleToDelete(ruleId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (ruleToDelete) {
      deleteMutation.mutate({ id: ruleToDelete });
    }
    setDeleteDialogOpen(false);
    setRuleToDelete(null);
  };

  const handleToggleActive = async (rule: any) => {
    await updateMutation.mutateAsync({
      id: rule.id,
      data: {
        ...rule,
        active: !rule.active,
      },
    });
  };

  const handleReloadEngine = () => {
    setReloadDialogOpen(true);
  };

  const confirmReload = () => {
    reloadMutation.mutate();
    setReloadDialogOpen(false);
  };

  if (isLoading) {
    return (
      <DashboardContent>
        <div className="space-y-8">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-5" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[400px] w-full" />
            </CardContent>
          </Card>
        </div>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rules Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure and manage Drools business rules for 401(k) compliance
          </p>
        </div>

        {/* Status Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Engine Status Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Engine Status
              </CardTitle>
              <IconEngine className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {healthData && (healthData as any).status === 'UP' ? (
                  <>
                    <IconCircleCheck className="h-5 w-5 text-success" />
                    <span className="text-2xl font-bold text-success">Healthy</span>
                  </>
                ) : (
                  <>
                    <IconAlertCircle className="h-5 w-5 text-destructive" />
                    <span className="text-2xl font-bold text-destructive">Down</span>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Drools runtime status</p>
            </CardContent>
          </Card>

          {/* Total Rules Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Rules
              </CardTitle>
              <IconFileCode className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rulesArray.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {rulesArray.filter((r: any) => r.active !== false).length} active rules
              </p>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Quick Actions
              </CardTitle>
              <IconActivity className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReloadEngine}
                disabled={reloadMutation.isPending}
              >
                {reloadMutation.isPending ? (
                  <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <IconRefresh className="h-4 w-4 mr-2" />
                )}
                Reload
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDiagnosticsDialogOpen(true)}
              >
                <IconActivity className="h-4 w-4 mr-2" />
                Diagnostics
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Business Rules Table Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Business Rules</CardTitle>
                <CardDescription>Drools rules for compliance and calculations</CardDescription>
              </div>
              <Button onClick={() => handleOpenDialog()}>
                <IconPlus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 max-w-md"
              />
            </div>

            {/* Rules Table */}
            {filteredRules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/30">
                <IconCode className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-1">
                  {search ? 'No rules found' : 'No rules configured'}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {search
                    ? 'Try adjusting your search criteria'
                    : 'Get started by adding your first business rule'}
                </p>
                {!search && (
                  <Button className="mt-4" onClick={() => handleOpenDialog()}>
                    <IconPlus className="h-4 w-4 mr-2" />
                    Add Your First Rule
                  </Button>
                )}
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Rule Name</TableHead>
                      <TableHead className="font-semibold">Description</TableHead>
                      <TableHead className="font-semibold">Version</TableHead>
                      <TableHead className="font-semibold">Last Updated</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRules.map((rule: any) => (
                      <TableRow key={rule.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <IconCode className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-mono text-sm font-medium">{rule.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm line-clamp-2">
                            {rule.description || (
                              <span className="text-muted-foreground italic">No description</span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{rule.version || 'N/A'}</Badge>
                        </TableCell>
                        <TableCell>
                          {rule.lastUpdated ? (
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(rule.lastUpdated), 'MMM d, yyyy')}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={rule.active !== false}
                              onCheckedChange={() => handleToggleActive(rule)}
                            />
                            <Badge
                              variant={rule.active !== false ? 'default' : 'secondary'}
                              className={rule.active !== false ? 'bg-success/10 text-success border-success/20' : ''}
                            >
                              {rule.active !== false ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleViewRule(rule)}
                                  >
                                    <IconInfoCircle className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View DRL</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleOpenDialog(rule)}
                                  >
                                    <IconEdit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit Rule</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDelete(rule.id)}
                                  >
                                    <IconTrash className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete Rule</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Rule Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit Rule' : 'Create New Rule'}</DialogTitle>
            <DialogDescription>
              {editingRule
                ? 'Update DRL rule content and metadata'
                : 'Configure a new Drools business rule'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">
                  Rule Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="e.g., eligibility-check"
                  className="font-mono"
                  disabled={!!editingRule}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Lowercase with hyphens only
                </p>
              </div>

              <div>
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  {...form.register('version')}
                  placeholder="e.g., 1.0"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                {...form.register('description')}
                placeholder="Brief description of rule purpose"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="ruleContent">
                  DRL Content <span className="text-destructive">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleValidate}
                  disabled={validating}
                >
                  {validating ? (
                    <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <IconCheckbox className="h-4 w-4 mr-2" />
                  )}
                  Validate
                </Button>
              </div>
              <Textarea
                id="ruleContent"
                {...form.register('ruleContent')}
                placeholder="Enter DRL (Drools Rule Language) content..."
                className="font-mono text-sm min-h-[300px]"
              />
              {form.formState.errors.ruleContent && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.ruleContent.message}
                </p>
              )}
            </div>

            {validationResult && (
              <div
                className={`p-4 rounded-lg border ${
                  validationResult.valid
                    ? 'bg-success/10 border-success/30'
                    : 'bg-destructive/10 border-destructive/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  {validationResult.valid ? (
                    <IconCircleCheck className="h-5 w-5 text-success mt-0.5 shrink-0" />
                  ) : (
                    <IconAlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium text-sm ${validationResult.valid ? 'text-success' : 'text-destructive'}`}>
                      {validationResult.valid ? 'Validation Passed' : 'Validation Failed'}
                    </p>
                    {validationResult.errors && validationResult.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-destructive">Errors:</p>
                        <ul className="list-disc list-inside text-sm text-destructive/80 space-y-1 mt-1">
                          {validationResult.errors.map((error: string, idx: number) => (
                            <li key={idx}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {validationResult.warnings && validationResult.warnings.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-warning">Warnings:</p>
                        <ul className="list-disc list-inside text-sm text-warning/80 space-y-1 mt-1">
                          {validationResult.warnings.map((warning: string, idx: number) => (
                            <li key={idx}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="active"
                  checked={form.watch('active')}
                  onCheckedChange={(checked) => form.setValue('active', checked)}
                />
                <Label htmlFor="active" className="cursor-pointer">
                  Active (rule will be loaded into engine)
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setEditingRule(null);
                  form.reset();
                  setValidationResult(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingRule ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>{editingRule ? 'Update Rule' : 'Create Rule'}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Rule Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rule: {viewingRule?.name}</DialogTitle>
            <DialogDescription>
              {viewingRule?.description || 'View rule DRL content'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Version</Label>
                <p className="font-medium">{viewingRule?.version || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Badge variant={viewingRule?.active !== false ? 'default' : 'secondary'}>
                  {viewingRule?.active !== false ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">DRL Content</Label>
              <pre className="mt-2 p-4 bg-muted rounded-lg text-sm font-mono overflow-auto max-h-[500px] border">
                {viewingRule?.ruleContent}
              </pre>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diagnostics Dialog */}
      <Dialog open={diagnosticsDialogOpen} onOpenChange={setDiagnosticsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Engine Diagnostics</DialogTitle>
            <DialogDescription>
              Detailed information about the Drools rule engine
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <pre className="p-4 bg-muted rounded-lg text-sm font-mono overflow-auto max-h-[600px] border">
              {diagnosticsData
                ? JSON.stringify(diagnosticsData, null, 2)
                : 'No diagnostics data available'}
            </pre>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiagnosticsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this rule? This action cannot be undone.
              You will need to reload the engine to remove it from runtime.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRuleToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reload Engine Confirmation Dialog */}
      <AlertDialog open={reloadDialogOpen} onOpenChange={setReloadDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reload Rules Engine</AlertDialogTitle>
            <AlertDialogDescription>
              This will reload all rules into the Drools engine. Any inactive rules will be
              removed from runtime. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReload}>
              Reload Engine
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardContent>
  );
}
