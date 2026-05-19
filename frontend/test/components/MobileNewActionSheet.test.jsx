import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MobileNewActionSheet from '../../src/components/MobileNewActionSheet.jsx';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k) => k, i18n: { language: 'en' } }),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

function renderSheet(props) {
  return render(
    <MemoryRouter future={{ v7_relativeSplatPath: true }}>
      <MobileNewActionSheet {...props} />
    </MemoryRouter>
  );
}

describe('MobileNewActionSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render nothing when open is false', () => {
    // Arrange + Act
    const { container } = renderSheet({ open: false, onClose: jest.fn() });
    // Assert
    expect(container.firstChild).toBeNull();
  });

  test('should render two action buttons when open is true', () => {
    // Arrange + Act
    renderSheet({ open: true, onClose: jest.fn() });
    // Assert — new expense and new reminder buttons
    expect(screen.getByRole('button', { name: 'mobile.newExpense' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'mobile.newReminder' })).toBeInTheDocument();
  });

  test('should call navigate to /reminders/new when new reminder button is clicked', () => {
    // Arrange
    const onClose = jest.fn();
    renderSheet({ open: true, onClose });
    // Act
    fireEvent.click(screen.getByRole('button', { name: 'mobile.newReminder' }));
    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/reminders/new');
    expect(onClose).toHaveBeenCalled();
  });

  test('should call navigate to /expenses/new when new expense button is clicked', () => {
    // Arrange
    const onClose = jest.fn();
    renderSheet({ open: true, onClose });
    // Act
    fireEvent.click(screen.getByRole('button', { name: 'mobile.newExpense' }));
    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/expenses/new');
    expect(onClose).toHaveBeenCalled();
  });

  test('should call onClose when backdrop is clicked', () => {
    // Arrange
    const onClose = jest.fn();
    renderSheet({ open: true, onClose });
    // Act — click the backdrop (the outermost dialog div)
    const backdrop = screen.getByRole('dialog');
    fireEvent.click(backdrop);
    // Assert
    expect(onClose).toHaveBeenCalled();
  });

  test('should not call onClose when inner action-sheet content is clicked', () => {
    // Arrange
    const onClose = jest.fn();
    const { container } = renderSheet({ open: true, onClose });
    // Act — click the inner sheet (stopPropagation)
    const sheet = container.querySelector('.action-sheet');
    fireEvent.click(sheet);
    // Assert — onClose not triggered because stopPropagation
    expect(onClose).not.toHaveBeenCalled();
  });
});
