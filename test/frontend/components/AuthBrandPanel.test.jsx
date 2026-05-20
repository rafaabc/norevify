import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuthBrandPanel from '@/components/AuthBrandPanel';

vi.mock('@/views/LoginPage.module.css', () => ({ default: {} }));

describe('AuthBrandPanel', () => {
  it('should render wordmark text', () => {
    render(<AuthBrandPanel />);
    expect(screen.getByText('DRIVELEDGER')).toBeInTheDocument();
  });

  it('should render tagline', () => {
    render(<AuthBrandPanel />);
    expect(screen.getByText('Track every kilometer.')).toBeInTheDocument();
  });
});
