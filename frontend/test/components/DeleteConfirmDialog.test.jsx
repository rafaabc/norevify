import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'common.cancel': 'Cancel',
        'common.delete': 'Delete',
      };
      return translations[key] ?? key;
    },
  }),
}));

import DeleteConfirmDialog from '../../src/components/DeleteConfirmDialog.jsx';

test('renders nothing when open=false', () => {
  render(
    <DeleteConfirmDialog open={false} message="Delete?" onConfirm={() => {}} onCancel={() => {}} />
  );
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

test('single-confirm: one click fires onConfirm', async () => {
  const onConfirm = jest.fn();
  render(
    <DeleteConfirmDialog open message="Delete?" onConfirm={onConfirm} onCancel={() => {}} />
  );
  await userEvent.click(screen.getByRole('button', { name: /delete|excluir/i }));
  expect(onConfirm).toHaveBeenCalledTimes(1);
});

test('double-confirm: first click advances stage, second fires onConfirm', async () => {
  const onConfirm = jest.fn();
  render(
    <DeleteConfirmDialog
      open
      requireDouble
      messages={['Are you sure?', 'Really delete?']}
      onConfirm={onConfirm}
      onCancel={() => {}}
    />
  );
  // First click — advances stage
  await userEvent.click(screen.getByRole('button', { name: /continue/i }));
  expect(onConfirm).not.toHaveBeenCalled();
  // Second click — confirms
  await userEvent.click(screen.getByRole('button', { name: /delete|excluir/i }));
  expect(onConfirm).toHaveBeenCalledTimes(1);
});

test('cancel button fires onCancel', async () => {
  const onCancel = jest.fn();
  render(
    <DeleteConfirmDialog open message="Delete?" onConfirm={() => {}} onCancel={onCancel} />
  );
  await userEvent.click(screen.getByRole('button', { name: /cancel|cancelar/i }));
  expect(onCancel).toHaveBeenCalledTimes(1);
});
