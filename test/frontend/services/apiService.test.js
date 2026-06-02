import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/i18n/index.js', () => ({
  default: { t: (key) => key },
}));

vi.mock('@/i18n/apiErrors.js', () => ({
  API_ERROR_MAP: { 'Invalid credentials': 'errors.invalidCredentials' },
}));

import { authApi, expensesApi, remindersApi } from '@/services/apiService.js';

function mockFetch(status, body) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('authApi.login', () => {
  it('should POST /api/auth/login without auth header', async () => {
    mockFetch(200, { token: 'tok123' });
    const result = await authApi.login({ username: 'u', password: 'p' });

    expect(result).toEqual({ token: 'tok123' });
    const [url, opts] = globalThis.fetch.mock.calls[0];
    expect(url).toBe('/api/auth/login');
    expect(opts.method).toBe('POST');
    expect(opts.headers['Authorization']).toBeUndefined();
    expect(JSON.parse(opts.body)).toEqual({ username: 'u', password: 'p' });
  });

  it('should throw with mapped i18n message when backend returns 401', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Invalid credentials' }),
    });
    await expect(authApi.login({ username: 'bad', password: 'wrong' })).rejects.toThrow(
      'errors.invalidCredentials',
    );
  });
});

describe('authApi.register', () => {
  it('should POST /api/auth/register without auth header', async () => {
    mockFetch(201, { id: 'uid1' });
    await authApi.register({ username: 'u', password: 'p', email: 'u@test.com' });
    const [url, opts] = globalThis.fetch.mock.calls[0];
    expect(url).toBe('/api/auth/register');
    expect(opts.headers['Authorization']).toBeUndefined();
  });
});

describe('expensesApi.list', () => {
  it('should GET /api/expenses with token in Authorization header when authed', async () => {
    localStorage.setItem('token', 'mytoken');
    mockFetch(200, []);
    await expensesApi.list();
    const [url, opts] = globalThis.fetch.mock.calls[0];
    expect(url).toBe('/api/expenses');
    expect(opts.headers['Authorization']).toBe('Bearer mytoken');
  });

  it('should append category query param when provided', async () => {
    mockFetch(200, []);
    await expensesApi.list({ category: 'Fuel' });
    const [url] = globalThis.fetch.mock.calls[0];
    expect(url).toBe('/api/expenses?category=Fuel');
  });

  it('should return null for 204 responses', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204, json: vi.fn() });
    const result = await expensesApi.remove('123');
    expect(result).toBeNull();
  });
});

describe('request 401/403 auth handling', () => {
  it('should dispatch auth:logout event and throw when authenticated request gets 401', async () => {
    localStorage.setItem('token', 'validtoken');
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Unauthorized' }),
    });
    const eventSpy = vi.fn();
    globalThis.addEventListener('auth:logout', eventSpy);
    await expect(authApi.changePassword({ password: 'new' })).rejects.toThrow();
    expect(localStorage.getItem('token')).toBeNull();
    expect(eventSpy).toHaveBeenCalledOnce();
    globalThis.removeEventListener('auth:logout', eventSpy);
  });

  it('should NOT dispatch auth:logout on 403 (authorization error, not session expiry)', async () => {
    localStorage.setItem('token', 'validtoken');
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ message: 'Email not verified' }),
    });
    const eventSpy = vi.fn();
    globalThis.addEventListener('auth:logout', eventSpy);
    await expect(authApi.getProviders()).rejects.toThrow();
    expect(eventSpy).not.toHaveBeenCalled();
    expect(localStorage.getItem('token')).not.toBeNull();
    globalThis.removeEventListener('auth:logout', eventSpy);
  });

  it('should not dispatch auth:logout for 401 on unauthenticated requests', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Invalid credentials' }),
    });
    const eventSpy = vi.fn();
    globalThis.addEventListener('auth:logout', eventSpy);
    await expect(authApi.login({ username: 'u', password: 'bad' })).rejects.toThrow();
    expect(eventSpy).not.toHaveBeenCalled();
    globalThis.removeEventListener('auth:logout', eventSpy);
  });
});

describe('expensesApi.summary', () => {
  it('should GET /api/expenses/summary with year, month and category params', async () => {
    mockFetch(200, {});
    await expensesApi.summary({ year: '2026', month: '3', category: 'Fuel' });
    const [url] = globalThis.fetch.mock.calls[0];
    expect(url).toContain('/api/expenses/summary');
    expect(url).toContain('year=2026');
    expect(url).toContain('month=3');
    expect(url).toContain('category=Fuel');
  });

  it('should GET /api/expenses/summary with no params when called with empty object', async () => {
    mockFetch(200, {});
    await expensesApi.summary({});
    const [url] = globalThis.fetch.mock.calls[0];
    expect(url).toBe('/api/expenses/summary?');
  });
});

describe('remindersApi', () => {
  it('should GET /api/reminders/badge-count', async () => {
    localStorage.setItem('token', 'tok');
    mockFetch(200, { dueSoon: 1, overdue: 2 });
    const result = await remindersApi.badgeCount();
    const [url] = globalThis.fetch.mock.calls[0];
    expect(url).toBe('/api/reminders/badge-count');
    expect(result).toEqual({ dueSoon: 1, overdue: 2 });
  });

  it('should GET /api/reminders with status param when provided', async () => {
    mockFetch(200, []);
    await remindersApi.list({ status: 'active' });
    const [url] = globalThis.fetch.mock.calls[0];
    expect(url).toBe('/api/reminders?status=active');
  });

  it('should GET /api/reminders without params when no status provided', async () => {
    mockFetch(200, []);
    await remindersApi.list();
    const [url] = globalThis.fetch.mock.calls[0];
    expect(url).toBe('/api/reminders');
  });
});
