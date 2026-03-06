import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TokenManager } from './tokenManager';
import { setTokenStorageAdapter } from './storageAdapter';
import { InMemoryStorage } from './storageAdapter';

describe('TokenManager', () => {
  beforeEach(() => {
    setTokenStorageAdapter(new InMemoryStorage());
    TokenManager.clearTokens();
  });

  describe('setTokens / getAccessToken / getRefreshToken / getExpiresAt', () => {
    it('stores and retrieves tokens', () => {
      const tokens = {
        access_token: 'access-123',
        refresh_token: 'refresh-456',
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      };
      TokenManager.setTokens(tokens);

      expect(TokenManager.getAccessToken()).toBe('access-123');
      expect(TokenManager.getRefreshToken()).toBe('refresh-456');
      expect(TokenManager.getExpiresAt()).toBe(tokens.expires_at);
    });
  });

  describe('setSellerToken / getSellerToken', () => {
    it('stores and retrieves seller token', () => {
      TokenManager.setSellerToken('seller-token-789');
      expect(TokenManager.getSellerToken()).toBe('seller-token-789');
    });
  });

  describe('isTokenExpired', () => {
    it('returns true when no expires_at', () => {
      TokenManager.setTokens({
        access_token: 'a',
        refresh_token: 'r',
        expires_at: '',
      });
      expect(TokenManager.isTokenExpired()).toBe(true);
    });

    it('returns true when token is expired', () => {
      const past = new Date(Date.now() - 60000).toISOString();
      TokenManager.setTokens({
        access_token: 'a',
        refresh_token: 'r',
        expires_at: past,
      });
      expect(TokenManager.isTokenExpired()).toBe(true);
    });

    it('returns false when token has future expiry', () => {
      const future = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      TokenManager.setTokens({
        access_token: 'a',
        refresh_token: 'r',
        expires_at: future,
      });
      expect(TokenManager.isTokenExpired()).toBe(false);
    });

    it('returns true when within 5 min buffer of expiry', () => {
      const nearExpiry = new Date(Date.now() + 2 * 60 * 1000).toISOString();
      TokenManager.setTokens({
        access_token: 'a',
        refresh_token: 'r',
        expires_at: nearExpiry,
      });
      expect(TokenManager.isTokenExpired()).toBe(true);
    });
  });

  describe('isAuthenticated', () => {
    it('returns false when no access token', () => {
      expect(TokenManager.isAuthenticated()).toBe(false);
    });

    it('returns true when valid token exists', () => {
      const future = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      TokenManager.setTokens({
        access_token: 'valid',
        refresh_token: 'r',
        expires_at: future,
      });
      expect(TokenManager.isAuthenticated()).toBe(true);
    });
  });

  describe('clearTokens', () => {
    it('clears all tokens', () => {
      const future = new Date(Date.now() + 3600000).toISOString();
      TokenManager.setTokens({
        access_token: 'a',
        refresh_token: 'r',
        expires_at: future,
      });
      TokenManager.setSellerToken('seller');

      TokenManager.clearTokens();

      expect(TokenManager.getAccessToken()).toBeNull();
      expect(TokenManager.getRefreshToken()).toBeNull();
      expect(TokenManager.getExpiresAt()).toBeNull();
      expect(TokenManager.getSellerToken()).toBeNull();
    });
  });

  describe('getAllTokens', () => {
    it('returns null when tokens are incomplete', () => {
      expect(TokenManager.getAllTokens()).toBeNull();
    });

    it('returns all tokens when complete', () => {
      const tokens = {
        access_token: 'a',
        refresh_token: 'r',
        expires_at: new Date().toISOString(),
      };
      TokenManager.setTokens(tokens);
      expect(TokenManager.getAllTokens()).toEqual(tokens);
    });
  });

  describe('refreshAccessToken', () => {
    it('throws when no refresh token', async () => {
      await expect(TokenManager.refreshAccessToken()).rejects.toThrow(
        'No refresh token available'
      );
    });

    it('calls API and updates tokens on success', async () => {
      const future = new Date(Date.now() - 60000).toISOString();
      TokenManager.setTokens({
        access_token: 'old',
        refresh_token: 'refresh',
        expires_at: future,
      });

      const ApiClientModule = await import('./api');
      vi.spyOn(ApiClientModule.ApiClient, 'post').mockResolvedValue({
        access_token: 'new-access',
        refresh_token: 'new-refresh',
        expires_at: new Date(Date.now() + 3600000).toISOString(),
      });

      const result = await TokenManager.refreshAccessToken();

      expect(result.access_token).toBe('new-access');
      expect(TokenManager.getAccessToken()).toBe('new-access');
    });
  });
});
