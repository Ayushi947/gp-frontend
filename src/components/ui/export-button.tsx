'use client';

import { useState } from 'react';
import {
  IconDownload,
  IconFileTypeCsv,
  IconFileTypeXls,
  IconFileTypePdf,
  IconLoader2,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/lib/toast';
import { exportData, type ExportFormat } from '@/lib/export';

/**
 * Column definition for export
 */
interface ExportColumn<T> {
  key: keyof T | string;
  header: string;
  formatter?: (value: unknown, row: T) => string;
}

interface ExportButtonProps<T extends Record<string, unknown>> {
  /**
   * Data to export
   */
  data: T[];

  /**
   * Column definitions
   */
  columns: ExportColumn<T>[];

  /**
   * Filename for the export (without extension)
   */
  filename: string;

  /**
   * Available export formats
   */
  formats?: ExportFormat[];

  /**
   * Options for specific formats
   */
  options?: {
    sheetName?: string;
    pdfTitle?: string;
  };

  /**
   * Disabled state
   */
  disabled?: boolean;

  /**
   * Button variant
   */
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';

  /**
   * Button size
   */
  size?: 'default' | 'sm' | 'lg' | 'icon';

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Callback when export completes
   */
  onExportComplete?: (format: ExportFormat) => void;
}

const formatConfig: Record<
  ExportFormat,
  {
    label: string;
    icon: typeof IconFileTypeCsv;
  }
> = {
  csv: { label: 'Export as CSV', icon: IconFileTypeCsv },
  excel: { label: 'Export as Excel', icon: IconFileTypeXls },
  pdf: { label: 'Export as PDF', icon: IconFileTypePdf },
};

/**
 * Export button with dropdown for format selection
 */
export function ExportButton<T extends Record<string, unknown>>({
  data,
  columns,
  filename,
  formats = ['csv', 'excel', 'pdf'],
  options,
  disabled = false,
  variant = 'outline',
  size = 'default',
  className,
  onExportComplete,
}: ExportButtonProps<T>) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    if (data.length === 0) {
      toast.warning('No data to export');
      return;
    }

    setExporting(format);

    try {
      await exportData(format, data, columns, filename, options);
      toast.success(`Exported to ${format.toUpperCase()} successfully`);
      onExportComplete?.(format);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(
        `Failed to export to ${format.toUpperCase()}`,
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      setExporting(null);
    }
  };

  // Single format - show as button
  if (formats.length === 1) {
    const format = formats[0] as ExportFormat;
    const config = formatConfig[format];
    const Icon = config.icon;

    return (
      <Button
        variant={variant}
        size={size}
        disabled={disabled || !!exporting}
        onClick={() => handleExport(format)}
        className={className}
      >
        {exporting ? (
          <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icon className="mr-2 h-4 w-4" />
        )}
        {exporting ? 'Exporting...' : config.label}
      </Button>
    );
  }

  // Multiple formats - show as dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || !!exporting}
          className={className}
        >
          {exporting ? (
            <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <IconDownload className="mr-2 h-4 w-4" />
          )}
          {exporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {formats.map((format) => {
          const config = formatConfig[format];
          const Icon = config.icon;

          return (
            <DropdownMenuItem
              key={format}
              onClick={() => handleExport(format)}
              disabled={!!exporting}
            >
              <Icon className="mr-2 h-4 w-4" />
              {config.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Quick export button for single format
 */
export function QuickExportCSV<T extends Record<string, unknown>>(
  props: Omit<ExportButtonProps<T>, 'formats'>
) {
  return <ExportButton {...props} formats={['csv']} />;
}

export function QuickExportExcel<T extends Record<string, unknown>>(
  props: Omit<ExportButtonProps<T>, 'formats'>
) {
  return <ExportButton {...props} formats={['excel']} />;
}

export function QuickExportPDF<T extends Record<string, unknown>>(
  props: Omit<ExportButtonProps<T>, 'formats'>
) {
  return <ExportButton {...props} formats={['pdf']} />;
}
