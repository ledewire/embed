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
  first_name: string;
  last_name: string;
}

interface IConfigResponse {
  google_client_id: string;
}

export interface IContentMetadata {
  id: string;
  content_type: string;
  title: string;
  price_cents: number;
  content_body: string;
  teaser: string;
  visibility: string;
  metadata: {
    author: string;
    publish_date: string;
    read_time: string;
  };
  access_info: any
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.ledewire.com/v1";

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
  /**
   * Login with Google OAuth
   */
  static async loginWithGoogle(idToken: string): Promise<void> {
    const config = {
      method: "POST",
      url: `${API_BASE_URL}/auth/login/google`,
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

  static async authenticateSeller(apiKey: string) {
    if (!apiKey) {
      console.error("Missing API_KEY");
      throw new Error("Missing API_KEY");
    }

    const url = `${API_BASE_URL}/auth/login/api-key`;
    const payload = { key: apiKey };

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
    TokenManager.setSellerToken(response.data.access_token);

    return response.data.access_token;
  }

  static async getConfig(apiKey: string): Promise<IConfigResponse> {
    try {
      let sellerAccessToken = TokenManager.getSellerToken();
      if (!sellerAccessToken) {
        sellerAccessToken = await this.authenticateSeller(apiKey);
      }
      const configResponse = await axios.get(`${API_BASE_URL}/seller/config`, {
        headers: {
          Authorization: `Bearer ${sellerAccessToken}`,
          "Content-Type": "application/json",
        },
        validateStatus: () => true, // handle errors manually
      });

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

  static async getContentMetadata(
    contentId: string
  ): Promise<IContentMetadata> {
    const seller_token = TokenManager.getSellerToken();
    const response: AxiosResponse<IContentMetadata> = await axios.get<IContentMetadata>(
      `${API_BASE_URL}/content/${contentId}/with-access`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${seller_token}`,
      },
      // We'll handle non-2xx statuses manually below
      validateStatus: () => true,
      timeout: 10_000,
    });

    return response.data;
  }

  static async getResetCode(email: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await axios.post<{
      message: string;
    }>(`${API_BASE_URL}/auth/password/reset-request`, { email });

    return response.data;
  }

  static async setNewPassword({
    email,
    newPassword,
    otp,
  }: {
    email: string;
    newPassword: string;
    otp: string;
  }): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await axios.post<{
      message: string;
    }>(`${API_BASE_URL}/auth/password/reset`, {
      email: email,
      password: newPassword,
      reset_code: otp,
    });

    return response.data;
  }

  /**
   * Sign up with email and password
   */
  static async signup(
    email: string,
    password: string,
    first_name: string,
    last_name: string
  ): Promise<AuthTokens> {
    const response = await ApiClient.post<AuthTokens>("/auth/signup", {
      email,
      password,
      first_name,
      last_name,
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
