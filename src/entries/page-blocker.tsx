import { render } from "preact";
import { App } from "../App";
import { AuthService } from "../services/authService";
import style from "../style.css?inline";

(function () {
  async function hashUrlWithApiKey(
    url: string,
    apiKey: string
  ): Promise<string> {
    const combined = `${url}:${apiKey}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function getPageScript() {
    const script =
      document.currentScript || document.querySelector("script[data-api-key]");

    if (!script || !(script instanceof HTMLScriptElement)) {
      return null;
    }

    return script;
  }

  async function getScriptConfig() {
    const script = getPageScript();

    if (!script) {
      return {};
    }

    const apiKey = script.dataset.apiKey;
    let contentId: string | undefined = undefined;

    // Calculate contentId by hashing URL with apiKey
    if (apiKey) {
      try {
        contentId = await hashUrlWithApiKey(window.location.href, apiKey);
      } catch (e) {
        console.error("Failed to hash URL with apiKey:", e);
      }
    }

    return {
      apiKey,
      contentId,
      creatorId: script.dataset.creatorId,
      matchPattern: script.dataset.matchPattern || ".*", // Default to match everything if not specified
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

      // 3. Get Content Metadata
      let contentMetadata = undefined;
      if (config.contentId) {
        try {
          contentMetadata = await AuthService.getContentMetadata(
            config.contentId
          );
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
          appRoot
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
