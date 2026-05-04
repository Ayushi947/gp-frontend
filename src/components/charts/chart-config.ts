/**
 * Chart configuration and theming
 * Consistent styling for all charts in the application
 */

/**
 * Chart color palette
 */
export const chartColors = {
  primary: 'hsl(221.2 83.2% 53.3%)',
  secondary: 'hsl(142.1 76.2% 36.3%)',
  tertiary: 'hsl(38 92% 50%)',
  quaternary: 'hsl(280 65% 60%)',
  quinary: 'hsl(199 89% 48%)',
} as const;

/**
 * Chart colors array for sequential data
 */
export const chartColorArray = [
  chartColors.primary,
  chartColors.secondary,
  chartColors.tertiary,
  chartColors.quaternary,
  chartColors.quinary,
];

/**
 * CSS variable-based colors for theming
 */
export const chartCssColors = {
  chart1: 'hsl(var(--chart-1))',
  chart2: 'hsl(var(--chart-2))',
  chart3: 'hsl(var(--chart-3))',
  chart4: 'hsl(var(--chart-4))',
  chart5: 'hsl(var(--chart-5))',
} as const;

/**
 * Axis configuration
 */
export const axisConfig = {
  stroke: 'hsl(var(--muted-foreground))',
  fontSize: 12,
  tickLine: false,
  axisLine: false,
  tickMargin: 8,
};

/**
 * Grid configuration
 */
export const gridConfig = {
  stroke: 'hsl(var(--border))',
  strokeDasharray: '3 3',
  vertical: false,
};

/**
 * Tooltip configuration
 */
export const tooltipConfig = {
  contentStyle: {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    padding: '12px',
  },
  labelStyle: {
    fontWeight: 600,
    marginBottom: '4px',
  },
  itemStyle: {
    padding: '2px 0',
  },
  cursor: {
    stroke: 'hsl(var(--muted-foreground))',
    strokeDasharray: '3 3',
  },
};

/**
 * Legend configuration
 */
export const legendConfig = {
  verticalAlign: 'top' as const,
  align: 'right' as const,
  iconType: 'circle' as const,
  iconSize: 8,
  wrapperStyle: {
    paddingBottom: '20px',
  },
};

/**
 * Animation configuration
 */
export const animationConfig = {
  duration: 300,
  easing: 'ease-out',
};

/**
 * Common chart margins
 */
export const chartMargins = {
  default: { top: 20, right: 20, bottom: 20, left: 20 },
  withLegend: { top: 40, right: 20, bottom: 20, left: 20 },
  withXAxis: { top: 20, right: 20, bottom: 40, left: 20 },
  withYAxis: { top: 20, right: 20, bottom: 20, left: 60 },
  full: { top: 40, right: 20, bottom: 40, left: 60 },
};

/**
 * Format helpers for chart values
 */
export const chartFormatters = {
  /**
   * Format currency values
   */
  currency: (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value),

  /**
   * Format percentage values
   */
  percent: (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(value / 100),

  /**
   * Format compact numbers (K, M, B)
   */
  compact: (value: number) =>
    new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value),

  /**
   * Format with thousands separator
   */
  number: (value: number) =>
    new Intl.NumberFormat('en-US').format(value),

  /**
   * Format date (short month)
   */
  dateShort: (value: string) => {
    const date = new Date(value);
    return date.toLocaleDateString('en-US', { month: 'short' });
  },

  /**
   * Format date (month year)
   */
  dateMonthYear: (value: string) => {
    const date = new Date(value);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  },
};

/**
 * Get color by index (loops through available colors)
 */
export function getChartColor(index: number): string {
  return chartColorArray[index % chartColorArray.length] ?? chartColors.primary;
}

/**
 * Generate gradient ID
 */
export function generateGradientId(prefix: string): string {
  return `${prefix}-gradient-${Math.random().toString(36).substring(7)}`;
}
