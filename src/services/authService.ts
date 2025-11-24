/**
 * Authentication Service - Handles login, signup, and OAuth flows
 */

import { ApiClient } from "./api";
import { TokenManager, AuthTokens } from "./tokenManager";

export interface EmailLoginRequest {
  email: string;
  password: string;
}

export interface GoogleLoginRequest {
  id_token: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export class AuthService {
  /**
   * Login with email and password
   */
  static async loginWithEmail(
    email: string,
    password: string
  ): Promise<AuthTokens> {
    const response = await ApiClient.post<AuthTokens>("/auth/login/email", {
      email,
      password,
    });

    TokenManager.setTokens(response);
    return response;
  }

  /**
   * Login with Google OAuth
   */
  static async loginWithGoogle(idToken: string): Promise<AuthTokens> {
    const response = await ApiClient.post<AuthTokens>("/auth/login/google", {
      id_token: idToken,
    });

    TokenManager.setTokens(response);
    return response;
  }

  /**
   * Sign up with email and password
   */
  static async signup(
    email: string,
    password: string,
    name: string
  ): Promise<AuthTokens> {
    const response = await ApiClient.post<AuthTokens>("/auth/signup", {
      email,
      password,
      name,
    });

    TokenManager.setTokens(response);
    return response;
  }

  /**
   * Logout the current user
   */
  static logout(): void {
    TokenManager.clearTokens();
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return TokenManager.isAuthenticated();
  }

  /**
   * Get current access token (refresh if needed)
   */
  static async getAccessToken(): Promise<string> {
    return TokenManager.ensureValidToken();
  }
}
