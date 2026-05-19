import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import NavLink from '@/components/NavLink.jsx';

const mockUsePathname = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => mockUsePathname(),
  useSearchParams: () => new URLSearchParams(),
}));

describe('NavLink', () => {
  it('should render a link with the given href', () => {
    mockUsePathname.mockReturnValue('/');
    render(<NavLink href="/dashboard">Dashboard</NavLink>);
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard');
  });

  it('should apply active class when pathname matches href', () => {
    mockUsePathname.mockReturnValue('/expenses');
    render(
      <NavLink href="/expenses" className={({ isActive }) => (isActive ? 'active' : 'inactive')}>
        Expenses
      </NavLink>,
    );
    expect(screen.getByRole('link')).toHaveClass('active');
  });

  it('should apply inactive class when pathname does not match href', () => {
    mockUsePathname.mockReturnValue('/');
    render(
      <NavLink href="/expenses" className={({ isActive }) => (isActive ? 'active' : 'inactive')}>
        Expenses
      </NavLink>,
    );
    expect(screen.getByRole('link')).toHaveClass('inactive');
  });

  it('should match sub-paths when end is false', () => {
    mockUsePathname.mockReturnValue('/expenses/123');
    render(
      <NavLink href="/expenses" className={({ isActive }) => (isActive ? 'active' : 'inactive')}>
        Expenses
      </NavLink>,
    );
    expect(screen.getByRole('link')).toHaveClass('active');
  });

  it('should not match sub-paths when end is true', () => {
    mockUsePathname.mockReturnValue('/expenses/123');
    render(
      <NavLink href="/expenses" end className={({ isActive }) => (isActive ? 'active' : 'inactive')}>
        Expenses
      </NavLink>,
    );
    expect(screen.getByRole('link')).toHaveClass('inactive');
  });
});
