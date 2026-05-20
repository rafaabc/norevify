import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import FuelFields from '@/components/FuelFields';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));

describe('FuelFields', () => {
  it('should render litres, price_per_litre, and odometer inputs', () => {
    render(<FuelFields litres="" pricePerLitre="" onChange={vi.fn()} />);
    expect(screen.getByLabelText('expenses.fields.litres')).toBeInTheDocument();
    expect(screen.getByLabelText('expenses.fields.pricePerLitre')).toBeInTheDocument();
    expect(screen.getByLabelText('expenses.fields.odometer')).toBeInTheDocument();
  });

  it('should not show computed amount when litres or price is empty', () => {
    render(<FuelFields litres="" pricePerLitre="5" onChange={vi.fn()} />);
    expect(screen.queryByText(/expenses.fields.amount/)).toBeNull();
  });

  it('should show computed amount when both litres and price are positive', () => {
    render(<FuelFields litres="40" pricePerLitre="5.50" onChange={vi.fn()} />);
    expect(screen.getByText('220.00')).toBeInTheDocument();
  });

  it('should show odometer field with provided value', () => {
    render(<FuelFields litres="40" pricePerLitre="5" odometer="12500" onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('12500')).toBeInTheDocument();
  });

  it('should not show computed amount when litres is 0', () => {
    render(<FuelFields litres="0" pricePerLitre="5.50" onChange={vi.fn()} />);
    expect(screen.queryByText('0.00')).toBeNull();
  });
});
