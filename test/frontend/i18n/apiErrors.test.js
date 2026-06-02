import { describe, it, expect } from 'vitest';
import { API_ERROR_MAP } from '@/i18n/apiErrors.js';

describe('API_ERROR_MAP', () => {
  it('should map known backend messages to i18n keys', () => {
    expect(API_ERROR_MAP['Invalid credentials']).toBe('errors.invalidCredentials');
    expect(API_ERROR_MAP['username already taken']).toBe('errors.usernameTaken');
    expect(API_ERROR_MAP['email already registered']).toBe('errors.emailRegistered');
    expect(API_ERROR_MAP['User not found']).toBe('errors.userNotFound');
    expect(API_ERROR_MAP['Expense not found']).toBe('errors.expenseNotFound');
    expect(API_ERROR_MAP['Invalid or expired reset token']).toBe('errors.invalidToken');
    expect(API_ERROR_MAP['Reminder not found']).toBe('errors.reminderNotFound');
    expect(API_ERROR_MAP['reminder already completed']).toBe('errors.reminderAlreadyCompleted');
    expect(API_ERROR_MAP['cannot edit completed reminder']).toBe(
      'errors.reminderCannotEditCompleted',
    );
    expect(API_ERROR_MAP['must provide dueDate or dueKm']).toBe('errors.reminderMissingDue');
    expect(API_ERROR_MAP['odometer cannot be lower than current reading']).toBe(
      'errors.odometerRewind',
    );
    expect(API_ERROR_MAP['odometer is only valid for Fuel category']).toBe(
      'errors.odometerNonFuel',
    );
  });

  it('should return undefined for unknown backend messages', () => {
    expect(API_ERROR_MAP['some unknown error']).toBeUndefined();
  });

  it('should map all entries to strings starting with errors.', () => {
    for (const value of Object.values(API_ERROR_MAP)) {
      expect(value).toMatch(/^errors\./);
    }
  });
});
