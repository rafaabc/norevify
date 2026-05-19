import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CompleteReminderDialog from '../../src/components/CompleteReminderDialog.jsx';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, opts) => {
      const translations = {
        'reminders.actions.completePreviewBoth': 'Next on {{nextDate}} at {{nextKm}} km',
        'reminders.actions.completePreviewDate': 'Next on {{nextDate}}',
        'reminders.actions.completePreviewKm': 'Next at {{nextKm}} km',
      };
      const template = translations[key] ?? key;
      if (!opts) return template;
      return Object.entries(opts).reduce((s, [k, v]) => s.replace(`{{${k}}}`, v), template);
    },
    i18n: { language: 'en' },
  }),
}));

jest.mock('../../src/utils/formatDate.js', () => ({
  todayISO: () => '2026-05-18',
  formatDate: (d) => (d ? d.slice(0, 10) : ''),
  currentYear: () => 2026,
}));

test('renders nothing when open=false', () => {
  render(<CompleteReminderDialog open={false} reminder={null} onSubmit={() => {}} onCancel={() => {}} />);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('renders input for completedKm', () => {
  render(
    <CompleteReminderDialog
      open
      reminder={{ type: 'oilChange', intervalMonths: null, intervalKm: null }}
      onSubmit={() => {}}
      onCancel={() => {}}
    />
  );
  expect(screen.getByRole('spinbutton')).toBeInTheDocument();
});

test('calls onSubmit with numeric completedKm when form submitted', async () => {
  const onSubmit = jest.fn();
  render(
    <CompleteReminderDialog
      open
      reminder={{ type: 'oilChange', intervalMonths: null, intervalKm: null }}
      onSubmit={onSubmit}
      onCancel={() => {}}
    />
  );
  await userEvent.type(screen.getByRole('spinbutton'), '50100');
  await userEvent.click(screen.getByRole('button', { name: /save|salvar/i }));
  expect(onSubmit).toHaveBeenCalledWith(50100);
});

test('shows preview text when intervalKm is set and km entered', async () => {
  render(
    <CompleteReminderDialog
      open
      reminder={{ type: 'oilChange', intervalMonths: null, intervalKm: 10000 }}
      onSubmit={() => {}}
      onCancel={() => {}}
    />
  );
  await userEvent.type(screen.getByRole('spinbutton'), '50000');
  expect(screen.getByText(/60000/)).toBeInTheDocument();
});
