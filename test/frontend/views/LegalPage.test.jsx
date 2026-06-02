import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import LegalPage from '@/views/LegalPage.jsx';
import PrivacyPage from '@/views/PrivacyPage.jsx';
import TermsPage from '@/views/TermsPage.jsx';

vi.mock('react-markdown', () => ({
  default: ({ children }) => <div data-testid="markdown">{children}</div>,
}));
vi.mock('remark-gfm', () => ({ default: () => {} }));
vi.mock('@/views/LegalPage.module.css', () => ({ default: {} }));

const mockI18n = { language: 'en' };
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: mockI18n }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockI18n.language = 'en';
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    text: () => Promise.resolve('## Privacy Policy'),
  });
});

describe('LegalPage', () => {
  it('should fetch English URL when language is en', async () => {
    mockI18n.language = 'en';
    await act(async () => {
      render(<LegalPage doc="privacy" />);
    });
    expect(globalThis.fetch).toHaveBeenCalledWith('/legal/en/privacy.md');
  });

  it('should fetch pt-BR URL when language starts with pt', async () => {
    mockI18n.language = 'pt-BR';
    await act(async () => {
      render(<LegalPage doc="terms" />);
    });
    expect(globalThis.fetch).toHaveBeenCalledWith('/legal/pt-BR/terms.md');
  });

  it('should render fetched markdown content', async () => {
    await act(async () => {
      render(<LegalPage doc="privacy" />);
    });
    expect(screen.getByTestId('markdown')).toHaveTextContent('## Privacy Policy');
  });

  it('should set content to empty string when fetch fails', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network error'));
    await act(async () => {
      render(<LegalPage doc="privacy" />);
    });
    expect(screen.getByTestId('markdown').textContent).toBe('');
  });

  it('should set content to empty string when response is not ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false });
    await act(async () => {
      render(<LegalPage doc="privacy" />);
    });
    expect(screen.getByTestId('markdown').textContent).toBe('');
  });

  it('should refetch when doc prop changes', async () => {
    const { rerender } = await act(async () => render(<LegalPage doc="privacy" />));
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('## Terms'),
    });
    await act(async () => {
      rerender(<LegalPage doc="terms" />);
    });
    expect(globalThis.fetch).toHaveBeenCalledWith('/legal/en/terms.md');
  });
});

describe('PrivacyPage', () => {
  it('should pass doc=privacy to LegalPage', async () => {
    await act(async () => {
      render(<PrivacyPage />);
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('privacy.md'));
  });
});

describe('TermsPage', () => {
  it('should pass doc=terms to LegalPage', async () => {
    await act(async () => {
      render(<TermsPage />);
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining('terms.md'));
  });
});
