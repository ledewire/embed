import { h, render } from 'preact';
import { App } from './App';
import style from './style.css?inline'; // Import CSS as inline string

(function () {
    console.log('LedeWire Embed Script Loaded');

    function getScriptConfig() {
        const script = document.currentScript || document.querySelector('script[data-content-id]');

        if (!script || !(script instanceof HTMLScriptElement)) {
            console.warn('LedeWire: Configuration script tag not found.');
            return {};
        }

        return {
            contentId: script.dataset.contentId,
            price: script.dataset.price,
            creatorId: script.dataset.creatorId,
            playerType: script.dataset.player,
            autoplay: script.dataset.autoplay === 'true'
        };
    }

    const config = getScriptConfig();

    // Locate video element
    let videoEl: HTMLElement | null = null;
    if (config.playerType === 'vimeo') {
        videoEl = document.querySelector('iframe[src*="vimeo.com"]');
    } else {
        videoEl = document.querySelector('video');
    }

    // Helper to pause video
    function pauseVideo(videoEl: HTMLElement) {
        if (videoEl.tagName === 'IFRAME') {
            // Vimeo Player API via postMessage
            const iframe = videoEl as HTMLIFrameElement;
            const url = iframe.src;
            // Send pause command repeatedly to ensure it catches the player when ready
            const pauseCmd = JSON.stringify({ method: 'pause' });

            // Send immediately
            iframe.contentWindow?.postMessage(pauseCmd, '*');

            // And retry a few times in case player is loading
            const interval = setInterval(() => {
                iframe.contentWindow?.postMessage(pauseCmd, '*');
            }, 500);

            // Clear interval after 5 seconds
            setTimeout(() => clearInterval(interval), 5000);

        } else if (videoEl.tagName === 'VIDEO') {
            (videoEl as HTMLVideoElement).pause();
        }
    }

    if (videoEl) {
        pauseVideo(videoEl);
    } else {
        console.warn('LedeWire: No video player found.');
        // We still render the overlay even if video not found immediately, 
        // or we could retry finding it. For now, let's proceed.
    }

    // Create container for our app
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.zIndex = '9999';
    container.style.pointerEvents = 'auto'; // Ensure clicks go to us

    // Ensure parent is relative so absolute positioning works
    if (videoEl.parentElement) {
        const parentStyle = window.getComputedStyle(videoEl.parentElement);
        if (parentStyle.position === 'static') {
            videoEl.parentElement.style.position = 'relative';
        }
        videoEl.parentElement.appendChild(container);
    }

    // Attach Shadow DOM
    const shadow = container.attachShadow({ mode: 'open' });

    // Inject Styles
    const styleTag = document.createElement('style');
    styleTag.textContent = style;
    shadow.appendChild(styleTag);

    // Mount Preact App
    const appRoot = document.createElement('div');
    appRoot.style.height = '100%';
    shadow.appendChild(appRoot);

    render(<App config={config as any} />, appRoot);

})();
