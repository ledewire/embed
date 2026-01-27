import { render } from "preact";
import { App } from "../App";
import { AuthService } from "../services/authService";
import style from "../style.css?inline"; // Import CSS as inline string

(async function () {
  function getVimeoVideoId() {
    const iframe = document.querySelector(
      "iframe[src*='player.vimeo.com/video']"
    ) as HTMLIFrameElement | null;
    if (!iframe) return null;

    const src = iframe.src; // full URL

    // Match the ID between /video/ and ?...
    const match = src.match(/video\/([^?]+)/);

    return match ? match[1] : null;
  }

  function getScriptConfig() {
    const script =
      document.currentScript || document.querySelector("script[data-api-key]");

    if (!script || !(script instanceof HTMLScriptElement)) {
      return {};
    }

    const detectedVideoId = getVimeoVideoId();
    // const detectedVideoId = "972e539f-effd-4bd3-b550-0b94b421118f"; // FOR TESTING PURPOSE ONLY
    return {
      apiKey: script.dataset.apiKey,
      contentId: detectedVideoId,
      creatorId: script.dataset.creatorId,
      playerType: script.dataset.player,
      autoplay: script.dataset.autoplay === "true",
    };
  }

  const config = getScriptConfig();

  // Locate video element
  let videoEl: HTMLElement | null = null;
  if (config.playerType === "vimeo") {
    videoEl = document.querySelector('iframe[src*="vimeo.com"]');
  } else {
    videoEl = document.querySelector("video");
  }

  // Helper to pause video
  function pauseVideo(videoEl: HTMLElement) {
    if (videoEl.tagName === "IFRAME") {
      // Vimeo Player API via postMessage
      const iframe = videoEl as HTMLIFrameElement;
      // Send pause command repeatedly to ensure it catches the player when ready
      const pauseCmd = JSON.stringify({ method: "pause" });

      // Send immediately
      iframe.contentWindow?.postMessage(pauseCmd, "https://player.vimeo.com");

      // And retry a few times in case player is loading
      const interval = setInterval(() => {
        iframe.contentWindow?.postMessage(pauseCmd, "https://player.vimeo.com");
      }, 500);

      // Clear interval after 5 seconds
      setTimeout(() => clearInterval(interval), 5000);
    } else if (videoEl.tagName === "VIDEO") {
      (videoEl as HTMLVideoElement).pause();
    }
  }

  // Helper to play video
  function playVideo(videoEl: HTMLElement) {
    // Enable interaction
    videoEl.style.pointerEvents = "auto";

    if (videoEl.tagName === "IFRAME") {
      const iframe = videoEl as HTMLIFrameElement;
      const playCmd = JSON.stringify({ method: "play" });
      iframe.contentWindow?.postMessage(playCmd, "https://player.vimeo.com");
    } else if (videoEl.tagName === "VIDEO") {
      (videoEl as HTMLVideoElement).play();
    }
  }

  if (!videoEl) {
    return;
  }

  // Disable interaction immediately
  videoEl.style.pointerEvents = "none";

  // Pause the video
  pauseVideo(videoEl);

  // Ensure parent container has relative positioning for absolute overlay
  const parent = videoEl.parentElement;
  if (!parent) {
    return;
  }

  const parentStyle = window.getComputedStyle(parent);
  if (parentStyle.position === "static") {
    parent.style.position = "relative";
  }

  // Create overlay container that sits on top of the video
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = "100%";
  container.style.height = "100%";
  container.style.zIndex = "9999";
  container.style.pointerEvents = "auto";

  // Append container to the same parent as video
  parent.appendChild(container);

  // Attach Shadow DOM for style isolation
  const shadow = container.attachShadow({ mode: "open" });

  // Inject Tailwind CSS into Shadow DOM
  const styleTag = document.createElement("style");
  styleTag.textContent = style;
  shadow.appendChild(styleTag);

  // Create app root inside shadow DOM
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

    // 3. Get Content Metadata by searching with vimeo_id
    let contentMetadata = undefined;
    if (config.contentId) {
      try {
        contentMetadata = await AuthService.searchContentByMetadata({
          vimeo_id: config.contentId,
        });
        // Extract the actual content ID from metadata for purchase operations
        if (contentMetadata) {
          config.contentId = contentMetadata.id;
        }
      } catch (e) {
        console.error("Failed to get content metadata:", e);
      }
    }

    // Render Preact app with playVideo callback
    render(
      <App
        config={config as any}
        sellerConfig={sellerConfig}
        contentMetadata={contentMetadata}
        onUnlock={() => {
          playVideo(videoEl!);
          // Remove overlay container to allow video interaction
          setTimeout(() => {
            container.remove();
          }, 300);
        }}
      />,
      appRoot
    );
  } catch (error) {
    console.error("Initialization failed:", error);
  }
})();
