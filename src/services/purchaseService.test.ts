import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PurchaseService } from './purchaseService';
import { ApiClient } from './api';

vi.mock('./api');

describe('PurchaseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getWalletBalance', () => {
    it('returns wallet balance from API', async () => {
      vi.mocked(ApiClient.get).mockResolvedValue({
        balance_cents: 1000,
      });

      const result = await PurchaseService.getWalletBalance();

      expect(result).toEqual({ balance_cents: 1000 });
      expect(ApiClient.get).toHaveBeenCalledWith(
        '/wallet/balance',
        true
      );
    });
  });

  describe('purchaseContent', () => {
    it('purchases content and returns response', async () => {
      const mockResponse = {
        id: 'purchase-1',
        content_id: 'content-123',
        buyer_id: 'buyer-1',
        seller_id: 'seller-1',
        amount_cents: 99,
        timestamp: new Date().toISOString(),
        status: 'completed' as const,
      };
      vi.mocked(ApiClient.post).mockResolvedValue(mockResponse);

      const result = await PurchaseService.purchaseContent(
        'content-123',
        99
      );

      expect(result).toEqual(mockResponse);
      expect(ApiClient.post).toHaveBeenCalledWith(
        '/purchases',
        { content_id: 'content-123', price_cents: 99 },
        true
      );
    });
  });

  describe('verifyPurchase', () => {
    it('returns has_purchased true when purchased', async () => {
      vi.mocked(ApiClient.get).mockResolvedValue({
        has_purchased: true,
      });

      const result = await PurchaseService.verifyPurchase('content-123');

      expect(result.has_purchased).toBe(true);
      expect(ApiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('content_id=content-123'),
        true
      );
    });

    it('returns has_purchased false when not purchased', async () => {
      vi.mocked(ApiClient.get).mockResolvedValue({
        has_purchased: false,
      });

      const result = await PurchaseService.verifyPurchase('content-456');

      expect(result.has_purchased).toBe(false);
    });
  });

  describe('createPaymentSession', () => {
    it('creates payment session with amount', async () => {
      const mockResponse = {
        client_secret: 'secret',
        session_id: 'session-1',
        public_key: 'pk_test',
      };
      vi.mocked(ApiClient.post).mockResolvedValue(mockResponse);

      const result = await PurchaseService.createPaymentSession(500);

      expect(result).toEqual(mockResponse);
      expect(ApiClient.post).toHaveBeenCalledWith(
        '/wallet/payment-session',
        { amount_cents: 500, currency: 'usd' },
        true
      );
    });
  });
});
