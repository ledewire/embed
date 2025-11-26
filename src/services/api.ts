/**
 * Core API client for making HTTP requests to LedeWire API
 * Environment-aware configuration for dev/staging/production
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.ledewire.com/v1";

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
