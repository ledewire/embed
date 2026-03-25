import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { waitFor } from "@testing-library/preact";
import { createSdkClient, getSdkClient } from "../services/sdkClient";

vi.mock("@react-oauth/google", () => ({
  GoogleOAuthProvider: ({ children }: { children: unknown }) => children,
  GoogleLogin: () => null,
}));

vi.mock("../services/sdkClient", () => ({
  createSdkClient: vi.fn(),
  getSdkClient: vi.fn(),
}));

const mockLw = {
  config: { getPublic: vi.fn() },
  seller: { content: { search: vi.fn() } },
};

vi.mock("../style.css?inline", () => ({
  default: "/* mock styles */",
}));

describe("page-blocker entry", () => {
  let scriptEl: HTMLScriptElement;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createSdkClient).mockResolvedValue({} as any);
    vi.mocked(getSdkClient).mockReturnValue(mockLw as any);
    mockLw.config.getPublic.mockResolvedValue({
      google_client_id: "google-id",
    });
    mockLw.seller.content.search.mockResolvedValue([
      {
        id: "content-456",
        content_type: "article",
        title: "Test",
        price_cents: 99,
        content_body: "",
        teaser: "",
        visibility: "premium",
        metadata: {},
        access_info: null,
      },
    ]);

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

    expect(createSdkClient).toHaveBeenCalledWith("test-api-key");
    expect(mockLw.config.getPublic).toHaveBeenCalled();
    expect(mockLw.seller.content.search).toHaveBeenCalledWith({
      uri: "https://example.com/article",
    });
  });
});

