import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExpenseRow from '@/components/ExpenseRow';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));
vi.mock('@/components/ExpenseRow.module.css', () => ({ default: {} }));
vi.mock('@/services/apiService.js', () => ({ expensesApi: { remove: vi.fn() } }));
vi.mock('@/utils/formatDate.js', () => ({ formatDate: (d) => d }));
vi.mock('@/utils/formatCurrency.js', () => ({ formatCurrency: (v) => String(v) }));

const mockPush = vi.fn();
const mockUseRouter = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => mockUseRouter() }));

import { expensesApi } from '@/services/apiService.js';

const expense = { id: 'e1', date: '2026-05-10', category: 'Fuel', amount: 150 };

describe('ExpenseRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush });
  });

  it('should render date, category badge and amount', () => {
    render(<table><tbody><tr><ExpenseRow expense={expense} onDeleted={vi.fn()} /></tr></tbody></table>);
    expect(screen.getByText('2026-05-10')).toBeInTheDocument();
    expect(screen.getByText('categories.Fuel')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('should navigate to edit page when edit button clicked', () => {
    render(<table><tbody><tr><ExpenseRow expense={expense} onDeleted={vi.fn()} /></tr></tbody></table>);
    fireEvent.click(screen.getByRole('button', { name: 'common.edit' }));
    expect(mockPush).toHaveBeenCalledWith('/expenses/e1/edit');
  });

  it('should call expensesApi.remove and onDeleted on confirmed delete', async () => {
    window.confirm = vi.fn().mockReturnValue(true);
    expensesApi.remove.mockResolvedValue({});
    const onDeleted = vi.fn();
    render(<table><tbody><tr><ExpenseRow expense={expense} onDeleted={onDeleted} /></tr></tbody></table>);
    await fireEvent.click(screen.getByRole('button', { name: 'common.delete' }));
    await vi.waitFor(() => expect(onDeleted).toHaveBeenCalledWith('e1'));
  });

  it('should not call remove when confirm is cancelled', () => {
    window.confirm = vi.fn().mockReturnValue(false);
    render(<table><tbody><tr><ExpenseRow expense={expense} onDeleted={vi.fn()} /></tr></tbody></table>);
    fireEvent.click(screen.getByRole('button', { name: 'common.delete' }));
    expect(expensesApi.remove).not.toHaveBeenCalled();
  });

  it('should call onError when remove throws', async () => {
    window.confirm = vi.fn().mockReturnValue(true);
    expensesApi.remove.mockRejectedValue(new Error('server error'));
    const onError = vi.fn();
    render(<table><tbody><tr><ExpenseRow expense={expense} onDeleted={vi.fn()} onError={onError} /></tr></tbody></table>);
    fireEvent.click(screen.getByRole('button', { name: 'common.delete' }));
    await vi.waitFor(() => expect(onError).toHaveBeenCalledWith('server error'));
  });
});
