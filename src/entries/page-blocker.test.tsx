import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { waitFor } from "@testing-library/preact";
import { AuthService } from "../services/authService";

vi.mock("@react-oauth/google", () => ({
  GoogleOAuthProvider: ({ children }: { children: unknown }) => children,
  GoogleLogin: () => null,
}));

vi.mock("../services/authService", () => ({
  AuthService: {
    authenticateSeller: vi.fn(),
    getConfig: vi.fn(),
    searchContentByMetadata: vi.fn(),
  },
}));

vi.mock("../services/purchaseService", () => ({
  PurchaseService: {
    getWalletBalance: vi.fn(),
    verifyPurchase: vi.fn(),
    purchaseContent: vi.fn(),
  },
}));

vi.mock("../style.css?inline", () => ({
  default: "/* mock styles */",
}));

describe("page-blocker entry", () => {
  let scriptEl: HTMLScriptElement;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AuthService.authenticateSeller).mockResolvedValue("seller-token");
    vi.mocked(AuthService.getConfig).mockResolvedValue({
      google_client_id: "google-id",
    });
    vi.mocked(AuthService.searchContentByMetadata).mockResolvedValue({
      id: "content-456",
      content_type: "article",
      title: "Test",
      price_cents: 99,
      content_body: "",
      teaser: "",
      visibility: "premium",
      metadata: { author: "", publish_date: "", read_time: "" },
      access_info: null,
    });

    scriptEl = document.createElement("script");
    scriptEl.dataset.apiKey = "test-api-key";
    scriptEl.dataset.externalUrl = "https://example.com/article";
    scriptEl.dataset.creatorId = "creator-1";
    document.body.appendChild(scriptEl);
  });

  afterEach(() => {
    scriptEl?.remove();
    document.body
      .querySelectorAll('div[style*="position: fixed"]')
      .forEach((el) => el.remove());
    document.body.style.overflow = "";
  });

  it("finds script with data-api-key and creates overlay when content found", async () => {
    await import("./page-blocker");

    await waitFor(
      () => {
        const container = document.body.querySelector(
          'div[style*="position: fixed"]',
        );
        expect(container).toBeInTheDocument();
        expect(container?.shadowRoot).toBeTruthy();
      },
      { timeout: 2000 },
    );

    expect(AuthService.authenticateSeller).toHaveBeenCalledWith("test-api-key");
    expect(AuthService.getConfig).toHaveBeenCalledWith("test-api-key");
    expect(AuthService.searchContentByMetadata).toHaveBeenCalledWith({
      external_url: "https://example.com/article",
    });
  });
});
