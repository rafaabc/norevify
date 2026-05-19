import { render, screen } from '@testing-library/react';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'reminders.status.upcoming': 'Upcoming',
        'reminders.status.dueSoon': 'Due Soon',
        'reminders.status.overdue': 'Overdue',
        'reminders.status.done': 'Done',
      };
      return translations[key] ?? key;
    },
  }),
}));

import ReminderStatusBadge from '../../src/components/ReminderStatusBadge.jsx';

describe('ReminderStatusBadge', () => {
  test.each(['upcoming', 'dueSoon', 'overdue', 'done'])(
    'renders badge with data-status="%s"',
    (status) => {
      render(<ReminderStatusBadge status={status} />);
      const badge = screen.getByTestId('reminder-status-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute('data-status', status);
    }
  );
});
