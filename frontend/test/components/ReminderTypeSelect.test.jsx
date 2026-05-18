import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'reminders.fields.type': 'Type',
        'reminderTypes.oilChange': 'Oil Change',
        'reminderTypes.tireRotation': 'Tire Rotation',
        'reminderTypes.inspection': 'Inspection',
        'reminderTypes.insurance': 'Insurance',
        'reminderTypes.license': 'License',
        'reminderTypes.other': 'Other',
      };
      return translations[key] ?? key;
    },
  }),
}));

import ReminderTypeSelect from '../../src/components/ReminderTypeSelect.jsx';

describe('ReminderTypeSelect', () => {
  test('renders a select with label and all 6 type options', () => {
    render(<ReminderTypeSelect value="oilChange" onChange={() => {}} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getAllByRole('option').length).toBe(6);
  });

  test('selected value reflects value prop', () => {
    render(<ReminderTypeSelect value="inspection" onChange={() => {}} />);
    expect(screen.getByRole('combobox')).toHaveValue('inspection');
  });

  test('fires onChange when user selects a different option', async () => {
    const onChange = jest.fn();
    render(<ReminderTypeSelect value="oilChange" onChange={onChange} />);
    await userEvent.selectOptions(screen.getByRole('combobox'), 'insurance');
    expect(onChange).toHaveBeenCalled();
  });
});
