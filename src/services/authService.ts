/**
 * Authentication Service - Handles login, signup, and OAuth flows
 */

import type {
  AuthenticationResponse,
  ContentWithAccessResponse,
  ContentResponse,
} from "@ledewire/browser";
import { getSdkClient } from "./sdkClient";

// Default key used by the SDK's sessionStorageAdapter (see @ledewire/browser index.js).
const TOKEN_STORAGE_KEY = "lw:tokens";

// Re-export SDK types so callers don't need to import @ledewire/browser directly.
export type AuthTokens = AuthenticationResponse;
export type IContentMetadata = ContentWithAccessResponse;
export type IContentSearchResult = ContentResponse;

export class AuthService {
  static async loginWithEmail(
    email: string,
    password: string,
  ): Promise<AuthTokens> {
    return getSdkClient().auth.loginWithEmail({ email, password });
  }

  static async loginWithGoogle(idToken: string): Promise<void> {
    await getSdkClient().auth.loginWithGoogle({ id_token: idToken });
  }

  // _apiKey retained for call-site compatibility; SDK uses the key from init().
  static async getConfig(
    _apiKey: string,
  ): Promise<{ google_client_id: string }> {
    return getSdkClient().config.getPublic();
  }

  static async getContentMetadata(
    contentId: string,
  ): Promise<IContentMetadata> {
    return getSdkClient().content.getWithAccess(contentId);
  }

  /**
   * Search content by metadata (uri or external_identifier)
   * Returns the first matching content or undefined if none found
   */
  static async searchContentByMetadata(params: {
    uri?: string;
    external_identifier?: string;
  }): Promise<IContentSearchResult | undefined> {
    const results = await getSdkClient().seller.content.search(params);
    if (results.length === 0) return undefined;
    return results[0];
  }

  static async signup(
    email: string,
    password: string,
    first_name: string,
    last_name: string,
  ): Promise<AuthTokens> {
    return getSdkClient().auth.signup({
      email,
      password,
      name: `${first_name} ${last_name}`.trim(),
    });
  }

  static logout(): void {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  static isAuthenticated(): boolean {
    const raw = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return false;
    try {
      const { expiresAt } = JSON.parse(raw) as { expiresAt: number };
      return Date.now() < expiresAt;
    } catch {
      return false;
    }
  }

  // Phase 4 will replace all callers with lw.checkout.state().
  static async ensureAuthenticated(): Promise<boolean> {
    return AuthService.isAuthenticated();
  }
}

