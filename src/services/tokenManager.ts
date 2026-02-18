/**
 * Token Manager - Handles storing, retrieving, and refreshing authentication tokens.
 * Uses a configurable storage adapter (default: in-memory) to avoid XSS token theft
 * in embed contexts. Do not use localStorage for tokens on third-party host pages.
 */

import { getTokenStorage } from "./storageAdapter";

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  EXPIRES_AT: "expires_at",
  SELLER_TOKEN: "seller_token",
};

function storage() {
  return getTokenStorage();
}

export class TokenManager {
  /**
   * Store authentication tokens (uses configured adapter; default in-memory)
   */
  static setTokens(tokens: AuthTokens): void {
    const s = storage();
    s.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access_token);
    s.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token);
    s.setItem(STORAGE_KEYS.EXPIRES_AT, tokens.expires_at);
  }

  static setSellerToken(seller_token: string): void {
    storage().setItem(STORAGE_KEYS.SELLER_TOKEN, seller_token);
  }

  static getSellerToken(): string | null {
    return storage().getItem(STORAGE_KEYS.SELLER_TOKEN);
  }

  static getAccessToken(): string | null {
    return storage().getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  static getRefreshToken(): string | null {
    return storage().getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  static getExpiresAt(): string | null {
    return storage().getItem(STORAGE_KEYS.EXPIRES_AT);
  }

  /**
   * Check if the access token is expired or about to expire (within 5 minutes)
   */
  static isTokenExpired(): boolean {
    const expiresAt = this.getExpiresAt();
    if (!expiresAt) return true;

    const expiryTime = new Date(expiresAt).getTime();
    const currentTime = Date.now();
    const bufferTime = 5 * 60 * 1000; // 5 minutes

    return currentTime >= expiryTime - bufferTime;
  }

  static isAuthenticated(): boolean {
    const accessToken = this.getAccessToken();
    return !!accessToken && !this.isTokenExpired();
  }

  /**
   * Refresh the access token using the refresh token
   */
  static async refreshAccessToken(): Promise<AuthTokens> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const { ApiClient } = await import("./api");
    const response = await ApiClient.post<AuthTokens>(
      "/auth/token/refresh",
      { refresh_token: refreshToken },
      false,
    );

    this.setTokens(response);
    return response;
  }

  static async ensureValidToken(): Promise<string> {
    if (this.isTokenExpired()) {
      const tokens = await this.refreshAccessToken();
      return tokens.access_token;
    }

    const token = this.getAccessToken();
    if (!token) {
      throw new Error("No access token available");
    }

    return token;
  }

  /**
   * Clear all tokens (logout). Seller token is also cleared.
   */
  static clearTokens(): void {
    const s = storage();
    s.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    s.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    s.removeItem(STORAGE_KEYS.EXPIRES_AT);
    s.removeItem(STORAGE_KEYS.SELLER_TOKEN);
  }

  static getAllTokens(): AuthTokens | null {
    const access_token = this.getAccessToken();
    const refresh_token = this.getRefreshToken();
    const expires_at = this.getExpiresAt();

    if (!access_token || !refresh_token || !expires_at) {
      return null;
    }

    return { access_token, refresh_token, expires_at };
  }
}
