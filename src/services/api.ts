/**
 * Core API client for making HTTP requests to LedeWire API
 * Supports both direct API calls and WordPress proxy
 * Environment-aware configuration for dev/staging/production
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.ledewire.com/v1";
const USE_WP_PROXY = import.meta.env.VITE_USE_WP_PROXY === "true";
const WP_PROXY_URL = import.meta.env.VITE_WP_PROXY_URL || "";

export interface ApiError {
  error: string | { code?: number; message: string };
}

export class ApiClient {
  private static getHeaders(includeAuth = false): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (includeAuth) {
      const token = localStorage.getItem("access_token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(
        typeof error.error === "string" ? error.error : error.error.message
      );
    }

    return response.json();
  }

  static async get<T>(endpoint: string, includeAuth = false): Promise<T> {
    // Auto-refresh token if expired
    if (includeAuth) {
      await this.refreshTokenIfNeeded();
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers: this.getHeaders(includeAuth),
      mode: "cors",
      credentials: includeAuth ? "include" : "omit",
    });

    return this.handleResponse<T>(response);
  }

  static async post<T>(
    endpoint: string,
    data: any,
    includeAuth = false
  ): Promise<T> {
    // Auto-refresh token if expired
    if (includeAuth) {
      await this.refreshTokenIfNeeded();
    }

    // Use WordPress proxy if configured
    if (USE_WP_PROXY && WP_PROXY_URL) {
      return this.postViaWordPressProxy<T>(endpoint, data, includeAuth);
    }

    // Direct API call
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: this.getHeaders(includeAuth),
      body: JSON.stringify(data),
      mode: "cors",
      credentials: includeAuth ? "include" : "omit",
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Check if access token is expired and refresh if needed
   */
  private static async refreshTokenIfNeeded(): Promise<void> {
    const { TokenManager } = await import("./tokenManager");

    if (TokenManager.isTokenExpired()) {
      try {
        await TokenManager.refreshAccessToken();
      } catch (error) {
        TokenManager.clearTokens();
        throw new Error("Session expired. Please login again.");
      }
    }
  }

  /**
   * Make API request via WordPress proxy (avoids CORS)
   */
  private static async postViaWordPressProxy<T>(
    endpoint: string,
    data: any,
    includeAuth = false
  ): Promise<T> {
    const formData = new FormData();
    formData.append("action", "ledewire_proxy");
    formData.append("endpoint", endpoint);
    formData.append("method", "POST");
    formData.append("body", JSON.stringify(data));

    // Add nonce if available (for WordPress security)
    const nonce = (window as any).ledewire_nonce;
    if (nonce) {
      formData.append("nonce", nonce);
    }

    // Add auth token if needed
    if (includeAuth) {
      const token = localStorage.getItem("access_token");
      if (token) {
        formData.append("auth_token", token);
      }
    }

    const response = await fetch(WP_PROXY_URL, {
      method: "POST",
      body: formData,
      credentials: "same-origin",
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(
        typeof error.error === "string" ? error.error : error.error.message
      );
    }

    // WordPress wraps responses in { success: true, data: {...} }
    const wpResponse = await response.json();

    if (wpResponse.success) {
      return wpResponse.data as T;
    } else {
      // Handle WordPress error format
      const errorMsg = wpResponse.data?.error || "Request failed";
      throw new Error(errorMsg);
    }
  }

  static async put<T>(
    endpoint: string,
    data: any,
    includeAuth = false
  ): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: this.getHeaders(includeAuth),
      body: JSON.stringify(data),
      mode: "cors",
      credentials: includeAuth ? "include" : "omit",
    });

    return this.handleResponse<T>(response);
  }

  static async delete<T>(endpoint: string, includeAuth = false): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers: this.getHeaders(includeAuth),
      mode: "cors",
      credentials: includeAuth ? "include" : "omit",
    });

    return this.handleResponse<T>(response);
  }
}
