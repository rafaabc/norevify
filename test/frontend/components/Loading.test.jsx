import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Loading from '@/components/Loading';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));

describe('Loading', () => {
  it('should render spinner container with aria-label', () => {
    render(<Loading />);
    expect(screen.getByLabelText('common.loading')).toBeInTheDocument();
  });

  it('should render spinner div inside container', () => {
    const { container } = render(<Loading />);
    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });
});
