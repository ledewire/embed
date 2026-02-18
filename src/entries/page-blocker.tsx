import { render } from "preact";
import { App } from "../App";
import { AuthService } from "../services/authService";
import style from "../style.css?inline";

(function () {
  function getPageScript() {
    const script =
      document.currentScript || document.querySelector("script[data-api-key]");

    if (!script || !(script instanceof HTMLScriptElement)) {
      return null;
    }

    return script;
  }

  function getScriptConfig() {
    const script = getPageScript();

    if (!script) {
      return {};
    }

    // Prefer script data-api-key; if missing or placeholder, use .env (VITE_API_KEY) for local dev
    const placeholder = "YOUR_PUBLISHABLE_API_KEY";
    const scriptKey = script.dataset.apiKey;
    const apiKey =
      scriptKey && scriptKey !== placeholder
        ? scriptKey
        : (import.meta.env.VITE_API_KEY ?? scriptKey ?? undefined);

    // Optional data-external-url override: for testing when dev port differs from backend (e.g. 5174 vs 5173).
    // Default to origin+pathname to avoid sending sensitive query params (campaign ids, tokens, etc.) to the backend.
    const externalUrl =
      script.dataset.externalUrl ??
      `${window.location.origin}${window.location.pathname}`;

    return {
      apiKey,
      externalUrl,
      creatorId: script.dataset.creatorId,
      matchPattern: script.dataset.matchPattern || ".*", // Default to match everything if not specified
      contentId: undefined as string | undefined,
    };
  }

  // Wait for body to be available
  async function init() {
    if (!document.body) {
      window.addEventListener("DOMContentLoaded", init);
      return;
    }

    const config = await getScriptConfig();

    // Locate script element
    const scriptEl = getPageScript();

    if (!scriptEl) {
      return;
    }

    // Create container (same as before)
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "0";
    container.style.width = "100vw";
    container.style.height = "100vh";
    container.style.zIndex = "2147483647";
    container.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
    container.style.backdropFilter = "blur(10px)";
    (container.style as any).webkitBackdropFilter = "blur(10px)";

    document.body.appendChild(container);
    document.body.style.overflow = "hidden";

    const shadow = container.attachShadow({ mode: "open" });

    const styleTag = document.createElement("style");
    styleTag.textContent = style;
    shadow.appendChild(styleTag);

    const appRoot = document.createElement("div");
    appRoot.style.width = "100%";
    appRoot.style.height = "100%";
    shadow.appendChild(appRoot);

    try {
      // 1. Authenticate Seller
      if (config.apiKey) {
        await AuthService.authenticateSeller(config.apiKey);
      }

      // 2. Get Seller Config
      let sellerConfig = null;
      if (config.apiKey) {
        try {
          sellerConfig = await AuthService.getConfig(config.apiKey);
        } catch (e) {
          console.error("Failed to get seller config:", e);
        }
      }

      // 3. Get Content Metadata by searching with external_url
      let contentMetadata = undefined;
      if (config.externalUrl) {
        try {
          contentMetadata = await AuthService.searchContentByMetadata({
            external_url: config.externalUrl,
          });
          // Extract the actual content ID from metadata for purchase operations
          if (contentMetadata) {
            config.contentId = contentMetadata.id;
          }
        } catch (e) {
          console.error("Failed to get content metadata:", e);
        }
      }

      if (contentMetadata) {
        render(
          <App
            config={config as any}
            sellerConfig={sellerConfig}
            contentMetadata={contentMetadata}
            onUnlock={() => {
              container.remove();
              document.body.style.overflow = "";
            }}
          />,
          appRoot,
        );
      }
    } catch (error) {
      console.error("Initialization failed:", error);
      // Optionally remove the blocker if auth fails completely?
      // container.remove();
      // document.body.style.overflow = "";
    }
  }

  init();
})();
