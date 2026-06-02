import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AmountField from '@/components/AmountField';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k) => k, i18n: { language: 'en' } }),
}));

describe('AmountField', () => {
  it('should render label', () => {
    render(<AmountField value="" onChange={vi.fn()} />);
    expect(screen.getByText('expenses.fields.amount')).toBeInTheDocument();
  });

  it('should render number input with correct attrs', () => {
    render(<AmountField value="50.00" onChange={vi.fn()} />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveValue(50);
    expect(input).toHaveAttribute('name', 'amount');
    expect(input).toHaveAttribute('min', '0.01');
    expect(input).toHaveAttribute('step', '0.01');
  });

  it('should call onChange on input change', () => {
    const onChange = vi.fn();
    render(<AmountField value="10" onChange={onChange} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '20' } });
    expect(onChange).toHaveBeenCalled();
  });
});
