import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

import ReminderTypeSelect from '../../src/components/ReminderTypeSelect.jsx';

describe('ReminderTypeSelect', () => {
  test('renders a select with label and all 7 type options', () => {
    render(<ReminderTypeSelect value="Maintenance" onChange={() => {}} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getAllByRole('option').length).toBe(7);
  });

  test('selected value reflects value prop', () => {
    render(<ReminderTypeSelect value="Fuel" onChange={() => {}} />);
    expect(screen.getByRole('combobox')).toHaveValue('Fuel');
  });

  test('fires onChange when user selects a different option', async () => {
    const onChange = jest.fn();
    render(<ReminderTypeSelect value="Maintenance" onChange={onChange} />);
    await userEvent.selectOptions(screen.getByRole('combobox'), 'Insurance');
    expect(onChange).toHaveBeenCalled();
  });
});
