import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import DashboardPage from '@/views/DashboardPage';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));
vi.mock('@/i18n/index.js', () => ({ default: { language: 'en', changeLanguage: vi.fn() } }));
vi.mock('@/views/DashboardPage.module.css', () => ({ default: {} }));
vi.mock('@/components/Loading.jsx', () => ({ default: () => <div data-testid="loading" /> }));
vi.mock('@/components/Gauge.jsx', () => ({
  Gauge: ({ label, value }) => (
    <div data-testid="gauge">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  ),
}));
vi.mock('@/components/charts/MonthlyTrendChart.jsx', () => ({
  default: () => <svg data-testid="monthly-chart" />,
}));
vi.mock('@/components/charts/CategoryDonut.jsx', () => ({
  default: () => <svg data-testid="donut-chart" />,
}));
vi.mock('@/utils/formatDate.js', () => ({ formatDate: (d) => d }));
vi.mock('@/utils/formatCurrency.js', () => ({ formatCurrency: (v) => String(v) }));

vi.mock('@/context/AuthContext.jsx', () => ({
  useAuth: () => ({ currency: 'BRL' }),
}));

const mockList = vi.fn();
vi.mock('@/services/apiService.js', () => ({
  expensesApi: { list: () => mockList() },
}));

const expenses = [
  { id: 'e1', date: `${new Date().getFullYear()}-01-15`, category: 'Fuel', amount: 200 },
  { id: 'e2', date: `${new Date().getFullYear()}-02-10`, category: 'Maintenance', amount: 300 },
];

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue(expenses);
  });

  it('should render loading initially', () => {
    mockList.mockReturnValue(new Promise(() => {}));
    render(<DashboardPage />);
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('should render KPI cards after load', async () => {
    await act(async () => {
      render(<DashboardPage />);
    });
    const cards = screen.getAllByTestId('gauge');
    expect(cards.length).toBeGreaterThanOrEqual(4);
  });

  it('should render dashboard heading', async () => {
    await act(async () => {
      render(<DashboardPage />);
    });
    expect(screen.getByText('dashboard.heading')).toBeInTheDocument();
  });

  it('should render recent expenses table when data exists', async () => {
    await act(async () => {
      render(<DashboardPage />);
    });
    expect(screen.getByText('dashboard.recentExpenses')).toBeInTheDocument();
  });

  it('should show error banner when fetch fails', async () => {
    mockList.mockRejectedValue(new Error('api down'));
    await act(async () => {
      render(<DashboardPage />);
    });
    expect(screen.getByRole('alert')).toHaveTextContent('api down');
  });

  it('should render no-expenses message when list is empty', async () => {
    mockList.mockResolvedValue([]);
    await act(async () => {
      render(<DashboardPage />);
    });
    expect(screen.getByText('dashboard.noExpenses')).toBeInTheDocument();
  });
});
