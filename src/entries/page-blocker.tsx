import { render } from "preact";
import { App } from "../App";
import { createSdkClient, getSdkClient } from "../services/sdkClient";
import style from "../style.css?inline";

(function () {
  const SCRIPT_SELECTOR = 'script[src*="page-blocker.iife.js"]';
  const DEFAULT_SCROLL_THRESHOLD = 0.7;

  function getParamsFromSrc(src: string): { trigger: string | null; scrollThreshold: string | null } {
    try {
      const base = typeof window !== "undefined" && window.location ? window.location.origin : "";
      const url = new URL(src, base);
      return {
        trigger: url.searchParams.get("trigger"),
        scrollThreshold: url.searchParams.get("scrollThreshold"),
      };
    } catch {
      return { trigger: null, scrollThreshold: null };
    }
  }

  function parseThreshold(raw: string | null | undefined): number {
    const t = parseFloat(raw ?? "");
    return Number.isFinite(t) ? t : DEFAULT_SCROLL_THRESHOLD;
  }

  function getPageScript(): HTMLScriptElement | null {
    const byAttr = document.querySelector(`${SCRIPT_SELECTOR}[data-trigger="scroll"]`);
    const byUrl = Array.from(document.querySelectorAll(SCRIPT_SELECTOR)).find(
      (s) => s instanceof HTMLScriptElement && getParamsFromSrc(s.src).trigger === "scroll"
    );
    const script =
      (byAttr ?? byUrl) as HTMLScriptElement | null ??
      document.currentScript ??
      document.querySelector(SCRIPT_SELECTOR) ??
      document.querySelector("script[data-api-key]");

    return script instanceof HTMLScriptElement ? script : null;
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

  type TriggerConfig = { mode: "scroll"; threshold: number } | { mode: "immediate" };

  function getTriggerConfig(): TriggerConfig {
    try {
      const global = (window as Window & { EMBED_PAGE_BLOCKER_CONFIG?: { trigger?: string; scrollThreshold?: number | string } }).EMBED_PAGE_BLOCKER_CONFIG;
      if (global && typeof global === "object" && global.trigger === "scroll") {
        const raw = global.scrollThreshold != null ? String(global.scrollThreshold) : undefined;
        return { mode: "scroll", threshold: parseThreshold(raw) };
      }
    } catch {
      /* ignore */
    }
    const scripts = document.querySelectorAll(SCRIPT_SELECTOR);
    for (const s of scripts) {
      if (!(s instanceof HTMLScriptElement)) continue;
      const trigger = s.dataset.trigger ?? getParamsFromSrc(s.src).trigger;
      if (trigger === "scroll") {
        const raw = s.dataset.scrollThreshold ?? getParamsFromSrc(s.src).scrollThreshold;
        return { mode: "scroll", threshold: parseThreshold(raw) };
      }
    }
    const script = getPageScript();
    if (!script) return { mode: "immediate" };
    const trigger = script.dataset.trigger ?? getParamsFromSrc(script.src).trigger ?? "immediate";
    if (trigger === "scroll") {
      const raw = script.dataset.scrollThreshold ?? getParamsFromSrc(script.src).scrollThreshold;
      return { mode: "scroll", threshold: parseThreshold(raw) };
    }
    return { mode: "immediate" };
  }

  function waitForScrollThenInit(threshold: number) {
    let done = false;
    const opts: AddEventListenerOptions = { passive: true };
    function check() {
      if (done) return;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      if (window.scrollY / maxScroll >= threshold) {
        done = true;
        window.removeEventListener("scroll", check, opts);
        init();
      }
    }
    window.addEventListener("scroll", check, opts);
    check();
  }

  function bootstrap() {
    if (!document.body) {
      window.addEventListener("DOMContentLoaded", bootstrap);
      return;
    }
    setTimeout(() => {
      const config = getTriggerConfig();
      if (config.mode === "scroll") {
        waitForScrollThenInit(config.threshold);
      } else {
        init();
      }
    }, 0);
  }

  // Initialize the blocker (creates overlay, auth, render)
  async function init() {
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
        await createSdkClient(config.apiKey);
      }

      // 2. Get Seller Config
      let sellerConfig = null;
      try {
        sellerConfig = await getSdkClient().config.getPublic();
      } catch (e) {
        console.error("Failed to get seller config:", e);
      }

      // 3. Get Content Metadata by searching with external_identifier (uri)
      let contentMetadata = undefined;
      if (config.externalUrl) {
        try {
          const results = await getSdkClient().seller.content.search({
            uri: config.externalUrl,
          });
          contentMetadata = results[0];
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

  bootstrap();
})();
