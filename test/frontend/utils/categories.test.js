import { describe, it, expect, vi } from 'vitest';
import { CATEGORIES, categoryLabel } from '@/utils/categories.js';

describe('CATEGORIES', () => {
  it('should contain all valid category strings', () => {
    expect(CATEGORIES).toEqual([
      'Fuel',
      'Maintenance',
      'Insurance',
      'Parking',
      'Toll',
      'Tax',
      'Other',
    ]);
  });
});

describe('categoryLabel', () => {
  it('should return translated label when t function provided', () => {
    const t = vi.fn((key) => `translated:${key}`);
    expect(categoryLabel('Fuel', t)).toBe('translated:categories.Fuel');
    expect(t).toHaveBeenCalledWith('categories.Fuel');
  });

  it('should return category name when no t function provided', () => {
    expect(categoryLabel('Maintenance', null)).toBe('Maintenance');
    expect(categoryLabel('Other', undefined)).toBe('Other');
  });

  it('should call t with correct key for each category', () => {
    const t = (key) => key;
    for (const cat of CATEGORIES) {
      expect(categoryLabel(cat, t)).toBe(`categories.${cat}`);
    }
  });
});
