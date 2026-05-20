import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReminderTypeSelect from '@/components/ReminderTypeSelect';
import { CATEGORIES } from '@/utils/categories.js';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));

describe('ReminderTypeSelect', () => {
  it('should render label', () => {
    render(<ReminderTypeSelect value="Fuel" onChange={vi.fn()} />);
    expect(screen.getByText('reminders.fields.type')).toBeInTheDocument();
  });

  it('should render all category options', () => {
    render(<ReminderTypeSelect value="Fuel" onChange={vi.fn()} />);
    CATEGORIES.forEach((cat) => {
      expect(screen.getByRole('option', { name: `categories.${cat}` })).toBeInTheDocument();
    });
  });

  it('should display selected value', () => {
    render(<ReminderTypeSelect value="Maintenance" onChange={vi.fn()} />);
    expect(screen.getByRole('combobox')).toHaveValue('Maintenance');
  });

  it('should call onChange on selection', () => {
    const onChange = vi.fn();
    render(<ReminderTypeSelect value="Fuel" onChange={onChange} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Insurance' } });
    expect(onChange).toHaveBeenCalled();
  });
});
