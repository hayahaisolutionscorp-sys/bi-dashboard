import * as XLSX from 'xlsx';
import { SalesReportRoute } from '@/types/sales';
import { DateRange } from 'react-day-picker';

// ── Generic Types ─────────────────────────────────────────────────

export interface ExcelSheetData {
  name: string;
  data: any[];
  colWidths?: number[];
}

// ── Generic Export ────────────────────────────────────────────────

export const exportToExcel = (sheets: ExcelSheetData[], filename: string) => {
  try {
    const wb = XLSX.utils.book_new();

    sheets.forEach(sheet => {
      const ws = XLSX.utils.json_to_sheet(sheet.data);

      // Apply per-sheet column widths, or fall back to defaults
      const widths = sheet.colWidths ?? [20, 30, 20];
      ws['!cols'] = widths.map(w => ({ width: w }));

      XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    });

    XLSX.writeFile(wb, `${filename}.xlsx`);
  } catch (error) {
    console.error('Excel Export failed:', error);
    throw new Error('Failed to generate Excel file.');
  }
};

export const downloadTemplate = (sheets: ExcelSheetData[], filename: string) => {
  exportToExcel(sheets, filename);
};

export const parseExcelFile = async (file: File, requiredSheets: string[]) => {
  try {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array' });

    const result: Record<string, any[]> = {};

    for (const required of requiredSheets) {
      const sheetName = wb.SheetNames.find(n => n.toLowerCase() === required.toLowerCase());
      if (!sheetName) {
        throw new Error(`Missing required sheet: ${required}`);
      }
      result[required] = XLSX.utils.sheet_to_json<any>(wb.Sheets[sheetName]);
    }

    return result;
  } catch (error) {
    console.error('Excel Parse failed:', error);
    throw error;
  }
};

// ── Sales Report Export ───────────────────────────────────────────

