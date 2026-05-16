import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFoundPage from '../../src/pages/NotFoundPage.jsx';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('NotFoundPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test('should render 404 heading and page not found text', () => {
    // Arrange + Act
    render(<MemoryRouter future={{ v7_relativeSplatPath: true }}><NotFoundPage /></MemoryRouter>);
    // Assert
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('notFound.heading')).toBeInTheDocument();
  });

  test('should navigate to / when "Go home" button is clicked', () => {
    // Arrange
    render(<MemoryRouter future={{ v7_relativeSplatPath: true }}><NotFoundPage /></MemoryRouter>);
    // Act
    fireEvent.click(screen.getByRole('button', { name: 'notFound.back' }));
    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
