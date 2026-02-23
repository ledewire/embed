import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { waitFor } from '@testing-library/preact';
import { AuthService } from '../services/authService';

vi.mock('@react-oauth/google', () => ({
  GoogleOAuthProvider: ({ children }: { children: unknown }) => children,
  GoogleLogin: () => null,
}));

vi.mock('../services/authService', () => ({
  AuthService: {
    authenticateSeller: vi.fn(),
    getConfig: vi.fn(),
    searchContentByMetadata: vi.fn(),
  },
}));

vi.mock('../services/purchaseService', () => ({
  PurchaseService: {
    getWalletBalance: vi.fn(),
    verifyPurchase: vi.fn(),
    purchaseContent: vi.fn(),
  },
}));

vi.mock('../style.css?inline', () => ({
  default: '/* mock styles */',
}));

describe('vimeo-blocker entry', () => {
  let scriptEl: HTMLScriptElement;
  let iframeEl: HTMLIFrameElement;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AuthService.authenticateSeller).mockResolvedValue('seller-token');
    vi.mocked(AuthService.getConfig).mockResolvedValue({
      google_client_id: 'google-id',
    });
    vi.mocked(AuthService.searchContentByMetadata).mockResolvedValue({
      id: 'content-789',
      content_type: 'video',
      title: 'Test Video',
      price_cents: 299,
      content_body: '',
      teaser: '',
      visibility: 'premium',
      metadata: {},
      access_info: null,
    });

    scriptEl = document.createElement('script');
    scriptEl.dataset.apiKey = 'test-api-key';
    scriptEl.dataset.creatorId = 'creator-1';
    scriptEl.dataset.player = 'vimeo';
    document.body.appendChild(scriptEl);

    const wrapper = document.createElement('div');
    iframeEl = document.createElement('iframe');
    iframeEl.src = 'https://player.vimeo.com/video/12345678?h=abc';
    wrapper.appendChild(iframeEl);
    document.body.appendChild(wrapper);
  });

  afterEach(() => {
    scriptEl?.remove();
    iframeEl?.closest('div')?.remove();
    document.body.querySelectorAll('[style*="position: absolute"]').forEach((el) => el.remove());
  });

  it('finds vimeo iframe and creates overlay when content found', async () => {
    await import('./vimeo-blocker');

    await waitFor(
      () => {
        const container = document.body.querySelector(
          'div[style*="position: absolute"]'
        );
        expect(container).toBeInTheDocument();
        expect(container?.shadowRoot).toBeTruthy();
      },
      { timeout: 2000 }
    );

    expect(AuthService.authenticateSeller).toHaveBeenCalledWith('test-api-key');
    expect(AuthService.getConfig).toHaveBeenCalledWith('test-api-key');
    expect(AuthService.searchContentByMetadata).toHaveBeenCalledWith({
      vimeo_id: '12345678',
    });
  });

  it('does not create overlay when no vimeo iframe exists', async () => {
    iframeEl.closest('div')?.remove();

    await import('./vimeo-blocker');

    await new Promise((r) => setTimeout(r, 200));

    expect(AuthService.authenticateSeller).not.toHaveBeenCalled();
    expect(AuthService.searchContentByMetadata).not.toHaveBeenCalled();
  });
});
