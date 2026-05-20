import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));

describe('DeleteConfirmDialog', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should render nothing when open=false', () => {
    const { container } = render(
      <DeleteConfirmDialog open={false} message="Sure?" onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render message when open=true', () => {
    render(<DeleteConfirmDialog open message="Delete this?" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('Delete this?')).toBeInTheDocument();
  });

  it('should call onCancel when cancel button clicked', () => {
    const onCancel = vi.fn();
    render(<DeleteConfirmDialog open message="Sure?" onConfirm={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('common.cancel'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('should call onConfirm when delete button clicked (no requireDouble)', () => {
    const onConfirm = vi.fn();
    render(<DeleteConfirmDialog open message="Sure?" onConfirm={onConfirm} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByText('common.delete'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('should require two clicks when requireDouble=true', () => {
    const onConfirm = vi.fn();
    render(
      <DeleteConfirmDialog
        open
        requireDouble
        messages={['Are you sure?', 'Really sure?']}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Continue'));
    expect(screen.getByText('Really sure?')).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('common.delete'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('should reset stage to 0 when dialog closes and reopens', () => {
    const onConfirm = vi.fn();
    const { rerender } = render(
      <DeleteConfirmDialog
        open
        requireDouble
        messages={['Step 1', 'Step 2']}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Continue'));
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    rerender(
      <DeleteConfirmDialog
        open={false}
        requireDouble
        messages={['Step 1', 'Step 2']}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );
    rerender(
      <DeleteConfirmDialog
        open
        requireDouble
        messages={['Step 1', 'Step 2']}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText('Step 1')).toBeInTheDocument();
  });
});
