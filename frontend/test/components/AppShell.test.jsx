import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AppShell from '../../src/components/AppShell.jsx';

jest.mock('../../src/components/Sidebar.jsx', () => () => <aside data-testid="sidebar" />);
jest.mock('../../src/components/MobileTopBar.jsx', () => () => null);
jest.mock('../../src/components/BottomTabs.jsx', () => () => null);

describe('AppShell', () => {
  test('should render Sidebar and outlet content', () => {
    // Arrange + Act
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<p>Page content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    // Assert
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  test('should render a <main> element wrapping the outlet', () => {
    // Arrange + Act
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<span>Inner</span>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    // Assert
    const main = container.querySelector('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveTextContent('Inner');
  });
});
