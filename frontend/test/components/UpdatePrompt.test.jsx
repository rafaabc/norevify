import { render, screen, fireEvent } from '@testing-library/react';
import UpdatePrompt from '../../src/components/UpdatePrompt.jsx';

describe('UpdatePrompt', () => {
  test('should render the update toast with message and reload button', () => {
    // Arrange + Act
    render(<UpdatePrompt onUpdate={jest.fn()} />);
    // Assert
    expect(screen.getByText('pwa.updateAvailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'pwa.reload' })).toBeInTheDocument();
  });

  test('should call onUpdate when the reload button is clicked', () => {
    // Arrange
    const onUpdate = jest.fn();
    render(<UpdatePrompt onUpdate={onUpdate} />);
    // Act
    fireEvent.click(screen.getByRole('button', { name: 'pwa.reload' }));
    // Assert
    expect(onUpdate).toHaveBeenCalledTimes(1);
  });
});
