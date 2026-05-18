import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'nav.dashboard': 'Dashboard',
        'nav.expenses': 'Expenses',
        'nav.reminders': 'Reminders',
        'nav.summary': 'Summary',
        'nav.changePassword': 'Change password',
        'nav.settings': 'Settings',
        'nav.logout': 'Log out',
      };
      return translations[key] ?? key;
    },
  }),
}));

jest.mock('../../src/context/AuthContext.jsx', () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from '../../src/context/AuthContext.jsx';
import Sidebar from '../../src/components/Sidebar.jsx';

const mockLogout = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue({ username: 'testuser', logout: mockLogout });
});

function renderSidebar(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Sidebar />
    </MemoryRouter>
  );
}

describe('Sidebar', () => {
  test('should render all navigation links', () => {
    // Arrange + Act
    renderSidebar();
    // Assert
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /expenses/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /summary/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /change password/i })).toBeInTheDocument();
  });

  test('should display the authenticated username', () => {
    // Arrange + Act
    renderSidebar();
    // Assert
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  test('should show em-dash when username is null', () => {
    // Arrange
    useAuth.mockReturnValue({ username: null, logout: mockLogout });
    // Act
    renderSidebar();
    // Assert
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  test('should call logout when the logout button is clicked', () => {
    // Arrange
    renderSidebar();
    // Act
    fireEvent.click(screen.getByRole('button', { name: /log out/i }));
    // Assert
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  test('should render the brand name', () => {
    // Arrange + Act
    renderSidebar();
    // Assert — brand splits into two text nodes (DRIVE + LEDGER span), match on the aside container
    expect(screen.getByRole('complementary')).toHaveTextContent(/driveledger/i);
  });
});
