import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import RegisterPage from '@/views/RegisterPage';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k) => k }) }));
vi.mock('@/views/LoginPage.module.css', () => ({ default: {} }));
vi.mock('@/components/AuthBrandPanel.jsx', () => ({ default: () => <div data-testid="brand" /> }));
vi.mock('@/utils/detectCurrency.js', () => ({ detectCurrency: () => 'BRL' }));

let googleProps;
vi.mock('@/components/GoogleSignInButton.jsx', () => ({
  default: (props) => {
    googleProps = props;
    return (
      <div
        data-testid="google-btn"
        data-mode={props.mode}
        data-disabled={String(Boolean(props.disabled))}
      />
    );
  },
}));

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    googleProps = undefined;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should render heading', () => {
    render(<RegisterPage />);
    expect(screen.getByText('auth.register.heading')).toBeInTheDocument();
  });

  it('should render only the currency field — no username, email or password', () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText('auth.register.currency')).toBeInTheDocument();
    expect(document.querySelector('input[name="username"]')).not.toBeInTheDocument();
    expect(document.querySelector('input[type="email"]')).not.toBeInTheDocument();
    expect(document.querySelector('input[type="password"]')).not.toBeInTheDocument();
    expect(document.querySelector('form')).not.toBeInTheDocument();
  });

  it('should render the Google button in register mode', () => {
    render(<RegisterPage />);
    expect(screen.getByTestId('google-btn')).toHaveAttribute('data-mode', 'register');
  });

  it('should render sign in link', () => {
    render(<RegisterPage />);
    expect(screen.getByRole('link', { name: 'auth.register.signIn' })).toBeInTheDocument();
  });

  it('should render the consent checkbox unchecked', () => {
    render(<RegisterPage />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('should lock the Google button and send no consent until the box is ticked', () => {
    render(<RegisterPage />);
    expect(screen.getByTestId('google-btn')).toHaveAttribute('data-disabled', 'true');
    expect(googleProps.consent).toBeUndefined();
  });

  it('should unlock the Google button and send the consent record once the box is ticked', () => {
    render(<RegisterPage />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByTestId('google-btn')).toHaveAttribute('data-disabled', 'false');
    expect(googleProps.consent).toEqual({
      policyVersion: '2026-05-20',
      acceptedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    });
  });

  it('should lock the button again and drop the consent when the box is unticked', () => {
    render(<RegisterPage />);
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByTestId('google-btn')).toHaveAttribute('data-disabled', 'true');
    expect(googleProps.consent).toBeUndefined();
  });

  it('should send the detected currency, and the one the user picks', () => {
    render(<RegisterPage />);
    expect(googleProps.currency).toBe('BRL');
    fireEvent.change(screen.getByLabelText('auth.register.currency'), {
      target: { value: 'USD' },
    });
    expect(googleProps.currency).toBe('USD');
  });

  it('should show the error reported by the Google button', async () => {
    render(<RegisterPage />);
    await act(async () => googleProps.onError('errors.inviteRequired'));
    expect(screen.getByRole('alert')).toHaveTextContent('errors.inviteRequired');
  });

  it('should not render the invite code field when NEXT_PUBLIC_INVITE_ONLY is unset', () => {
    render(<RegisterPage />);
    expect(screen.queryByLabelText('auth.register.inviteLabel')).not.toBeInTheDocument();
  });

  describe('when NEXT_PUBLIC_INVITE_ONLY is true', () => {
    beforeEach(() => vi.stubEnv('NEXT_PUBLIC_INVITE_ONLY', 'true'));

    it('should render the invite code field', () => {
      render(<RegisterPage />);
      expect(screen.getByLabelText('auth.register.inviteLabel')).toBeInTheDocument();
    });

    it('should keep the Google button locked until an invite code is entered, even with consent', () => {
      render(<RegisterPage />);
      fireEvent.click(screen.getByRole('checkbox'));
      expect(screen.getByTestId('google-btn')).toHaveAttribute('data-disabled', 'true');

      fireEvent.change(screen.getByLabelText('auth.register.inviteLabel'), {
        target: { value: 'SECRET123' },
      });
      expect(screen.getByTestId('google-btn')).toHaveAttribute('data-disabled', 'false');
    });

    it('should pass the invite code to the Google button', () => {
      render(<RegisterPage />);
      fireEvent.change(screen.getByLabelText('auth.register.inviteLabel'), {
        target: { value: 'SECRET123' },
      });
      expect(googleProps.inviteCode).toBe('SECRET123');
    });

    it('should treat a whitespace-only invite code as empty', () => {
      render(<RegisterPage />);
      fireEvent.click(screen.getByRole('checkbox'));
      fireEvent.change(screen.getByLabelText('auth.register.inviteLabel'), {
        target: { value: '   ' },
      });
      expect(screen.getByTestId('google-btn')).toHaveAttribute('data-disabled', 'true');
    });
  });
});
