import {
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
  subMonths,
  subQuarters,
  subWeeks,
  subYears,
} from 'date-fns';
import type { DateRange, PeriodPreset, ThemeMode, WeekStart } from './models';

export function formatCurrency(value: number, currency = 'VND') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'VND' ? 0 : 2,
  }).format(value);
}

export function formatCompactCurrency(value: number, currency = 'VND') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercent(value: number) {
  if (!Number.isFinite(value)) {
    return '0%';
  }

  return `${Math.round(value * 100)}%`;
}

export function formatDate(value: string | Date, pattern = 'dd MMM yyyy') {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return format(date, pattern);
}

export function formatDateTime(value: string | Date) {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return format(date, 'dd MMM yyyy, HH:mm');
}

export function toMonthKey(value = new Date()) {
  return format(value, 'yyyy-MM');
}

export function toDateTimeLocalValue(value: string) {
  return format(parseISO(value), "yyyy-MM-dd'T'HH:mm");
}

export function fromDateTimeLocalValue(value: string) {
  return new Date(value).toISOString();
}

export function getDateRange(preset: PeriodPreset, weekStart: WeekStart, now = new Date()): DateRange {
  const weekStartsOn = weekStart === 'monday' ? 1 : 0;

  switch (preset) {
    case 'week':
      return {
        start: startOfWeek(now, { weekStartsOn }),
        end: endOfWeek(now, { weekStartsOn }),
        label: 'This week',
      };
    case 'month':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
        label: 'This month',
      };
    case 'quarter':
      return {
        start: startOfQuarter(now),
        end: endOfQuarter(now),
        label: 'This quarter',
      };
    case 'year':
      return {
        start: startOfYear(now),
        end: endOfYear(now),
        label: 'This year',
      };
    case 'all':
    default:
      return {
        start: null,
        end: null,
        label: 'All time',
      };
  }
}

export function getPreviousDateRange(preset: PeriodPreset, weekStart: WeekStart, now = new Date()): DateRange {
  const weekStartsOn = weekStart === 'monday' ? 1 : 0;

  switch (preset) {
    case 'week': {
      const value = subWeeks(now, 1);
      return {
        start: startOfWeek(value, { weekStartsOn }),
        end: endOfWeek(value, { weekStartsOn }),
        label: 'Last week',
      };
    }
    case 'month': {
      const value = subMonths(now, 1);
      return {
        start: startOfMonth(value),
        end: endOfMonth(value),
        label: 'Last month',
      };
    }
    case 'quarter': {
      const value = subQuarters(now, 1);
      return {
        start: startOfQuarter(value),
        end: endOfQuarter(value),
        label: 'Last quarter',
      };
    }
    case 'year': {
      const value = subYears(now, 1);
      return {
        start: startOfYear(value),
        end: endOfYear(value),
        label: 'Last year',
      };
    }
    case 'all':
    default:
      return {
        start: null,
        end: null,
        label: 'Previous period',
      };
  }
}

export function isInRange(value: string, range: DateRange) {
  if (!range.start || !range.end) {
    return true;
  }

  const date = parseISO(value);
  return isWithinInterval(date, { start: range.start, end: range.end });
}

export function signedChange(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 1;
  }

  return (current - previous) / Math.abs(previous);
}

export function resolveTheme(mode: ThemeMode) {
  if (mode === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  return mode;
}
