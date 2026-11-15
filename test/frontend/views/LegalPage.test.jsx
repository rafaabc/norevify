import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import LegalPage from '@/views/LegalPage.jsx';

vi.mock('react-markdown', () => ({
  default: ({ children }) => <div data-testid="markdown">{children}</div>,
}));
vi.mock('remark-gfm', () => ({ default: () => {} }));
vi.mock('@/views/LegalPage.module.css', () => ({ default: {} }));

const mockI18n = { language: 'en' };
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: mockI18n }),
}));

const content = { en: '# Privacy Policy', 'pt-BR': '# Política de Privacidade' };

beforeEach(() => {
  mockI18n.language = 'en';
});

describe('LegalPage', () => {
  it('renders English content when language is en', () => {
    render(<LegalPage content={content} />);
    expect(screen.getByTestId('markdown')).toHaveTextContent('# Privacy Policy');
  });

  it('renders pt-BR content when language starts with pt', () => {
    mockI18n.language = 'pt-BR';
    render(<LegalPage content={content} />);
    expect(screen.getByTestId('markdown')).toHaveTextContent('# Política de Privacidade');
  });

  it('renders empty content when the language entry is missing', () => {
    render(<LegalPage content={{}} />);
    expect(screen.getByTestId('markdown').textContent).toBe('');
  });

  it('wraps content in a main landmark', () => {
    render(<LegalPage content={content} />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
