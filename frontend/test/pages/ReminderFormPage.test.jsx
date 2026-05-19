import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ReminderFormPage from '../../src/pages/ReminderFormPage.jsx';
import { remindersApi } from '../../src/services/apiService.js';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k) => k, i18n: { language: 'en' } }),
}));

jest.mock('../../src/services/apiService.js', () => ({
  remindersApi: {
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// todayISO is called at render time; mock it to a stable value
jest.mock('../../src/utils/formatDate.js', () => ({
  todayISO: () => '2026-05-18',
}));

function renderCreatePage() {
  return render(
    <MemoryRouter future={{ v7_relativeSplatPath: true }} initialEntries={['/reminders/new']}>
      <Routes>
        <Route path="/reminders/new" element={<ReminderFormPage />} />
      </Routes>
    </MemoryRouter>
  );
}

function renderEditPage(id = 'rem1') {
  return render(
    <MemoryRouter future={{ v7_relativeSplatPath: true }} initialEntries={[`/reminders/${id}/edit`]}>
      <Routes>
        <Route path="/reminders/:id/edit" element={<ReminderFormPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ReminderFormPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create mode', () => {
    test('should render create form with all fields', () => {
      // Arrange + Act
      renderCreatePage();
      // Assert
      expect(screen.getByLabelText('reminders.fields.type')).toBeInTheDocument();
      expect(screen.getByLabelText('reminders.fields.title')).toBeInTheDocument();
      expect(screen.getByLabelText('reminders.fields.dueDate')).toBeInTheDocument();
      expect(screen.getByLabelText('reminders.fields.dueKm')).toBeInTheDocument();
      expect(screen.getByLabelText('reminders.fields.intervalMonths')).toBeInTheDocument();
      expect(screen.getByLabelText('reminders.fields.intervalKm')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'common.save' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'common.cancel' })).toBeInTheDocument();
    });

    test('should show validation error when neither dueDate nor dueKm is provided on submit', async () => {
      // Arrange
      const { container } = renderCreatePage();
      // Act — submit with empty dueDate and dueKm (defaults)
      await act(async () => {
        fireEvent.submit(container.querySelector('form'));
      });
      // Assert
      expect(await screen.findByText('errors.reminderMissingDue')).toBeInTheDocument();
      expect(remindersApi.create).not.toHaveBeenCalled();
    });

    test('should call remindersApi.create and navigate when dueKm is filled', async () => {
      // Arrange
      remindersApi.create.mockResolvedValue({ id: 'new1' });
      const { container } = renderCreatePage();
      // Act — fill in dueKm and submit
      fireEvent.change(container.querySelector('input[name="dueKm"]'), { target: { value: '10000' } });
      await act(async () => {
        fireEvent.submit(container.querySelector('form'));
      });
      // Assert
      await waitFor(() => {
        expect(remindersApi.create).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'Maintenance', dueKm: 10000 })
        );
        expect(mockNavigate).toHaveBeenCalledWith('/reminders');
      });
    });

    test('should call remindersApi.create and navigate when dueDate is filled', async () => {
      // Arrange
      remindersApi.create.mockResolvedValue({ id: 'new2' });
      const { container } = renderCreatePage();
      // Act — fill in dueDate and submit
      fireEvent.change(container.querySelector('input[name="dueDate"]'), { target: { value: '2026-04-01' } });
      await act(async () => {
        fireEvent.submit(container.querySelector('form'));
      });
      // Assert
      await waitFor(() => {
        expect(remindersApi.create).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'Maintenance' })
        );
        expect(mockNavigate).toHaveBeenCalledWith('/reminders');
      });
    });

    test('should show error banner on API failure', async () => {
      // Arrange
      remindersApi.create.mockRejectedValue(new Error('Server error'));
      const { container } = renderCreatePage();
      fireEvent.change(container.querySelector('input[name="dueKm"]'), { target: { value: '5000' } });
      // Act
      await act(async () => {
        fireEvent.submit(container.querySelector('form'));
      });
      // Assert
      expect(await screen.findByText('Server error')).toBeInTheDocument();
    });

    test('should not call remindersApi.get in create mode', () => {
      // Arrange + Act
      renderCreatePage();
      // Assert
      expect(remindersApi.get).not.toHaveBeenCalled();
    });
  });

  describe('edit mode', () => {
    test('should call remindersApi.get and populate the form on mount', async () => {
      // Arrange
      remindersApi.get.mockResolvedValue({
        id: 'rem1',
        type: 'Fuel',
        title: 'Summer tires',
        dueDate: '2026-06-01T00:00:00.000Z',
        dueKm: 20000,
        intervalMonths: null,
        intervalKm: null,
      });
      // Act
      renderEditPage('rem1');
      // Assert
      await waitFor(() => {
        expect(remindersApi.get).toHaveBeenCalledWith('rem1');
        expect(screen.getByLabelText('reminders.fields.type')).toHaveValue('Fuel');
      });
    });

    test('should call remindersApi.update and navigate on success', async () => {
      // Arrange
      remindersApi.get.mockResolvedValue({
        id: 'rem1',
        type: 'Maintenance',
        title: '',
        dueDate: null,
        dueKm: 10000,
        intervalMonths: null,
        intervalKm: null,
      });
      remindersApi.update.mockResolvedValue({});
      const { container } = renderEditPage('rem1');
      await waitFor(() => expect(remindersApi.get).toHaveBeenCalled());
      // Act — change dueKm and submit
      fireEvent.change(container.querySelector('input[name="dueKm"]'), { target: { value: '12000' } });
      await act(async () => {
        fireEvent.submit(container.querySelector('form'));
      });
      // Assert
      await waitFor(() => {
        expect(remindersApi.update).toHaveBeenCalledWith('rem1', expect.objectContaining({ dueKm: 12000 }));
        expect(mockNavigate).toHaveBeenCalledWith('/reminders');
      });
    });
  });
});
