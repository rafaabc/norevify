import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CategorySelect from '@/components/CategorySelect';
import { CATEGORIES } from '@/utils/categories.js';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));

describe('CategorySelect', () => {
  it('should render all category options', () => {
    render(<CategorySelect value="" onChange={vi.fn()} />);
    CATEGORIES.forEach((cat) => {
      expect(screen.getByRole('option', { name: `categories.${cat}` })).toBeInTheDocument();
    });
  });

  it('should render "select" placeholder by default (no includeAll)', () => {
    render(<CategorySelect value="" onChange={vi.fn()} />);
    expect(screen.getByRole('option', { name: 'categories.select' })).toBeInTheDocument();
  });

  it('should render "all" placeholder when includeAll=true', () => {
    render(<CategorySelect value="" onChange={vi.fn()} includeAll />);
    expect(screen.getByRole('option', { name: 'categories.all' })).toBeInTheDocument();
  });

  it('should call onChange when selection changes', () => {
    const onChange = vi.fn();
    render(<CategorySelect value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Fuel' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('should set selected value', () => {
    render(<CategorySelect value="Fuel" onChange={vi.fn()} />);
    expect(screen.getByRole('combobox')).toHaveValue('Fuel');
  });
});
