import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiClient } from './api';
import { TokenManager } from './tokenManager';
import { setTokenStorageAdapter } from './storageAdapter';
import { InMemoryStorage } from './storageAdapter';

// Vite may use different base URL in test; we assert on path and method

describe('ApiClient', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    setTokenStorageAdapter(new InMemoryStorage());
    TokenManager.clearTokens();
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
  });

  it('GET returns JSON on success', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: 'test' }),
    });

    const result = await ApiClient.get<{ data: string }>('/test');
    expect(result).toEqual({ data: 'test' });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('POST sends body and returns JSON', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: '123' }),
    });

    const result = await ApiClient.post<{ id: string }>('/create', {
      name: 'test',
    });
    expect(result).toEqual({ id: '123' });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/create'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'test' }),
      })
    );
  });

  it('throws on non-ok response with error message', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: () =>
        Promise.resolve({ error: { message: 'Invalid request' } }),
    });

    await expect(
      ApiClient.get('/fail')
    ).rejects.toThrow('Invalid request');
  });

  it('includes Authorization header when includeAuth is true', async () => {
    const future = new Date(Date.now() + 3600000).toISOString();
    TokenManager.setTokens({
      access_token: 'test-token',
      refresh_token: 'refresh',
      expires_at: future,
    });

    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await ApiClient.get('/auth-endpoint', true);

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );
  });
});
