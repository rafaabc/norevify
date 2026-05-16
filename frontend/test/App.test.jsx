import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App.jsx';

jest.mock('../src/context/AuthContext.jsx', () => ({
  AuthProvider: ({ children }) => <>{children}</>,
  useAuth: () => ({ token: null, isAuthed: false, username: null }),
}));

jest.mock('../src/routes/ProtectedRoute.jsx', () => ({ children }) => <>{children}</>);
jest.mock('../src/components/AppShell.jsx', () => () => <div data-testid="app-shell" />);
jest.mock('../src/pages/LoginPage.jsx', () => () => <div>Login</div>);
jest.mock('../src/pages/RegisterPage.jsx', () => () => <div>Register</div>);
jest.mock('../src/pages/DashboardPage.jsx', () => () => <div>Dashboard</div>);
jest.mock('../src/pages/ExpensesListPage.jsx', () => () => <div>Expenses</div>);
jest.mock('../src/pages/ExpenseFormPage.jsx', () => () => <div>Form</div>);
jest.mock('../src/pages/SummaryPage.jsx', () => () => <div>Summary</div>);
jest.mock('../src/pages/NotFoundPage.jsx', () => () => <div>404</div>);

function renderApp(path = '/login') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

describe('App — PWA update mechanism', () => {
  test('should not show UpdatePrompt before the pwa:update-available event fires', () => {
    // Arrange + Act
    renderApp();
    // Assert
    expect(screen.queryByText('pwa.updateAvailable')).not.toBeInTheDocument();
  });

  test('should show UpdatePrompt when pwa:update-available event is dispatched', () => {
    // Arrange
    renderApp();
    const mockUpdateSW = jest.fn();
    // Act
    act(() => {
      window.dispatchEvent(
        new CustomEvent('pwa:update-available', { detail: { updateSW: mockUpdateSW } })
      );
    });
    // Assert
    expect(screen.getByText('pwa.updateAvailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'pwa.reload' })).toBeInTheDocument();
  });

  test('should call updateSW(true) when the reload button is clicked', async () => {
    // Arrange
    renderApp();
    const mockUpdateSW = jest.fn();
    act(() => {
      window.dispatchEvent(
        new CustomEvent('pwa:update-available', { detail: { updateSW: mockUpdateSW } })
      );
    });
    // Act
    await userEvent.click(screen.getByRole('button', { name: 'pwa.reload' }));
    // Assert
    expect(mockUpdateSW).toHaveBeenCalledWith(true);
  });

  test('should remove the event listener on unmount', () => {
    // Arrange
    const removeSpy = jest.spyOn(window, 'removeEventListener');
    const { unmount } = renderApp();
    // Act
    unmount();
    // Assert
    expect(removeSpy).toHaveBeenCalledWith('pwa:update-available', expect.any(Function));
    removeSpy.mockRestore();
  });
});
