import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import RemindersListPage from '@/views/RemindersListPage';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));
vi.mock('@/views/RemindersListPage.module.css', () => ({ default: {} }));
vi.mock('@/components/ReminderStatusBadge.jsx', () => ({
  default: ({ status }) => <span data-testid="status-badge">{status}</span>,
}));
vi.mock('@/components/CompleteReminderDialog.jsx', () => ({
  default: ({ open, onSubmit, onCancel }) =>
    open ? (
      <div role="dialog" data-testid="complete-dialog">
        <button onClick={() => onSubmit(12000)}>confirm-complete</button>
        <button onClick={onCancel}>cancel-complete</button>
      </div>
    ) : null,
}));
vi.mock('@/components/DeleteConfirmDialog.jsx', () => ({
  default: ({ open, onConfirm, onCancel }) =>
    open ? (
      <div role="dialog" data-testid="delete-dialog">
        <button onClick={onConfirm}>confirm-delete</button>
        <button onClick={onCancel}>cancel-delete</button>
      </div>
    ) : null,
}));
vi.mock('@/utils/formatDate.js', () => ({ formatDate: (d) => d }));

const mockPush = vi.fn();
const mockUseRouter = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => mockUseRouter() }));

const mockList = vi.fn();
const mockComplete = vi.fn();
const mockRemove = vi.fn();
vi.mock('@/services/apiService.js', () => ({
  remindersApi: {
    list: () => mockList(),
    complete: (...a) => mockComplete(...a),
    remove: (...a) => mockRemove(...a),
  },
}));

const activeReminders = [
  { id: 'r1', type: 'Fuel', title: 'Tank up', dueDate: '2026-06-01', dueKm: null, status: 'upcoming' },
  { id: 'r2', type: 'Maintenance', title: '', dueDate: null, dueKm: 15000, status: 'dueSoon' },
];

describe('RemindersListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush });
    mockList.mockResolvedValue(activeReminders);
    mockComplete.mockResolvedValue({});
    mockRemove.mockResolvedValue({});
  });

  it('should render reminders heading and new link', async () => {
    await act(async () => { render(<RemindersListPage />); });
    expect(screen.getByText('reminders.heading')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /common\.new/i })).toHaveAttribute('href', '/reminders/new');
  });

  it('should render active reminders list after load', async () => {
    await act(async () => { render(<RemindersListPage />); });
    expect(screen.getByText('categories.Fuel')).toBeInTheDocument();
    expect(screen.getByText(/Tank up/)).toBeInTheDocument();
  });

  it('should show empty message when no reminders', async () => {
    mockList.mockResolvedValue([]);
    await act(async () => { render(<RemindersListPage />); });
    expect(screen.getByText('reminders.noReminders')).toBeInTheDocument();
  });

  it('should switch to history tab and reload', async () => {
    await act(async () => { render(<RemindersListPage />); });
    expect(mockList).toHaveBeenCalledTimes(1);
    await act(async () => { fireEvent.click(screen.getByText('reminders.tabs.history')); });
    expect(mockList).toHaveBeenCalledTimes(2);
  });

  it('should open complete dialog when complete button clicked', async () => {
    await act(async () => { render(<RemindersListPage />); });
    fireEvent.click(screen.getAllByText('reminders.actions.complete')[0]);
    expect(screen.getByTestId('complete-dialog')).toBeInTheDocument();
  });

  it('should call remindersApi.complete and reload on confirm complete', async () => {
    await act(async () => { render(<RemindersListPage />); });
    fireEvent.click(screen.getAllByText('reminders.actions.complete')[0]);
    await act(async () => { fireEvent.click(screen.getByText('confirm-complete')); });
    expect(mockComplete).toHaveBeenCalledOnce();
    expect(mockList).toHaveBeenCalledTimes(2);
  });

  it('should open delete dialog when delete button clicked', async () => {
    await act(async () => { render(<RemindersListPage />); });
    fireEvent.click(screen.getAllByText('common.delete')[0]);
    expect(screen.getByTestId('delete-dialog')).toBeInTheDocument();
  });

  it('should call remindersApi.remove and reload on confirm delete', async () => {
    await act(async () => { render(<RemindersListPage />); });
    fireEvent.click(screen.getAllByText('common.delete')[0]);
    await act(async () => { fireEvent.click(screen.getByText('confirm-delete')); });
    expect(mockRemove).toHaveBeenCalledOnce();
    expect(mockList).toHaveBeenCalledTimes(2);
  });

  it('should show error banner when list fails', async () => {
    mockList.mockRejectedValue(new Error('network error'));
    await act(async () => { render(<RemindersListPage />); });
    expect(screen.getByRole('alert')).toHaveTextContent('network error');
  });

  it('should navigate to edit on edit button click', async () => {
    await act(async () => { render(<RemindersListPage />); });
    fireEvent.click(screen.getAllByText('common.edit')[0]);
    expect(mockPush).toHaveBeenCalledWith('/reminders/r1/edit');
  });
});
