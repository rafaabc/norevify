import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoClear } from '@/hooks/useAutoClear';

describe('useAutoClear', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not call setter when value is falsy', () => {
    const setter = vi.fn();
    renderHook(() => useAutoClear('', setter, 1000));
    act(() => { vi.advanceTimersByTime(1000); });
    expect(setter).not.toHaveBeenCalled();
  });

  it('should clear string value to empty string after delay', () => {
    const setter = vi.fn();
    renderHook(() => useAutoClear('some error', setter, 1000));
    act(() => { vi.advanceTimersByTime(1000); });
    expect(setter).toHaveBeenCalledWith('');
  });

  it('should clear boolean value to false after delay', () => {
    const setter = vi.fn();
    renderHook(() => useAutoClear(true, setter, 500));
    act(() => { vi.advanceTimersByTime(500); });
    expect(setter).toHaveBeenCalledWith(false);
  });

  it('should use default delay of 3000ms', () => {
    const setter = vi.fn();
    renderHook(() => useAutoClear('msg', setter));
    act(() => { vi.advanceTimersByTime(2999); });
    expect(setter).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });
    expect(setter).toHaveBeenCalledWith('');
  });

  it('should clear timeout on unmount', () => {
    const setter = vi.fn();
    const { unmount } = renderHook(() => useAutoClear('msg', setter, 1000));
    unmount();
    act(() => { vi.advanceTimersByTime(1000); });
    expect(setter).not.toHaveBeenCalled();
  });
});
