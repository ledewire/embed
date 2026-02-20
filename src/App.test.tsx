import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { App } from './App';

vi.mock('@react-oauth/google', () => ({
  GoogleOAuthProvider: ({ children }: { children: any }) => children,
  GoogleLogin: () => null,
}));

vi.mock('./services/authService', () => ({
  AuthService: {
    ensureAuthenticated: vi.fn(),
    loginWithEmail: vi.fn(),
    loginWithGoogle: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: vi.fn(),
  },
}));

vi.mock('./services/purchaseService', () => ({
  PurchaseService: {
    getWalletBalance: vi.fn(),
    verifyPurchase: vi.fn(),
    purchaseContent: vi.fn(),
  },
}));

import { AuthService } from './services/authService';
import { PurchaseService } from './services/purchaseService';

const defaultConfig = {
  apiKey: 'test-key',
  contentId: 'content-123',
  creatorId: 'creator-1',
  playerType: 'vimeo',
  autoplay: false,
};

const defaultSellerConfig = {
  google_client_id: 'test-google-client-id.apps.googleusercontent.com',
};

const defaultContentMetadata = {
  id: 'content-123',
  content_type: 'article',
  title: 'Test Article',
  price_cents: 199,
  content_body: 'Body',
  teaser: 'Teaser',
  visibility: 'premium',
  metadata: {
    author: 'Author',
    publish_date: '2025-01-01',
    read_time: '5 min',
  },
  access_info: null,
};

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AuthService.ensureAuthenticated).mockResolvedValue(false);
    vi.mocked(PurchaseService.verifyPurchase).mockResolvedValue({
      has_purchased: false,
    });
    vi.mocked(PurchaseService.getWalletBalance).mockResolvedValue({
      balance_cents: 0,
    });
  });

  it('renders overlay with purchase button when not authenticated', async () => {
    render(
      <App
        config={defaultConfig}
        sellerConfig={defaultSellerConfig}
        contentMetadata={defaultContentMetadata}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Access the full story/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /Purchase Now/i })).toBeInTheDocument();
  });

  it('shows confirm modal when user is authenticated and clicks purchase', async () => {
    vi.mocked(AuthService.ensureAuthenticated).mockResolvedValue(true);

    render(
      <App
        config={defaultConfig}
        sellerConfig={defaultSellerConfig}
        contentMetadata={defaultContentMetadata}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Access the full story/i)).toBeInTheDocument();
    });

    const purchaseButton = screen.getByRole('button', { name: /Purchase Now/i });
    fireEvent.click(purchaseButton);

    await waitFor(() => {
      expect(AuthService.ensureAuthenticated).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(/Ready to purchase|Insufficient Funds/i)).toBeInTheDocument();
    });
  });

  it('unlocks content when already purchased', async () => {
    vi.mocked(AuthService.ensureAuthenticated).mockResolvedValue(true);
    vi.mocked(PurchaseService.verifyPurchase).mockResolvedValue({
      has_purchased: true,
    });

    const onUnlock = vi.fn();

    render(
      <App
        config={defaultConfig}
        sellerConfig={defaultSellerConfig}
        contentMetadata={defaultContentMetadata}
        onUnlock={onUnlock}
      />
    );

    await waitFor(
      () => {
        expect(onUnlock).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    expect(screen.queryByText(/Access the full story/i)).not.toBeInTheDocument();
  });
});
