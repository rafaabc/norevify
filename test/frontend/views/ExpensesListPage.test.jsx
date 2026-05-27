import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ExpensesListPage from '@/views/ExpensesListPage';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));
vi.mock('@/views/ExpensesListPage.module.css', () => ({ default: {} }));
vi.mock('@/components/Loading.jsx', () => ({ default: () => <div data-testid="loading" /> }));
vi.mock('@/components/ExpenseRow.jsx', () => ({
  default: ({ expense, onDeleted }) => (
    <tr>
      <td>{expense.date}</td>
      <td>{expense.category}</td>
      <td>{expense.amount}</td>
      <td><button onClick={() => onDeleted(expense.id)}>delete-row</button></td>
    </tr>
  ),
}));
vi.mock('@/utils/formatDate.js', () => ({ formatDate: (d) => d, currentYear: () => 2026 }));
vi.mock('@/utils/formatCurrency.js', () => ({ formatCurrency: (v) => String(v) }));

const mockPush = vi.fn();
const mockUseRouter = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => mockUseRouter() }));

vi.mock('@/context/AuthContext.jsx', () => ({
  useAuth: () => ({ currency: 'BRL' }),
}));

const mockList = vi.fn();
const mockRemove = vi.fn();
vi.mock('@/services/apiService.js', () => ({
  expensesApi: { list: () => mockList(), remove: (...args) => mockRemove(...args) },
}));

const expenses = [
  { id: 'e1', date: '2026-05-10', category: 'Fuel', amount: 200, litres: 40, price_per_litre: 5 },
  { id: 'e2', date: '2026-04-01', category: 'Maintenance', amount: 300 },
];

describe('ExpensesListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush });
    mockList.mockResolvedValue(expenses);
    mockRemove.mockResolvedValue(null);
    global.confirm = vi.fn().mockReturnValue(true);
  });

  it('should render expenses heading', async () => {
    await act(async () => { render(<ExpensesListPage />); });
    expect(screen.getByText('expenses.heading')).toBeInTheDocument();
  });

  it('should render loading initially', () => {
    mockList.mockReturnValue(new Promise(() => {}));
    render(<ExpensesListPage />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('should render expenses table after load', async () => {
    await act(async () => { render(<ExpensesListPage />); });
    expect(screen.getByText('Fuel')).toBeInTheDocument();
    expect(screen.getByText('Maintenance')).toBeInTheDocument();
  });

  it('should show empty state when no expenses', async () => {
    mockList.mockResolvedValue([]);
    await act(async () => { render(<ExpensesListPage />); });
    expect(screen.getByText('expenses.noExpenses')).toBeInTheDocument();
  });

  it('should navigate to new expense when + new clicked', async () => {
    await act(async () => { render(<ExpensesListPage />); });
    fireEvent.click(screen.getByText(/common\.new/));
    expect(mockPush).toHaveBeenCalledWith('/expenses/new');
  });

  it('should remove expense from list when onDeleted called', async () => {
    await act(async () => { render(<ExpensesListPage />); });
    await act(async () => { fireEvent.click(screen.getAllByText('delete-row')[0]); });
    expect(screen.queryByText('Fuel')).toBeNull();
  });

  it('should show error when fetch fails', async () => {
    mockList.mockRejectedValue(new Error('server down'));
    await act(async () => { render(<ExpensesListPage />); });
    expect(screen.getByRole('alert')).toHaveTextContent('server down');
  });

  it('should toggle filter panel when filter button clicked', async () => {
    await act(async () => { render(<ExpensesListPage />); });
    const filterBtn = screen.getByRole('button', { name: /expenses\.filters/ });
    fireEvent.click(filterBtn);
    expect(filterBtn).toHaveAttribute('aria-expanded', 'true');
  });

  it('should update filters when category select changes', async () => {
    await act(async () => { render(<ExpensesListPage />); });
    fireEvent.click(screen.getByRole('button', { name: /expenses\.filters/ }));
    const categorySelect = screen.getByLabelText('Filter by category');
    mockList.mockResolvedValue([expenses[0]]);
    await act(async () => { fireEvent.change(categorySelect, { target: { name: 'category', value: 'Fuel' } }); });
    expect(mockList).toHaveBeenCalled();
  });

  it('should show and trigger clearFilters button when filters are active', async () => {
    await act(async () => { render(<ExpensesListPage />); });
    fireEvent.click(screen.getByRole('button', { name: /expenses\.filters/ }));
    const yearSelect = screen.getByLabelText('Filter by year');
    mockList.mockResolvedValue(expenses);
    await act(async () => { fireEvent.change(yearSelect, { target: { name: 'year', value: '2025' } }); });
    expect(screen.getByRole('button', { name: 'expenses.clearFilters' })).toBeInTheDocument();
    mockList.mockResolvedValue(expenses);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'expenses.clearFilters' }));
    });
    expect(screen.queryByRole('button', { name: 'expenses.clearFilters' })).not.toBeInTheDocument();
  });

  it('should delete expense card and remove it from card list on confirm', async () => {
    await act(async () => { render(<ExpensesListPage />); });
    const deleteButtons = screen.getAllByRole('button', { name: 'common.delete' });
    expect(deleteButtons.length).toBeGreaterThan(0);
    await act(async () => { fireEvent.click(deleteButtons[0]); });
    expect(mockRemove).toHaveBeenCalledWith('e1');
  });

  it('should not delete when user cancels confirm dialog', async () => {
    global.confirm = vi.fn().mockReturnValue(false);
    await act(async () => { render(<ExpensesListPage />); });
    const deleteButtons = screen.getAllByRole('button', { name: 'common.delete' });
    await act(async () => { fireEvent.click(deleteButtons[0]); });
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('should show error when card delete fails', async () => {
    mockRemove.mockRejectedValue(new Error('delete failed'));
    await act(async () => { render(<ExpensesListPage />); });
    const deleteButtons = screen.getAllByRole('button', { name: 'common.delete' });
    await act(async () => { fireEvent.click(deleteButtons[0]); });
    expect(screen.getByRole('alert')).toHaveTextContent('delete failed');
  });
});
