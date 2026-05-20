import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NotFoundPage from '@/views/NotFoundPage';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));
vi.mock('@/views/NotFoundPage.module.css', () => ({ default: {} }));

const mockPush = vi.fn();
const mockUseRouter = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => mockUseRouter() }));

describe('NotFoundPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({ push: mockPush });
  });

  it('should render 404 code', () => {
    render(<NotFoundPage />);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('should render heading key', () => {
    render(<NotFoundPage />);
    expect(screen.getByText('notFound.heading')).toBeInTheDocument();
  });

  it('should navigate to / when back button clicked', () => {
    render(<NotFoundPage />);
    fireEvent.click(screen.getByText('notFound.back'));
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
