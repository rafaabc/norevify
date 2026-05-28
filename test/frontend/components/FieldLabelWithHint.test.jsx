import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FieldLabelWithHint from '@/components/FieldLabelWithHint';

describe('FieldLabelWithHint', () => {
  it('should render label text', () => {
    render(<FieldLabelWithHint htmlFor="test-id" label="My label" hint="Hint text" />);
    expect(screen.getByText('My label')).toBeInTheDocument();
  });

  it('should render Info button with aria-label set to hint', () => {
    render(<FieldLabelWithHint htmlFor="test-id" label="My label" hint="Hint text" />);
    expect(screen.getByRole('button', { name: 'Hint text' })).toBeInTheDocument();
  });

  it('should have aria-expanded=false initially', () => {
    render(<FieldLabelWithHint htmlFor="test-id" label="My label" hint="Hint text" />);
    expect(screen.getByRole('button', { name: 'Hint text' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('should not show hint text initially', () => {
    render(<FieldLabelWithHint htmlFor="test-id" label="My label" hint="Hint text" />);
    expect(screen.queryByText('Hint text', { selector: 'small' })).toBeNull();
  });

  it('should show hint text after click', () => {
    render(<FieldLabelWithHint htmlFor="test-id" label="My label" hint="Hint text" />);
    fireEvent.click(screen.getByRole('button', { name: 'Hint text' }));
    expect(screen.getByText('Hint text', { selector: 'small' })).toBeInTheDocument();
  });

  it('should set aria-expanded=true after click', () => {
    render(<FieldLabelWithHint htmlFor="test-id" label="My label" hint="Hint text" />);
    const btn = screen.getByRole('button', { name: 'Hint text' });
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  it('should hide hint again on second click', () => {
    render(<FieldLabelWithHint htmlFor="test-id" label="My label" hint="Hint text" />);
    const btn = screen.getByRole('button', { name: 'Hint text' });
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(screen.queryByText('Hint text', { selector: 'small' })).toBeNull();
    expect(btn).toHaveAttribute('aria-expanded', 'false');
  });

  it('should associate label with htmlFor', () => {
    render(
      <>
        <FieldLabelWithHint htmlFor="my-input" label="Input label" hint="Some hint" />
        <input id="my-input" />
      </>,
    );
    expect(screen.getByLabelText('Input label')).toBeInTheDocument();
  });
});
