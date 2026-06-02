import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NumericInput from '@/components/NumericInput';

const mockLang = vi.fn().mockReturnValue('en');
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      get language() {
        return mockLang();
      },
    },
  }),
}));

describe('NumericInput — EN', () => {
  it('should render type=number', () => {
    render(<NumericInput id="x" name="x" value="5.5" onChange={vi.fn()} />);
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });

  it('should call onChange with original event', () => {
    const onChange = vi.fn();
    render(<NumericInput id="x" name="x" value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '5.5' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('should render placeholder unchanged', () => {
    render(<NumericInput id="x" name="x" value="" onChange={vi.fn()} placeholder="e.g. 5.50" />);
    expect(screen.getByPlaceholderText('e.g. 5.50')).toBeInTheDocument();
  });
});

describe('NumericInput — PT-BR', () => {
  beforeEach(() => mockLang.mockReturnValue('pt-BR'));
  afterEach(() => mockLang.mockReturnValue('en'));

  it('should render type=text with inputMode=decimal', () => {
    render(<NumericInput id="x" name="x" value="" onChange={vi.fn()} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('inputmode', 'decimal');
  });

  it('should display stored period as comma', () => {
    render(<NumericInput id="x" name="x" value="5.50" onChange={vi.fn()} />);
    expect(screen.getByRole('textbox')).toHaveValue('5,50');
  });

  it('should normalize comma to period in onChange', () => {
    const onChange = vi.fn();
    render(<NumericInput id="x" name="x" value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '5,55' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ name: 'x', value: '5.55' }),
      }),
    );
  });

  it('should reject period input', () => {
    const onChange = vi.fn();
    render(<NumericInput id="x" name="x" value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '5.55' } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should reject non-numeric characters', () => {
    const onChange = vi.fn();
    render(<NumericInput id="x" name="x" value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'abc' } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should reject more than one comma', () => {
    const onChange = vi.fn();
    render(<NumericInput id="x" name="x" value="5,5" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '5,5,' } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should convert placeholder dots to commas', () => {
    render(<NumericInput id="x" name="x" value="" onChange={vi.fn()} placeholder="e.g. 5.50" />);
    expect(screen.getByPlaceholderText('e.g. 5,50')).toBeInTheDocument();
  });
});
