/**
 * Helper function for exporting report data
 * Wraps the exportData function for simpler usage with pre-formatted data
 */

import { exportToCSV, exportToExcel, exportToPDF } from './export';

interface ExportColumn<T> {
  key: keyof T | string;
  header: string;
  formatter?: (value: unknown, row: T) => string;
}

export type ReportExportFormat = 'csv' | 'excel' | 'pdf';

/**
 * Export pre-formatted report data
 * @param data Array of objects where keys are column headers
 * @param format Export format (csv, excel, pdf)
 * @param filename Base filename (without extension or timestamp)
 */
export async function exportReportData(
  data: Record<string, unknown>[],
  format: ReportExportFormat,
  filename: string
): Promise<void> {
  if (data.length === 0 || !data[0]) {
    throw new Error('No data to export');
  }

  // Extract column names from first row
  const firstRow = data[0];
  const columns: ExportColumn<Record<string, unknown>>[] = Object.keys(firstRow).map((key) => ({
    key: key,
    header: key,
  }));

  switch (format) {
    case 'csv':
      exportToCSV(data, columns, filename);
      break;
    case 'excel':
      await exportToExcel(data, columns, filename);
      break;
    case 'pdf':
      exportToPDF(data, columns, filename, filename);
      break;
  }
}
