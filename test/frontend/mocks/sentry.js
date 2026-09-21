import { vi } from 'vitest';

export const captureException = vi.fn();
export const captureMessage = vi.fn();
export const addBreadcrumb = vi.fn();
export const setUser = vi.fn();
export const withScope = vi.fn((cb) => cb({ setExtra: vi.fn(), setTag: vi.fn() }));
