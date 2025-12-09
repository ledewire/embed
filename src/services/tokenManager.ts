/**
 * Token Manager - Handles storing, retrieving, and refreshing authentication tokens
 */

import { ApiClient } from "./api";

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

export class TokenManager {
  private static STORAGE_KEYS = {
    ACCESS_TOKEN: "access_token",
    REFRESH_TOKEN: "refresh_token",
    EXPIRES_AT: "expires_at",
    SELLER_TOKEN: "seller_token",
  };

  /**
   * Store authentication tokens in localStorage
   */
  static setTokens(tokens: AuthTokens): void {
    localStorage.setItem(this.STORAGE_KEYS.ACCESS_TOKEN, tokens.access_token);
    localStorage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token);
    localStorage.setItem(this.STORAGE_KEYS.EXPIRES_AT, tokens.expires_at);
  }

  static setSellerToken(seller_token: string) {
    localStorage.setItem(this.STORAGE_KEYS.SELLER_TOKEN, seller_token);
  }

  static getSellerToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEYS.SELLER_TOKEN);
  }

  /**
   * Get access token from localStorage
   */
  static getAccessToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEYS.ACCESS_TOKEN);
  }

  /**
   * Get refresh token from localStorage
   */
  static getRefreshToken(): string | null {
    return localStorage.getItem(this.STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Get token expiry time from localStorage
   */
  static getExpiresAt(): string | null {
    return localStorage.getItem(this.STORAGE_KEYS.EXPIRES_AT);
  }

  /**
   * Check if the access token is expired or about to expire (within 5 minutes)
   */
  static isTokenExpired(): boolean {
    const expiresAt = this.getExpiresAt();
    if (!expiresAt) return true;

    const expiryTime = new Date(expiresAt).getTime();
    const currentTime = Date.now();
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds

    return currentTime >= expiryTime - bufferTime;
  }

  /**
   * Check if user is authenticated (has valid tokens)
   */
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

    // Don't include auth in refresh token request to avoid circular dependency
    const response = await ApiClient.post<AuthTokens>(
      "/auth/token/refresh",
      { refresh_token: refreshToken },
      false // Don't include auth header
    );

    this.setTokens(response);
    return response;
  }

  /**
   * Ensure token is valid, refresh if needed
   */
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
   * Clear all tokens from localStorage (logout)
   */
  static clearTokens(): void {
    localStorage.removeItem(this.STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(this.STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(this.STORAGE_KEYS.EXPIRES_AT);
  }

  /**
   * Get all tokens as an object
   */
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
