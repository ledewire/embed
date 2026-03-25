import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@ledewire/browser", () => ({
  init: vi.fn(),
  sessionStorageAdapter: vi.fn(() => ({})),
}));

import { init } from "@ledewire/browser";
import { createSdkClient, getSdkClient } from "./sdkClient";

describe("sdkClient", () => {
  let capturedConfig: any;
  const mockLw = {
    seller: { loginWithApiKey: vi.fn().mockResolvedValue(undefined) },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(init).mockImplementation((config: any) => {
      capturedConfig = config;
      return mockLw as any;
    });
  });

  describe("createSdkClient", () => {
    it("initialises the SDK with the provided api key and session storage", async () => {
      await createSdkClient("my-api-key");

      expect(init).toHaveBeenCalledWith(
        expect.objectContaining({ apiKey: "my-api-key" }),
      );
      expect(mockLw.seller.loginWithApiKey).toHaveBeenCalledWith({
        key: "my-api-key",
      });
    });

    it("dispatches lw:auth-expired on window when onAuthExpired is called", async () => {
      await createSdkClient("my-api-key");

      const listener = vi.fn();
      window.addEventListener("lw:auth-expired", listener);
      capturedConfig.onAuthExpired();
      window.removeEventListener("lw:auth-expired", listener);

      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe("getSdkClient", () => {
    it("returns the client after createSdkClient", async () => {
      await createSdkClient("my-api-key");
      expect(getSdkClient()).toBe(mockLw);
    });
  });
});
