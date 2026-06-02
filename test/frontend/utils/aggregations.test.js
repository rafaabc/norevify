import { describe, it, expect, vi } from 'vitest';

vi.mock('@/i18n/index.js', () => ({
  default: { language: 'en' },
}));

import {
  aggregateByMonth,
  aggregateByCategory,
  computeMtd,
  computeYtd,
  computeFuelShare,
  computeAvgMonthly,
  computePrevMonthTotal,
  monthLabel,
} from '@/utils/aggregations.js';

const expenses = [
  { date: '2025-01-10', category: 'Fuel', amount: 100 },
  { date: '2025-01-20', category: 'Maintenance', amount: 50 },
  { date: '2025-02-05', category: 'Fuel', amount: 80 },
  { date: '2025-03-01', category: 'Insurance', amount: 200 },
];

describe('aggregateByMonth', () => {
  it('should group expenses by month sorted chronologically', () => {
    const result = aggregateByMonth(expenses);
    expect(result).toEqual([
      { month: '2025-01', total: 150 },
      { month: '2025-02', total: 80 },
      { month: '2025-03', total: 200 },
    ]);
  });

  it('should return empty array when no expenses', () => {
    expect(aggregateByMonth([])).toEqual([]);
  });
});

describe('aggregateByCategory', () => {
  it('should group expenses by category sorted by total descending', () => {
    const result = aggregateByCategory(expenses);
    expect(result[0]).toEqual({ category: 'Insurance', total: 200 });
    expect(result[1]).toEqual({ category: 'Fuel', total: 180 });
    expect(result[2]).toEqual({ category: 'Maintenance', total: 50 });
  });
});

describe('computeMtd', () => {
  it('should sum expenses in the current calendar month', () => {
    const now = new Date('2025-01-15');
    expect(computeMtd(expenses, now)).toBe(150);
  });

  it('should return 0 when no expenses match current month', () => {
    const now = new Date('2024-06-01');
    expect(computeMtd(expenses, now)).toBe(0);
  });
});

describe('computeYtd', () => {
  it('should sum expenses in the current calendar year', () => {
    const now = new Date('2025-12-31');
    expect(computeYtd(expenses, now)).toBe(430);
  });

  it('should return 0 when no expenses match current year', () => {
    const now = new Date('2024-01-01');
    expect(computeYtd(expenses, now)).toBe(0);
  });
});

describe('computeFuelShare', () => {
  it('should compute fuel percentage of grand total', () => {
    expect(computeFuelShare(expenses)).toBe(Math.round((180 / 430) * 1000) / 10);
  });

  it('should return 0 when no expenses', () => {
    expect(computeFuelShare([])).toBe(0);
  });
});

describe('computeAvgMonthly', () => {
  it('should average monthly totals', () => {
    const data = [
      { month: '2025-01', total: 150 },
      { month: '2025-02', total: 80 },
    ];
    expect(computeAvgMonthly(data)).toBe(115);
  });

  it('should return 0 for empty array', () => {
    expect(computeAvgMonthly([])).toBe(0);
  });
});

describe('computePrevMonthTotal', () => {
  it('should sum expenses from the previous calendar month', () => {
    const now = new Date('2025-02-15');
    expect(computePrevMonthTotal(expenses, now)).toBe(150);
  });

  it('should return 0 when no expenses in previous month', () => {
    const now = new Date('2025-01-15');
    expect(computePrevMonthTotal(expenses, now)).toBe(0);
  });
});

describe('monthLabel', () => {
  it('should format YYYY-MM as short month label in English', () => {
    const label = monthLabel('2025-03');
    expect(label).toMatch(/Mar/i);
    expect(label).toContain('2025');
  });
});
