/**
 * Purchase Service - Handles content purchases and wallet operations
 */

import { ApiClient } from "./api";

export interface PurchaseRequest {
  content_id: string;
  price_cents: number;
}

export interface PurchaseResponse {
  id: string;
  content_id: string;
  buyer_id: string;
  seller_id: string;
  amount_cents: number;
  timestamp: string;
  status: "completed" | "refunded";
}

export interface WalletBalanceResponse {
  balance_cents: number;
}

export class PurchaseService {
  /**
   * Get wallet balance
   */
  static async getWalletBalance(): Promise<WalletBalanceResponse> {
    return await ApiClient.get<WalletBalanceResponse>("/wallet/balance", true);
  }

  /**
   * Purchase content
   */
  static async purchaseContent(
    contentId: string,
    priceCents: number
  ): Promise<PurchaseResponse> {
    return await ApiClient.post<PurchaseResponse>(
      "/purchases",
      {
        content_id: contentId,
        price_cents: priceCents,
      },
      true
    );
  }

  /**
   * Verify if content has been purchased
   */
  static async verifyPurchase(
    contentId: string
  ): Promise<{ has_purchased: boolean }> {
    return await ApiClient.get<{ has_purchased: boolean }>(
      `/purchase/verify?content_id=${contentId}`,
      true
    );
  }
}



