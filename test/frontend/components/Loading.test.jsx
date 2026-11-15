import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Loading from '@/components/Loading';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));

describe('Loading', () => {
  it('should expose a status region with accessible text', () => {
    render(<Loading />);
    expect(screen.getByRole('status')).toHaveTextContent('common.loading');
  });

  it('should render spinner div inside container', () => {
    const { container } = render(<Loading />);
    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });
});
