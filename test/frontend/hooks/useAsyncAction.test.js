import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAsyncAction } from '@/hooks/useAsyncAction';

describe('useAsyncAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialise with loading=false, error="", success=false', () => {
    const { result } = renderHook(() => useAsyncAction());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('');
    expect(result.current.success).toBe(false);
  });

  it('should set loading=true while fn is running', async () => {
    const { result } = renderHook(() => useAsyncAction());
    let resolve;
    const fn = () =>
      new Promise((r) => {
        resolve = r;
      });
    act(() => {
      result.current.run(fn);
    });
    expect(result.current.loading).toBe(true);
    await act(async () => {
      resolve();
    });
  });

  it('should set success=true and loading=false after fn resolves', async () => {
    const { result } = renderHook(() => useAsyncAction());
    await act(async () => {
      await result.current.run(() => Promise.resolve());
    });
    expect(result.current.success).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('');
  });

  it('should set error message and loading=false after fn rejects', async () => {
    const { result } = renderHook(() => useAsyncAction());
    await act(async () => {
      await result.current.run(() => Promise.reject(new Error('boom')));
    });
    expect(result.current.error).toBe('boom');
    expect(result.current.loading).toBe(false);
    expect(result.current.success).toBe(false);
  });

  it('should reset error and success at the start of each run', async () => {
    const { result } = renderHook(() => useAsyncAction());
    await act(async () => {
      await result.current.run(() => Promise.reject(new Error('first error')));
    });
    expect(result.current.error).toBe('first error');
    await act(async () => {
      await result.current.run(() => Promise.resolve());
    });
    expect(result.current.error).toBe('');
    expect(result.current.success).toBe(true);
  });

  it('should allow manual setSuccess and setError', () => {
    const { result } = renderHook(() => useAsyncAction());
    act(() => {
      result.current.setSuccess(true);
    });
    expect(result.current.success).toBe(true);
    act(() => {
      result.current.setError('manual');
    });
    expect(result.current.error).toBe('manual');
  });
});
