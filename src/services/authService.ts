/**
 * Authentication Service - Handles login, signup, and OAuth flows
 */

import { getSdkClient } from "./sdkClient";

// Default key used by the SDK's sessionStorageAdapter (see @ledewire/browser index.js).
const TOKEN_STORAGE_KEY = "lw:tokens";

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_at: string;
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
  access_info: any;
}

export class AuthService {
  static async loginWithEmail(
    email: string,
    password: string,
  ): Promise<AuthTokens> {
    const response = await getSdkClient().auth.loginWithEmail({
      email,
      password,
    });
    return response as unknown as AuthTokens;
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
    const result = await getSdkClient().content.getWithAccess(contentId);
    return result as unknown as IContentMetadata;
  }

  /**
   * Search content by metadata (vimeo_id or external_url)
   * Returns the first matching content or undefined if none found
   */
  static async searchContentByMetadata(metadata: {
    vimeo_id?: string;
    external_url?: string;
  }): Promise<IContentMetadata | undefined> {
    // Note: metadata fields are untyped in SellerContentSearchRequest (SDK feedback #5).
    const results = await getSdkClient().seller.content.search({ metadata });
    if (results.length === 0) return undefined;
    return results[0] as unknown as IContentMetadata;
  }

  static async getResetCode(email: string): Promise<{ message: string }> {
    return getSdkClient().auth.requestPasswordReset({ email });
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
    return getSdkClient().auth.resetPassword({
      email,
      reset_code: otp,
      password: newPassword,
    });
  }

  static async signup(
    email: string,
    password: string,
    first_name: string,
    last_name: string,
  ): Promise<AuthTokens> {
    const response = await getSdkClient().auth.signup({
      email,
      password,
      first_name,
      last_name,
    });
    return response as unknown as AuthTokens;
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
