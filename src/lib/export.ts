import { format } from 'date-fns';

/**
 * Column definition for export
 */
interface ExportColumn<T> {
  key: keyof T | string;
  header: string;
  formatter?: (value: unknown, row: T) => string;
}

/**
 * Download a file in the browser
 */
function downloadFile(
  content: string | Blob,
  filename: string,
  mimeType: string
): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

/**
 * Escape CSV value
 */
function escapeCSVValue(value: unknown): string {
  const strValue = String(value ?? '');
  // Escape quotes by doubling them
  const escaped = strValue.replace(/"/g, '""');
  // Wrap in quotes if contains comma, newline, or quotes
  if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
    return `"${escaped}"`;
  }
  return escaped;
}

/**
 * Export data to CSV format
 *
 * @param data - Array of data objects
 * @param columns - Column definitions
 * @param filename - Output filename (without extension)
 *
 * @example
 * ```typescript
 * exportToCSV(
 *   participants,
 *   [
 *     { key: 'name', header: 'Name' },
 *     { key: 'email', header: 'Email' },
 *     { key: 'balance', header: 'Balance', formatter: formatCurrency },
 *   ],
 *   'participants-export'
 * );
 * ```
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  // Generate header row
  const headers = columns.map((col) => escapeCSVValue(col.header)).join(',');

  // Generate data rows
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = getNestedValue(row, String(col.key));
        const formattedValue = col.formatter ? col.formatter(value, row) : value;
        return escapeCSVValue(formattedValue);
      })
      .join(',')
  );

  // Combine headers and rows
  const csv = [headers, ...rows].join('\n');

  // Add BOM for Excel compatibility with UTF-8
  const bom = '\uFEFF';
  const csvWithBom = bom + csv;

  // Download the file
  const timestamp = format(new Date(), 'yyyy-MM-dd');
  downloadFile(csvWithBom, `${filename}-${timestamp}.csv`, 'text/csv;charset=utf-8');
}

/**
 * Export data to Excel format (using xlsx library)
 *
 * @param data - Array of data objects
 * @param columns - Column definitions
 * @param filename - Output filename (without extension)
 * @param sheetName - Excel sheet name
 *
 * @example
 * ```typescript
 * await exportToExcel(
 *   participants,
 *   [
 *     { key: 'name', header: 'Name' },
 *     { key: 'email', header: 'Email' },
 *     { key: 'balance', header: 'Balance', formatter: formatCurrency },
 *   ],
 *   'participants-export',
 *   'Participants'
 * );
 * ```
 */
export async function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string,
  sheetName: string = 'Sheet1'
): Promise<void> {
  // Dynamically import xlsx to reduce bundle size
  const XLSX = await import('xlsx');

  // Transform data with formatted values
  const formattedData = data.map((row) => {
    const formattedRow: Record<string, unknown> = {};
    columns.forEach((col) => {
      const value = getNestedValue(row, String(col.key));
      formattedRow[col.header] = col.formatter ? col.formatter(value, row) : value;
    });
    return formattedRow;
  });

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(formattedData);

  // Set column widths based on content
  const columnWidths = columns.map((col) => {
    const maxLength = Math.max(
      col.header.length,
      ...data.map((row) => {
        const value = getNestedValue(row, String(col.key));
        const formatted = col.formatter ? col.formatter(value, row) : value;
        return String(formatted ?? '').length;
      })
    );
    return { wch: Math.min(maxLength + 2, 50) };
  });
  worksheet['!cols'] = columnWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate and download file
  const timestamp = format(new Date(), 'yyyy-MM-dd');
  XLSX.writeFile(workbook, `${filename}-${timestamp}.xlsx`);
}

/**
 * Export data to PDF format
 * Uses a print-friendly HTML table approach
 *
 * @param data - Array of data objects
 * @param columns - Column definitions
 * @param filename - Output filename (without extension)
 * @param title - PDF document title
 *
 * @example
 * ```typescript
 * exportToPDF(
 *   participants,
 *   [
 *     { key: 'name', header: 'Name' },
 *     { key: 'email', header: 'Email' },
 *   ],
 *   'participants-export',
 *   'Participant Report'
 * );
 * ```
 */
export function exportToPDF<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string,
  title: string = 'Report'
): void {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Unable to open print window. Please check your popup blocker settings.');
  }

  const timestamp = format(new Date(), 'MMMM d, yyyy h:mm a');

  // Generate table HTML
  const tableHeaders = columns.map((col) => `<th>${col.header}</th>`).join('');
  const tableRows = data
    .map(
      (row) =>
        `<tr>${columns
          .map((col) => {
            const value = getNestedValue(row, String(col.key));
            const formatted = col.formatter ? col.formatter(value, row) : value;
            return `<td>${formatted ?? ''}</td>`;
          })
          .join('')}</tr>`
    )
    .join('');

  // Write the document
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #1a1a1a;
            padding: 20px;
          }
          .header {
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e5e5;
          }
          .header h1 {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 4px;
          }
          .header .timestamp {
            font-size: 11px;
            color: #666;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th, td {
            padding: 8px 12px;
            text-align: left;
            border: 1px solid #e5e5e5;
          }
          th {
            background-color: #f5f5f5;
            font-weight: 600;
            white-space: nowrap;
          }
          tr:nth-child(even) {
            background-color: #fafafa;
          }
          .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #e5e5e5;
            font-size: 10px;
            color: #666;
            text-align: center;
          }
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <div class="timestamp">Generated on ${timestamp}</div>
        </div>
        <table>
          <thead>
            <tr>${tableHeaders}</tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
        <div class="footer">
          GlidingPath - 401(k) Plan Administration
        </div>
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}

/**
 * Export button action types
 */
export type ExportFormat = 'csv' | 'excel' | 'pdf';

/**
 * Generic export function that handles all formats
 */
export async function exportData<T extends Record<string, unknown>>(
  format: ExportFormat,
  data: T[],
  columns: ExportColumn<T>[],
  filename: string,
  options?: {
    sheetName?: string;
    pdfTitle?: string;
  }
): Promise<void> {
  switch (format) {
    case 'csv':
      exportToCSV(data, columns, filename);
      break;
    case 'excel':
      await exportToExcel(data, columns, filename, options?.sheetName);
      break;
    case 'pdf':
      exportToPDF(data, columns, filename, options?.pdfTitle);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}
