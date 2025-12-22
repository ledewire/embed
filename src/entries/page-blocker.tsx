import { render } from "preact";
import { App } from "../App";
import style from "../style.css?inline";

(function () {
    function getScriptConfig() {
        const script =
            document.currentScript || document.querySelector("script[data-api-key]");

        if (!script || !(script instanceof HTMLScriptElement)) {
            return {};
        }

        return {
            apiKey: script.dataset.apiKey,
            contentId: script.dataset.contentId,
            creatorId: script.dataset.creatorId,
            matchPattern: script.dataset.matchPattern || ".*", // Default to match everything if not specified
        };
    }

    // Wait for body to be available
    function init() {
        if (!document.body) {
            window.addEventListener("DOMContentLoaded", init);
            return;
        }

        const config = getScriptConfig();

        // Check URL match
        // If specific pattern provided, check it. Otherwise assume block if this script is present.
        // User requirement: "detects the URL of the page and blocks the entire page"
        if (config.matchPattern) {
            try {
                const regex = new RegExp(config.matchPattern);
                if (!regex.test(window.location.href)) {
                    return; // Do not block if URL doesn't match
                }
            } catch (e) {
                console.error("Invalid match pattern:", e);
            }
        }

        // Create full page overlay
        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.top = "0";
        container.style.left = "0";
        container.style.width = "100vw";
        container.style.height = "100vh";
        container.style.zIndex = "2147483647"; // Max safe z-index
        container.style.backgroundColor = "rgba(255, 255, 255, 0.3)"; // Semi-transparent for blur effect
        container.style.backdropFilter = "blur(10px)";
        (container.style as any).webkitBackdropFilter = "blur(10px)"; // Safari support

        document.body.appendChild(container);
        document.body.style.overflow = "hidden"; // Prevent scrolling while blocked

        // Attach Shadow DOM or just render directly? Shadow DOM is safer for style isolation.
        const shadow = container.attachShadow({ mode: "open" });

        // Inject styles
        const styleTag = document.createElement("style");
        styleTag.textContent = style;
        shadow.appendChild(styleTag);

        // Create app root
        const appRoot = document.createElement("div");
        appRoot.style.width = "100%";
        appRoot.style.height = "100%";
        shadow.appendChild(appRoot);

        render(
            <App
                config={config as any}
                onUnlock={() => {
                    // Remove the overlay to unblock the page
                    container.remove();
                    document.body.style.overflow = ""; // Restore scrolling
                }}
            />,
            appRoot
        );
    }

    init();
})();
