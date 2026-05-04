'use client';

import {
  IconFileAnalytics,
  IconDownload,
  IconAlertTriangle,
  IconRefresh,
  IconCalendar,
  IconFile,
  IconFileTypePdf,
  IconClock,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { useGetDocuments } from '@/api/generated/endpoints/document-management/document-management';
import type { DocumentsDTO } from '@/api/generated/models';
import { toast } from '@/lib/toast';
import { format, parseISO } from 'date-fns';
import { formatEnum } from '@/lib/utils';

/**
 * Page Header Component
 */
function PageHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Statements & Documents</h1>
        <p className="text-muted-foreground">
          View and download your personal account statements and disclosures
        </p>
      </div>
    </div>
  );
}

/**
 * Statement Document Card
 */
function StatementCard({ document }: { document: DocumentsDTO }) {
  // Use fileName from API, fallback to extracting from fileKey if not available
  const fileName = document.fileName || 
    (document.fileKey ? document.fileKey.split('/').pop() : null) || 
    'Statement';
  const fileExtension = fileName.split('.').pop()?.toLowerCase();
  const isPdf = fileExtension === 'pdf';

  const handleDownload = () => {
    if (document.downloadUrl) {
      window.open(document.downloadUrl, '_blank');
    } else {
      toast.error('Download Error', 'Unable to download this document. Please try again later.');
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown date';
    try {
      return format(parseISO(dateString), 'MMMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {isPdf ? (
              <IconFileTypePdf className="h-6 w-6" />
            ) : (
              <IconFile className="h-6 w-6" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{fileName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <IconCalendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {formatDate(document.createdAt)}
              </span>
            </div>
            {document.status && (
              <Badge
                variant={document.status === 'APPROVED' ? 'default' : 'secondary'}
                className="mt-2"
              >
                {formatEnum(document.status)}
              </Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <IconDownload className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Empty State Component
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <IconFileAnalytics className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">No Documents Available</h3>
      <p className="text-muted-foreground text-center max-w-md">
        Your personal account statements and documents will appear here once they are generated.
        Statements are typically issued quarterly.
      </p>
    </div>
  );
}

/**
 * Loading Skeleton
 */
function StatementsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Statement Types Info Card
 */
function StatementTypesCard() {
  const statementTypes = [
    {
      name: 'Quarterly Statement',
      description: 'Your account activity summary including contributions, earnings, and balances',
      frequency: 'Every 3 months',
    },
    {
      name: 'Annual Statement',
      description: 'Year-end summary of your total contributions and investment performance',
      frequency: 'Annually',
    },
    {
      name: 'Fee Disclosure',
      description: 'Information about plan fees that may affect your account',
      frequency: 'Annually',
    },
    {
      name: 'Tax Documents',
      description: 'Form 1099-R and other tax-related documents for your records',
      frequency: 'As applicable',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Document Types</CardTitle>
        <CardDescription>Personal documents you may receive</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {statementTypes.map((type) => (
            <div key={type.name} className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <IconFile className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-sm">{type.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
                <div className="flex items-center gap-1 mt-1">
                  <IconClock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{type.frequency}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Statements Page
 */
export default function StatementsPage() {
  const { data: documentsData, isLoading, error, refetch } = useGetDocuments();

  // Filter documents to show only participant-related documents
  const documents = (documentsData?.documents ?? []) as DocumentsDTO[];

  // Exclude sponsor/admin documents (agreements, contracts, etc.)
  const excludedPatterns = [
    'agreement',
    'contract',
    'sponsor',
    'admin',
    'glidingpath',
    'signed',
    'adoption',
    'plan-document',
    'service-agreement',
  ];

  // Include only participant-relevant documents
  const participantDocumentPatterns = [
    'statement',
    'quarterly',
    'annual',
    'benefit',
    'fee-disclosure',
    'participant',
    'enrollment',
    'confirmation',
    'tax',
    '1099',
    '5500',
    'summary-plan',
    'spd',
  ];

  const displayDocuments = documents.filter((doc) => {
    const fileKey = doc.fileKey?.toLowerCase() ?? '';
    const fileName = doc.fileName?.toLowerCase() ?? '';
    const searchText = `${fileKey} ${fileName}`;

    // Exclude sponsor/admin documents
    const isExcluded = excludedPatterns.some(pattern => searchText.includes(pattern));
    if (isExcluded) return false;

    // Include if matches participant document patterns, or if no patterns match (general documents)
    const isParticipantDoc = participantDocumentPatterns.some(pattern => searchText.includes(pattern));

    // Only show documents that are clearly participant-related
    // If document doesn't match any pattern, don't show it (safer default)
    return isParticipantDoc;
  });

  if (error) {
    return (
      <DashboardContent>
        <PageHeader />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconAlertTriangle className="h-12 w-12 text-error mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Statements</h3>
            <p className="text-muted-foreground text-center mb-4">
              There was an error loading your statements.
            </p>
            <Button onClick={() => refetch()}>
              <IconRefresh className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <PageHeader />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Statements List */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Documents</CardTitle>
              <CardDescription>
                Download your personal account statements and disclosures
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <StatementsSkeleton />
              ) : displayDocuments.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="space-y-4">
                  {displayDocuments.map((document) => (
                    <StatementCard key={document.id} document={document} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Statement Types Info */}
        <div>
          <StatementTypesCard />
        </div>
      </div>
    </DashboardContent>
  );
}
