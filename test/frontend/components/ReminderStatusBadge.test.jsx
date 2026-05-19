import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReminderStatusBadge from '@/components/ReminderStatusBadge.jsx';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

describe('ReminderStatusBadge', () => {
  it('should render data-testid="reminder-status-badge" on the element', () => {
    render(<ReminderStatusBadge status="upcoming" />);
    expect(screen.getByTestId('reminder-status-badge')).toBeInTheDocument();
  });

  it('should set data-status to the given status — upcoming', () => {
    render(<ReminderStatusBadge status="upcoming" />);
    expect(screen.getByTestId('reminder-status-badge')).toHaveAttribute('data-status', 'upcoming');
  });

  it('should set data-status to the given status — dueSoon', () => {
    render(<ReminderStatusBadge status="dueSoon" />);
    expect(screen.getByTestId('reminder-status-badge')).toHaveAttribute('data-status', 'dueSoon');
  });

  it('should set data-status to the given status — overdue', () => {
    render(<ReminderStatusBadge status="overdue" />);
    expect(screen.getByTestId('reminder-status-badge')).toHaveAttribute('data-status', 'overdue');
  });

  it('should render translated label via t()', () => {
    render(<ReminderStatusBadge status="upcoming" />);
    expect(screen.getByTestId('reminder-status-badge')).toHaveTextContent('reminders.status.upcoming');
  });
});
