import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MobileNewActionSheet from '@/components/MobileNewActionSheet';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));

const mockPush = vi.fn();
const mockUseRouter = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => mockUseRouter() }));

describe('MobileNewActionSheet', () => {
  let onClose;

  function renderSheet(props = {}) {
    onClose = vi.fn();
    return render(<MobileNewActionSheet open onClose={onClose} {...props} />);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush });
  });

  it('should render nothing when open=false', () => {
    const { container } = renderSheet({ open: false });
    expect(container.firstChild).toBeNull();
  });

  it('should render dialog when open=true', () => {
    renderSheet();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should call onClose when backdrop clicked', () => {
    renderSheet();
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('should navigate to /expenses/new and close', () => {
    renderSheet();
    fireEvent.click(screen.getByText('mobile.newExpense'));
    expect(onClose).toHaveBeenCalledOnce();
    expect(mockPush).toHaveBeenCalledWith('/expenses/new');
  });

  it('should navigate to /recurring/new and close', () => {
    renderSheet();
    fireEvent.click(screen.getByText('mobile.newRecurring'));
    expect(onClose).toHaveBeenCalledOnce();
    expect(mockPush).toHaveBeenCalledWith('/recurring/new');
  });

  it('should navigate to /reminders/new and close', () => {
    renderSheet();
    fireEvent.click(screen.getByText('mobile.newReminder'));
    expect(onClose).toHaveBeenCalledOnce();
    expect(mockPush).toHaveBeenCalledWith('/reminders/new');
  });

  it('should call onClose when cancel button clicked', () => {
    renderSheet();
    fireEvent.click(screen.getByText('common.cancel'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('should call onClose on Escape keydown on backdrop', () => {
    renderSheet();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
