import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import NavLink from '@/components/NavLink.jsx';

const mockUsePathname = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => mockUsePathname(),
  useSearchParams: () => new URLSearchParams(),
}));

const activeClass = ({ isActive }) => (isActive ? 'active' : 'inactive');

const renderExpensesLink = (pathname, props = {}) => {
  mockUsePathname.mockReturnValue(pathname);
  render(
    <NavLink href="/expenses" className={activeClass} {...props}>
      Expenses
    </NavLink>,
  );
  return screen.getByRole('link');
};

describe('NavLink', () => {
  it('should render a link with the given href', () => {
    mockUsePathname.mockReturnValue('/');
    render(<NavLink href="/dashboard">Dashboard</NavLink>);
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard');
  });

  it('should apply active class when pathname matches href', () => {
    expect(renderExpensesLink('/expenses')).toHaveClass('active');
  });

  it('should apply inactive class when pathname does not match href', () => {
    expect(renderExpensesLink('/')).toHaveClass('inactive');
  });

  it('should match sub-paths when end is false', () => {
    expect(renderExpensesLink('/expenses/123')).toHaveClass('active');
  });

  it('should not match sub-paths when end is true', () => {
    expect(renderExpensesLink('/expenses/123', { end: true })).toHaveClass('inactive');
  });
});
