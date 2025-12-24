import { render } from "preact";
import { App } from "../App";
import { AuthService } from "../services/authService";
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
    async function init() {
        if (!document.body) {
            window.addEventListener("DOMContentLoaded", init);
            return;
        }

        const config = getScriptConfig();

        // Check URL match
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
                    contentMetadata = await AuthService.getContentMetadata(config.contentId);
                } catch (e) {
                    console.error("Failed to get content metadata:", e);
                }
            }

            render(
                <App
                    config={config as any}
                    sellerConfig={sellerConfig}
                    contentMetadata={contentMetadata || undefined}
                    onUnlock={() => {
                        container.remove();
                        document.body.style.overflow = "";
                    }}
                />,
                appRoot
            );

        } catch (error) {
            console.error("Initialization failed:", error);
            // Optionally remove the blocker if auth fails completely?
            // container.remove();
            // document.body.style.overflow = "";
        }
    }

    init();
})();
