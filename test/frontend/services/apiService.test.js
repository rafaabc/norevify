import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/i18n/index.js', () => ({
  default: { t: (key) => key },
}));

vi.mock('@/i18n/apiErrors.js', () => ({
  API_ERROR_MAP: { 'Invalid credentials': 'errors.invalidCredentials' },
}));

import { authApi, expensesApi } from '@/services/apiService.js';

function mockFetch(status, body) {
  global.fetch = vi.fn().mockResolvedValue({
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
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/auth/login');
    expect(opts.method).toBe('POST');
    expect(opts.headers['Authorization']).toBeUndefined();
    expect(JSON.parse(opts.body)).toEqual({ username: 'u', password: 'p' });
  });

  it('should throw with mapped i18n message when backend returns 401', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: 'Invalid credentials' }),
    });
    await expect(authApi.login({ username: 'bad', password: 'wrong' }))
      .rejects.toThrow('errors.invalidCredentials');
  });
});

describe('authApi.register', () => {
  it('should POST /api/auth/register without auth header', async () => {
    mockFetch(201, { id: 'uid1' });
    await authApi.register({ username: 'u', password: 'p', email: 'u@test.com' });
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/auth/register');
    expect(opts.headers['Authorization']).toBeUndefined();
  });
});

describe('expensesApi.list', () => {
  it('should GET /api/expenses with token in Authorization header when authed', async () => {
    localStorage.setItem('token', 'mytoken');
    mockFetch(200, []);
    await expensesApi.list();
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/expenses');
    expect(opts.headers['Authorization']).toBe('Bearer mytoken');
  });

  it('should append category query param when provided', async () => {
    mockFetch(200, []);
    await expensesApi.list({ category: 'Fuel' });
    const [url] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/expenses?category=Fuel');
  });

  it('should return null for 204 responses', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 204, json: vi.fn() });
    const result = await expensesApi.remove('123');
    expect(result).toBeNull();
  });
});