const formatPeso = (val: number | null | undefined) =>
  `₱${(val ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Builds a styled header row as the first row of a sheet.
 * Uses XLSX's aoa_to_sheet so we can control row 0 explicitly.
 */
function buildSheetFromRows<T extends Record<string, any>>(
  headers: { key: keyof T; label: string }[],
  rows: T[],
): XLSX.WorkSheet {
  // Header row
  const headerRow = headers.map(h => h.label);

  // Data rows
  const dataRows = rows.map(row => headers.map(h => row[h.key] ?? ''));

  const aoa = [headerRow, ...dataRows];
  return XLSX.utils.aoa_to_sheet(aoa);
}

/**
 * Generates and triggers a browser download of the Sales Report
 * as a multi-sheet .xlsx workbook.
 *
 * Sheets produced:
 *   1. Summary        — KPI metrics
 *   2. Daily Trend    — per-day revenue & booking data
 *   3. Sales by Source— revenue breakdown by booking channel
 *   4. Revenue Mix    — type-level and sub-category breakdown
 */
export const exportSalesReportToExcel = (
  route: SalesReportRoute,
  dateRange?: DateRange,
): void => {
  const wb = XLSX.utils.book_new();

  // ── 1. Summary Sheet ────────────────────────────────────────────
  const summaryRows = [
    { Section: 'KPIs', Metric: 'Total Gross Revenue', Value: formatPeso(route.kpis.total_gross_revenue) },
    { Section: 'KPIs', Metric: 'Total Net Revenue',   Value: formatPeso(route.kpis.total_net_revenue) },
    { Section: 'KPIs', Metric: 'Total Bookings',      Value: (route.kpis.total_bookings ?? 0).toLocaleString() },
    { Section: 'KPIs', Metric: 'Refund Deductions',   Value: formatPeso(route.kpis.total_refund_deductions) },
    { Section: 'KPIs', Metric: 'Disbursements',       Value: formatPeso(route.kpis.total_disbursements) },
  ];
  const summarySheet = buildSheetFromRows(
    [
      { key: 'Section', label: 'Section' },
      { key: 'Metric',  label: 'Metric' },
      { key: 'Value',   label: 'Value' },
    ],
    summaryRows,
  );
  summarySheet['!cols'] = [{ width: 18 }, { width: 28 }, { width: 22 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  // ── 2. Daily Trend Sheet ────────────────────────────────────────
  const trendSheet = buildSheetFromRows(
    [
      { key: 'transaction_date', label: 'Date' },
      { key: 'gross_revenue',    label: 'Gross Revenue (₱)' },
      { key: 'net_revenue',      label: 'Net Revenue (₱)' },
      { key: 'bookings',         label: 'Total Bookings' },
    ],
    route.charts.trend,
  );
  trendSheet['!cols'] = [{ width: 14 }, { width: 20 }, { width: 20 }, { width: 16 }];
  XLSX.utils.book_append_sheet(wb, trendSheet, 'Daily Trend');

  // ── 3. Sales by Source Sheet ────────────────────────────────────
  const sourceSheet = buildSheetFromRows(
    [
      { key: 'source',        label: 'Source' },
      { key: 'gross_revenue', label: 'Gross Revenue (₱)' },
      { key: 'net_revenue',   label: 'Net Revenue (₱)' },
      { key: 'bookings',      label: 'Bookings' },
    ],
    route.charts.booking_source,
  );
  sourceSheet['!cols'] = [{ width: 22 }, { width: 20 }, { width: 20 }, { width: 14 }];
  XLSX.utils.book_append_sheet(wb, sourceSheet, 'Sales by Source');

  // ── 4. Revenue Mix Sheet ────────────────────────────────────────
  // Type-level rows first, then sub-category rows separated by a blank row
  type RevenueMixXlsxRow = {
    Level: string;
    Type: string;
    Category: string;
    'Gross (₱)': string | number;
    'Net (₱)': string | number;
    '% Share': string;
  };

  const typeLevelRows: RevenueMixXlsxRow[] = route.charts.revenue_mix.type_split.map(t => ({
    Level:      'Type',
    Type:       t.type,
    Category:   '',
    'Gross (₱)': t.gross,
    'Net (₱)':   t.net,
    '% Share':  `${t.percentage.toFixed(1)}%`,
  }));

  const subCategoryRows: RevenueMixXlsxRow[] = route.charts.revenue_mix.sub_categories.map(s => ({
    Level:      'Sub-Category',
    Type:       s.payload_type,
    Category:   s.category,
    'Gross (₱)': s.gross,
    'Net (₱)':   s.net,
    '% Share':  `${s.percentage.toFixed(1)}%`,
  }));

  // Blank separator row
  const blankRow: RevenueMixXlsxRow = { Level: '', Type: '', Category: '', 'Gross (₱)': '', 'Net (₱)': '', '% Share': '' };

  const mixRows: RevenueMixXlsxRow[] = [
    ...typeLevelRows,
    ...(subCategoryRows.length > 0 ? [blankRow] : []),
    ...subCategoryRows,
  ];

  const mixSheet = buildSheetFromRows(
    [
      { key: 'Level',     label: 'Level' },
      { key: 'Type',      label: 'Type' },
      { key: 'Category',  label: 'Category' },
      { key: 'Gross (₱)', label: 'Gross (₱)' },
      { key: 'Net (₱)',   label: 'Net (₱)' },
      { key: '% Share',   label: '% Share' },
    ],
    mixRows,
  );
  mixSheet['!cols'] = [{ width: 16 }, { width: 14 }, { width: 22 }, { width: 18 }, { width: 18 }, { width: 10 }];
  XLSX.utils.book_append_sheet(wb, mixSheet, 'Revenue Mix');

  // ── Filename ────────────────────────────────────────────────────
  const safeName = route.route_name.replace(/[^a-zA-Z0-9-_]/g, '_');
  const fromStr  = dateRange?.from ? dateRange.from.toISOString().split('T')[0] : 'all';
  const toStr    = dateRange?.to   ? dateRange.to.toISOString().split('T')[0]   : '';
  const datePart = toStr && toStr !== fromStr ? `${fromStr}-to-${toStr}` : fromStr;
  const filename = `sales-report-${safeName}-${datePart}.xlsx`;

  XLSX.writeFile(wb, filename);
};
