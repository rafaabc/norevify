import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DateField from '@/components/DateField';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'en' } }),
}));
vi.mock('@/utils/formatDate.js', () => ({ todayISO: () => '2026-05-20' }));

describe('DateField', () => {
  it('should render date input', () => {
    render(<DateField value="2026-05-10" onChange={vi.fn()} />);
    expect(screen.getByDisplayValue('2026-05-10')).toBeInTheDocument();
  });

  it('should set lang=en-US when i18n.language is en', () => {
    render(<DateField value="" onChange={vi.fn()} />);
    expect(document.querySelector('input[type="date"]')).toHaveAttribute('lang', 'en-US');
  });

  it('should set max to today', () => {
    render(<DateField value="" onChange={vi.fn()} />);
    const input = document.querySelector('input[type="date"]');
    expect(input).toHaveAttribute('max', '2026-05-20');
  });

  it('should call onChange when value changes', () => {
    const onChange = vi.fn();
    render(<DateField value="2026-05-10" onChange={onChange} />);
    const input = document.querySelector('input[type="date"]');
    fireEvent.change(input, { target: { value: '2026-05-15' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('should use custom name prop', () => {
    render(<DateField value="" onChange={vi.fn()} name="dueDate" />);
    expect(document.querySelector('[name="dueDate"]')).toBeInTheDocument();
  });
});
