'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconDownload,
  IconAlertTriangle,
  IconRefresh,
  IconFileAnalytics,
  IconChevronLeft,
  IconChevronRight,
  IconArrowLeft,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DashboardContent } from '@/components/layout/dashboard-layout';
import { useListReports5 } from '@/api/generated/endpoints/annual-reports/annual-reports';
import type { AnnualReportDTO } from '@/api/generated/models';
import { toast } from '@/lib/toast';
import { format } from 'date-fns';

/**
 * Pagination Component
 */
function Pagination({
  page,
  totalPages,
  pageSize,
  totalElements,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  totalPages: number;
  pageSize: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const startItem = page * pageSize + 1;
  const endItem = Math.min((page + 1) * pageSize, totalElements);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-4 py-4 border-t">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          Showing {startItem}-{endItem} of {totalElements}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="w-16 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
          >
            <IconChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm px-2">
            {page + 1} / {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
          >
            <IconChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Annual Reports Page
 */
export default function AnnualReportsPage() {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const {
    data: reportsData,
    isLoading,
    error,
    refetch,
  } = useListReports5({ page, size: pageSize });

  const reports = (reportsData?.content ?? []) as AnnualReportDTO[];
  const totalElements = reportsData?.totalElements ?? 0;
  const totalPages = reportsData?.totalPages ?? 0;

  const handleDownload = (report: AnnualReportDTO) => {
    if (report.downloadUrl) {
      window.open(report.downloadUrl, '_blank');
    } else {
      toast.info('Download', 'Download URL not available');
    }
  };

  if (isLoading) {
    return (
      <DashboardContent>
        <div className="mb-4">
          <Button
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-2"
            onClick={() => router.push('/reports')}
          >
            <IconArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Annual Reports</h1>
          <p className="text-muted-foreground">
            Form 5500, Summary Plan Description, and yearly compliance documents
          </p>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="space-y-4 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </DashboardContent>
    );
  }

  if (error) {
    return (
      <DashboardContent>
        <div className="mb-4">
          <Button
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-2"
            onClick={() => router.push('/reports')}
          >
            <IconArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Annual Reports</h1>
          <p className="text-muted-foreground">
            Form 5500, Summary Plan Description, and yearly compliance documents
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconAlertTriangle className="h-12 w-12 text-error mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Reports</h3>
            <p className="text-muted-foreground text-center mb-4">
              There was an error loading the annual reports.
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
      <div className="mb-4">
        <Button
          variant="outline"
          size="sm"
          className="inline-flex items-center gap-2"
          onClick={() => router.push('/reports')}
        >
          <IconArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Annual Reports</h1>
        <p className="text-muted-foreground">
          Form 5500, Summary Plan Description, and yearly compliance documents
        </p>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconFileAnalytics className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Annual Reports</h3>
            <p className="text-muted-foreground text-center">
              No annual reports have been generated yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Annual Reports ({totalElements})</CardTitle>
            <CardDescription>
              View and download yearly compliance documents
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium text-muted-foreground">Year</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Title</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Published</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <span className="font-semibold text-lg">{report.year}</span>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{report.title}</p>
                          {report.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {report.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={
                            report.status === 'PUBLISHED'
                              ? 'default'
                              : report.status === 'DRAFT'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {report.status ?? 'Unknown'}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm">
                        {report.publishDate
                          ? format(new Date(report.publishDate), 'MMM d, yyyy')
                          : '-'}
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(report)}
                          disabled={!report.downloadUrl}
                        >
                          <IconDownload className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                pageSize={pageSize}
                totalElements={totalElements}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(0);
                }}
              />
            )}
          </CardContent>
        </Card>
      )}
    </DashboardContent>
  );
}
