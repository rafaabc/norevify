import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import KpiCard from '@/components/KpiCard';

vi.mock('@/components/charts/Sparkline.jsx', () => ({ default: () => <svg data-testid="sparkline" /> }));
vi.mock('@/components/KpiCard.module.css', () => ({
  default: { card: 'card', header: 'header', label: 'label', subtitle: 'subtitle', value: 'value', deltaPos: 'deltaPos', deltaNeg: 'deltaNeg', spark: 'spark' },
}));

describe('KpiCard', () => {
  it('should render label and value', () => {
    render(<KpiCard label="Total" value="R$ 500" />);
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('R$ 500')).toBeInTheDocument();
  });

  it('should render subtitle when provided', () => {
    render(<KpiCard label="KPI" value="0" subtitle="2026" />);
    expect(screen.getByText('2026')).toBeInTheDocument();
  });

  it('should not render subtitle when not provided', () => {
    const { container } = render(<KpiCard label="KPI" value="0" />);
    expect(container.querySelector('.subtitle')).toBeNull();
  });

  it('should render positive delta with up arrow', () => {
    render(<KpiCard label="KPI" value="0" delta={12.5} />);
    expect(screen.getByText(/▲/)).toBeInTheDocument();
  });

  it('should render negative delta with down arrow', () => {
    render(<KpiCard label="KPI" value="0" delta={-8} />);
    expect(screen.getByText(/▼/)).toBeInTheDocument();
  });

  it('should not render delta when delta is 0', () => {
    const { container } = render(<KpiCard label="KPI" value="0" delta={0} />);
    expect(container.querySelector('.deltaPos')).toBeNull();
    expect(container.querySelector('.deltaNeg')).toBeNull();
  });

  it('should render sparkline when sparkData provided', () => {
    render(<KpiCard label="KPI" value="0" sparkData={[1, 2, 3]} />);
    expect(screen.getByTestId('sparkline')).toBeInTheDocument();
  });

  it('should not render sparkline when sparkData is empty', () => {
    render(<KpiCard label="KPI" value="0" sparkData={[]} />);
    expect(screen.queryByTestId('sparkline')).toBeNull();
  });

  it('should apply deltaNeg class when invertColors=true and delta > 0', () => {
    const { container } = render(<KpiCard label="KPI" value="0" delta={5} invertColors />);
    expect(container.querySelector('.deltaNeg')).toBeInTheDocument();
  });
});
