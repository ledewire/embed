/**
 * Authentication Service - Handles login, signup, and OAuth flows
 */

import axios, { AxiosResponse } from "axios";
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

interface IConfigResponse {
  google_client_id: string;
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
  static async loginWithGoogle(idToken: string): Promise<void> {
    const config = {
      method: "POST",
      url: "https://api-staging.ledewire.com/v1/auth/login/google",
      data: JSON.stringify({
        id_token: idToken,
      }),
      headers: {
        "Content-Type": "multipart/form-data",
      },
      // Don't throw on HTTP error status codes - we'll handle them manually
      validateStatus: () => true,
    };

    const response = await axios(config);

    console.log(response);
  }

  static async authenticateSeller() {
    const apiKey = import.meta.env.VITE_API_KEY;
    const apiSecret =
      import.meta.env.VITE_API_SECRET ?? import.meta.env.VITE_APT_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error(
        "Missing VITE_API_KEY or VITE_API_SECRET (or VITE_APT_SECRET) in environment."
      );
    }

    const url = "http://localhost:8010/auth/login/api-key";
    const payload = { key: apiKey, secret: apiSecret };

    // use axios.post with generic for typed response
    const response: AxiosResponse<{
      access_token: string;
    }> = await axios.post<{
      access_token: string;
    }>(url, payload, {
      headers: {
        "Content-Type": "application/json",
      },
      // We'll handle non-2xx statuses manually below
      validateStatus: () => true,
      timeout: 10_000,
    });

    if (response.status < 200 || response.status >= 300) {
      const bodyPreview = response.data
        ? JSON.stringify(response.data)
        : "no body";
      throw new Error(
        `Auth request failed (status ${response.status}): ${bodyPreview}`
      );
    }

    if (!response.data || typeof response.data.access_token !== "string") {
      throw new Error("Auth response missing accessToken");
    }
    console.log(response.data);

    return response.data.access_token;
  }

  static async getConfig(): Promise<IConfigResponse> {
    try {
      const sellerAccessToken = await this.authenticateSeller();

      console.log("hi");
      console.log(sellerAccessToken);
      const configResponse = await axios.get(
        "http://localhost:8010/seller/config",
        {
          headers: {
            Authorization: `Bearer ${sellerAccessToken}`,
            "Content-Type": "application/json",
          },
          validateStatus: () => true, // handle errors manually
        }
      );

      if (configResponse.status !== 200) {
        throw new Error(
          `Failed to load seller config (status ${configResponse.status}): ` +
            JSON.stringify(configResponse.data)
        );
      }

      return configResponse.data;
    } catch (error) {
      throw error;
    }
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
   * Check if user is authenticated (synchronous)
   */
  static isAuthenticated(): boolean {
    return TokenManager.isAuthenticated();
  }

  /**
   * Ensure user is authenticated with a valid token (async, refreshes if needed)
   */
  static async ensureAuthenticated(): Promise<boolean> {
    try {
      const accessToken = TokenManager.getAccessToken();
      if (!accessToken) return false;

      // This will trigger a refresh if the token is expired
      await TokenManager.ensureValidToken();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current access token (refresh if needed)
   */
  static async getAccessToken(): Promise<string> {
    return TokenManager.ensureValidToken();
  }
}
