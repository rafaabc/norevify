import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RemindersListPage from '../../src/pages/RemindersListPage.jsx';
import { remindersApi } from '../../src/services/apiService.js';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k) => k, i18n: { language: 'en' } }),
}));

jest.mock('../../src/utils/formatDate.js', () => ({
  todayISO: () => '2026-05-18',
  formatDate: (d) => (d ? d.slice(0, 10) : ''),
  currentYear: () => 2026,
}));

jest.mock('../../src/services/apiService.js', () => ({
  remindersApi: {
    list: jest.fn(),
    complete: jest.fn(),
    remove: jest.fn(),
  },
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

function renderPage() {
  return render(
    <MemoryRouter future={{ v7_relativeSplatPath: true }}>
      <RemindersListPage />
    </MemoryRouter>
  );
}

describe('RemindersListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    remindersApi.remove.mockResolvedValue(null);
    remindersApi.complete.mockResolvedValue(null);
  });

  test('should show empty state when API returns no reminders', async () => {
    // Arrange
    remindersApi.list.mockResolvedValue([]);
    // Act
    renderPage();
    // Assert
    expect(await screen.findByText('reminders.noReminders')).toBeInTheDocument();
  });

  test('should show reminder rows when API returns items', async () => {
    // Arrange
    remindersApi.list.mockResolvedValue([
      { id: '1', type: 'Maintenance', status: 'dueSoon', dueKm: 10000, title: '' },
      { id: '2', type: 'Fuel', status: 'active', dueKm: 15000, title: 'Annual' },
    ]);
    // Act
    renderPage();
    // Assert — categoryLabel returns t('categories.Maintenance') = 'categories.Maintenance'
    expect(await screen.findByText('categories.Maintenance')).toBeInTheDocument();
    expect(screen.getByText('categories.Fuel')).toBeInTheDocument();
  });

  test('should open CompleteReminderDialog when Complete is clicked on an active item', async () => {
    // Arrange
    remindersApi.list.mockResolvedValue([
      { id: '1', type: 'Maintenance', status: 'dueSoon', dueKm: 10000, title: '' },
    ]);
    renderPage();
    const completeBtn = await screen.findByRole('button', { name: 'reminders.actions.complete' });
    // Act
    await act(async () => {
      await userEvent.click(completeBtn);
    });
    // Assert — CompleteReminderDialog renders a dialog with role="dialog"
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('should call remindersApi.remove when Delete is clicked', async () => {
    // Arrange
    remindersApi.list.mockResolvedValue([
      { id: 'abc123', type: 'Fuel', status: 'active', dueKm: 5000, title: '' },
    ]);
    const { container } = renderPage();
    const deleteBtn = await screen.findByRole('button', { name: 'common.delete' });
    // Act — open the dialog
    await act(async () => {
      await userEvent.click(deleteBtn);
    });
    // Assert — DeleteConfirmDialog is open; click the confirm btn inside the dialog
    const dialog = await screen.findByRole('dialog');
    const confirmBtn = dialog.querySelector('.btn-danger');
    await act(async () => {
      await userEvent.click(confirmBtn);
    });
    await waitFor(() => {
      expect(remindersApi.remove).toHaveBeenCalledWith('abc123');
    });
  });

  test('should show error banner when API rejects', async () => {
    // Arrange
    remindersApi.list.mockRejectedValue(new Error('Network error'));
    // Act
    renderPage();
    // Assert
    expect(await screen.findByText('Network error')).toBeInTheDocument();
  });

  test('should reload list after Delete is confirmed', async () => {
    // Arrange
    remindersApi.list.mockResolvedValue([
      { id: 'del1', type: 'Insurance', status: 'active', dueKm: null, title: '' },
    ]);
    renderPage();
    const deleteBtn = await screen.findByRole('button', { name: 'common.delete' });
    await act(async () => { await userEvent.click(deleteBtn); });
    // Scope to the dialog to get the confirm button
    const dialog = await screen.findByRole('dialog');
    const confirmBtn = dialog.querySelector('.btn-danger');
    // second call returns empty
    remindersApi.list.mockResolvedValue([]);
    await act(async () => { await userEvent.click(confirmBtn); });
    // Assert — list was re-fetched (at least 2 calls total)
    await waitFor(() => {
      expect(remindersApi.list).toHaveBeenCalledTimes(2);
    });
  });
});
