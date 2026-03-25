import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/preact";
import { App } from "./App";

vi.mock("@react-oauth/google", () => ({
  GoogleOAuthProvider: ({ children }: { children: any }) => children,
  GoogleLogin: () => null,
}));

vi.mock("./services/sdkClient", () => ({
  getSdkClient: vi.fn(),
  createSdkClient: vi.fn(),
}));

import { getSdkClient } from "./services/sdkClient";

const mockLw = {
  checkout: {
    state: vi.fn(),
  },
  wallet: {
    balance: vi.fn(),
  },
  purchases: {
    create: vi.fn(),
  },
};

const defaultConfig = {
  apiKey: "test-key",
  contentId: "content-123",
  creatorId: "creator-1",
  playerType: "vimeo",
  autoplay: false,
};

const defaultSellerConfig = {
  google_client_id: "test-google-client-id.apps.googleusercontent.com",
};

const defaultContentMetadata = {
  id: "content-123",
  content_type: "markdown" as const,
  title: "Test Article",
  price_cents: 199,
  content_body: "Body",
  teaser: "Teaser",
  visibility: "unlisted" as const,
  access_info: null,
};

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSdkClient).mockReturnValue(mockLw as any);
    mockLw.checkout.state.mockResolvedValue({
      content_id: "content-123",
      content_title: "Test Article",
      price_cents: 199,
      checkout_state: {
        is_authenticated: false,
        has_sufficient_funds: false,
        has_purchased: false,
        next_required_action: "authenticate",
      },
    });
    mockLw.wallet.balance.mockResolvedValue({ balance_cents: 0 });
  });

  it("renders overlay with purchase button when not authenticated", async () => {
    render(
      <App
        config={defaultConfig}
        sellerConfig={defaultSellerConfig}
        contentMetadata={defaultContentMetadata}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Access the full story/i)).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /Purchase Now/i }),
    ).toBeInTheDocument();
  });

  it("shows confirm modal when checkout state is purchase and user clicks buy", async () => {
    mockLw.checkout.state.mockResolvedValue({
      content_id: "content-123",
      content_title: "Test Article",
      price_cents: 199,
      checkout_state: {
        is_authenticated: true,
        has_sufficient_funds: true,
        has_purchased: false,
        next_required_action: "purchase",
      },
    });

    render(
      <App
        config={defaultConfig}
        sellerConfig={defaultSellerConfig}
        contentMetadata={defaultContentMetadata}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Access the full story/i)).toBeInTheDocument();
    });

    const purchaseButton = screen.getByRole("button", {
      name: /Purchase Now/i,
    });
    fireEvent.click(purchaseButton);

    await waitFor(() => {
      expect(mockLw.checkout.state).toHaveBeenCalledWith("content-123");
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Ready to purchase|Insufficient Funds/i),
      ).toBeInTheDocument();
    });
  });

  it("unlocks content when checkout state is view_content on mount", async () => {
    mockLw.checkout.state.mockResolvedValue({
      content_id: "content-123",
      content_title: "Test Article",
      price_cents: 199,
      checkout_state: {
        is_authenticated: true,
        has_sufficient_funds: true,
        has_purchased: true,
        next_required_action: "view_content",
      },
    });

    const onUnlock = vi.fn();

    render(
      <App
        config={defaultConfig}
        sellerConfig={defaultSellerConfig}
        contentMetadata={defaultContentMetadata}
        onUnlock={onUnlock}
      />,
    );

    await waitFor(
      () => {
        expect(onUnlock).toHaveBeenCalled();
      },
      { timeout: 3000 },
    );

    expect(
      screen.queryByText(/Access the full story/i),
    ).not.toBeInTheDocument();
  });

  it("resets to login modal when lw:auth-expired event fires", async () => {
    render(
      <App
        config={defaultConfig}
        sellerConfig={defaultSellerConfig}
        contentMetadata={defaultContentMetadata}
      />,
    );

    // Wait for initial render to settle on the overlay.
    await waitFor(() => {
      expect(screen.getByText(/Access the full story/i)).toBeInTheDocument();
    });

    window.dispatchEvent(new CustomEvent("lw:auth-expired"));

    await waitFor(() => {
      expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
    });
  });
});
