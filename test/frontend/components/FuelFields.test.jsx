import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FuelFields from '@/components/FuelFields';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));

describe('FuelFields', () => {
  it('should render litres, price_per_litre, and odometer inputs', () => {
    render(<FuelFields litres="" pricePerLitre="" onChange={vi.fn()} />);
    expect(screen.getByLabelText('expenses.fields.litres')).toBeInTheDocument();
    expect(screen.getByLabelText('expenses.fields.pricePerLitre')).toBeInTheDocument();
    expect(screen.getByLabelText('expenses.fields.odometer')).toBeInTheDocument();
  });

  it('should render amount field as disabled with info button that toggles hint', () => {
    render(<FuelFields litres="" pricePerLitre="5" onChange={vi.fn()} />);
    const amount = screen.getByLabelText('expenses.fields.amount');
    expect(amount).toBeDisabled();
    expect(amount).toHaveValue(null);
    const infoBtn = screen.getByRole('button', { name: 'expenses.fields.amountTooltip' });
    expect(infoBtn).toBeInTheDocument();
    expect(screen.queryByText('expenses.fields.amountTooltip')).toBeNull();
    fireEvent.click(infoBtn);
    expect(screen.getByText('expenses.fields.amountTooltip')).toBeInTheDocument();
  });

  it('should show computed amount in disabled input when both litres and price are positive', () => {
    render(<FuelFields litres="40" pricePerLitre="5.50" onChange={vi.fn()} />);
    const amount = screen.getByLabelText('expenses.fields.amount');
    expect(amount).toBeDisabled();
    expect(amount).toHaveValue(220);
  });

  it('should show odometer field with provided value', () => {
    render(<FuelFields litres="40" pricePerLitre="5" odometer="12500" onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('12500')).toBeInTheDocument();
  });

  it('should keep amount empty when litres is 0', () => {
    render(<FuelFields litres="0" pricePerLitre="5.50" onChange={vi.fn()} />);
    const amount = screen.getByLabelText('expenses.fields.amount');
    expect(amount).toHaveValue(null);
  });
});
