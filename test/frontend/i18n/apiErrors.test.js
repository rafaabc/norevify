import { describe, it, expect } from 'vitest';
import { API_ERROR_MAP } from '@/i18n/apiErrors.js';

describe('API_ERROR_MAP', () => {
  it('should map known backend messages to i18n keys', () => {
    expect(API_ERROR_MAP['Invalid credentials']).toBe('errors.invalidCredentials');
    expect(API_ERROR_MAP['User not found']).toBe('errors.userNotFound');
    expect(API_ERROR_MAP['Expense not found']).toBe('errors.expenseNotFound');
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

  it('should no longer map the retired password and email-verification messages', () => {
    for (const retired of [
      'username already taken',
      'email already registered',
      'Invalid or expired reset token',
      'Invalid or expired verification token',
      'Verification token has expired',
      'Email already verified',
    ]) {
      expect(API_ERROR_MAP[retired]).toBeUndefined();
    }
  });

  it('should map the consent errors raised when a new Google account has none', () => {
    expect(API_ERROR_MAP['consent with policyVersion and acceptedAt is required']).toBe(
      'errors.consentRequired',
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
