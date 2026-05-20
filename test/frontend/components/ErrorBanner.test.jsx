import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBanner from '@/components/ErrorBanner';

describe('ErrorBanner', () => {
  it('should render nothing when message is falsy', () => {
    const { container } = render(<ErrorBanner message="" />);
    expect(container.firstChild).toBeNull();
  });

  it('should render message with default error class', () => {
    render(<ErrorBanner message="Something went wrong" />);
    const el = screen.getByRole('alert');
    expect(el).toHaveTextContent('Something went wrong');
    expect(el).toHaveClass('alert-error');
  });

  it('should render with custom type class', () => {
    render(<ErrorBanner message="Nice" type="success" />);
    expect(screen.getByRole('alert')).toHaveClass('alert-success');
  });
});
