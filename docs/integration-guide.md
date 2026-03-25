# @ledewire/gate — Integration Guide

This guide covers everything needed to add a LedeWire paywall to your website using the embed script. No JavaScript knowledge is required beyond copy-pasting a `<script>` tag.

---

## Prerequisites

Before integrating the embed:

1. **A LedeWire account** — sign up at [ledewire.com](https://ledewire.com)
2. **A publishable API key** — found in your creator dashboard under **Settings → API Keys**
3. **Content registered in the LedeWire dashboard** — each piece of content you want to paywall must be created in the dashboard with a title and price before the embed can find it

---

## Choosing the Right Embed

There are two embed scripts. Choose based on what you're paywalling:

| Embed | File | Use for |
|---|---|---|
| **Vimeo Blocker** | `vimeo-blocker.iife.js` | A Vimeo video embedded via `<iframe>` |
| **Page Blocker** | `page-blocker.iife.js` | An article, written content, or any full page |

---

## CDN URLs

Replace `<version>` with the release tag you want to pin to (e.g. `v1.0.0`):

```
https://cdn.jsdelivr.net/gh/ledewire/embed@0/dist/vimeo-blocker.iife.js
https://cdn.jsdelivr.net/gh/ledewire/embed@0/dist/page-blocker.iife.js
```

Always pin to a specific version in production. See [Version Pinning](#version-pinning) below.

---

## Vimeo Blocker

### How It Works

1. On page load, the script finds the Vimeo `<iframe>` on the page and immediately disables interaction with it
2. The Vimeo Player API sends repeated `pause` commands (retries for 5 seconds to handle slow-loading players)
3. A paywall overlay is positioned directly on top of the iframe
4. The viewer authenticates and purchases; on success, the overlay is removed, and the video plays

### Setup in the LedeWire Dashboard

Before the script tag will work, register your video:

1. Go to **Content → New Content**
2. Set the content type to **Video** / **External Ref**
3. Set the **External Identifier** field to `vimeo:` followed by your Vimeo video ID — e.g. `vimeo:123456789` (the numeric ID from your Vimeo URL)
4. Set a price and publish

The embed auto-detects the Vimeo ID from the iframe's `src` attribute and looks up content by that identifier — you do not pass the ID manually in the script tag.

### Script Tag

Place this tag anywhere on the page **after** the Vimeo iframe, ideally just before `</body>`:

```html
<script
  src="https://cdn.jsdelivr.net/gh/ledewire/embed@0/dist/vimeo-blocker.iife.js"
  data-api-key="YOUR_PUBLISHABLE_API_KEY"
  data-creator-id="YOUR_CREATOR_ID"
  data-player="vimeo"
></script>
```

### Attributes

| Attribute | Required | Description |
|---|---|---|
| `data-api-key` | **Yes** | Your publishable API key from the dashboard |
| `data-creator-id` | **Yes** | Your creator ID from the dashboard |
| `data-player` | No | Set to `"vimeo"` to target Vimeo iframes. Omit (or set to anything else) to target an HTML5 `<video>` element instead |
| `data-autoplay` | No | Set to `"true"` to automatically start playback after the viewer unlocks the content |

### Full Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Premium Video</title>
</head>
<body>

  <div style="width: 640px;">
    <iframe
      src="https://player.vimeo.com/video/123456789"
      width="640"
      height="360"
      frameborder="0"
      allowfullscreen
    ></iframe>
  </div>

  <script
    src="https://cdn.jsdelivr.net/gh/ledewire/embed@v1.0.0/dist/vimeo-blocker.iife.js"
    data-api-key="pk_live_abc123"
    data-creator-id="creator_456"
    data-player="vimeo"
    data-autoplay="true"
  ></script>

</body>
</html>
```

---

## Page Blocker

### How It Works

1. On page load, the script renders a full-viewport blur overlay over the page and locks body scrolling
2. It looks up the current page URL in the LedeWire API — if no matching content is found, the overlay is silently removed and the page loads normally
3. The viewer authenticates and purchases; on success, the overlay is removed and scrolling is restored
4. The page content is never hidden — it is blurred and inaccessible until unlocked

### Setup in the LedeWire Dashboard

Before the script tag will work, register your page:

1. Go to **Content → New Content**
2. Set the content type to **Article** (or **External Ref** for non-article content)
3. Set the **Content URI** field to the full URL of the page you want to paywall — e.g. `https://yourdomain.com/articles/my-article` (origin + pathname, no trailing slash, no query parameters)
4. Set a price and publish

The embed looks up content by sending the current page URL to the API and matching it against registered `content_uri` values. **If no match is found, the paywall does not render** — the page loads normally.

### Script Tag

Place this tag anywhere in the page, ideally just before `</body>`:

```html
<script
  src="https://cdn.jsdelivr.net/gh/ledewire/embed@v1.0.0/dist/page-blocker.iife.js"
  data-api-key="YOUR_PUBLISHABLE_API_KEY"
  data-creator-id="YOUR_CREATOR_ID"
></script>
```

### Attributes

| Attribute | Required | Description |
|---|---|---|
| `data-api-key` | **Yes** | Your publishable API key from the dashboard |
| `data-creator-id` | **Yes** | Your creator ID from the dashboard |
| `data-external-url` | No | Override the URL sent to the API for content lookup. Defaults to `window.location.origin + window.location.pathname`. Use this if your CMS adds query parameters you want to strip, or if you're testing on a different port |

### Full Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Premium Article</title>
</head>
<body>

  <article>
    <h1>The Full Story</h1>
    <p>This content will be blurred until the viewer unlocks it...</p>
  </article>

  <script
    src="https://cdn.jsdelivr.net/gh/ledewire/embed@v1.0.0/dist/page-blocker.iife.js"
    data-api-key="pk_live_abc123"
    data-creator-id="creator_456"
  ></script>

</body>
</html>
```

---

## Viewer Experience

The following describes what the viewer sees. The embed handles all of this automatically.

### First Visit (Not Logged In)

```
Page/Video loads
       │
       ▼
Paywall overlay appears — "Premium Content — Unlock for $X"
       │
       ▼ (viewer clicks "Unlock Now")
Login modal — email + password, or "Create Account"
       │ ──── has account ────────────────────────────┐
       │                                              ▼
       ▼ (new user)                         Confirm Purchase modal
Signup modal — name, email, password         Shows price + wallet balance
       │                                              │
       ▼                                    ┌─────────┴──────────┐
Confirm Purchase modal                      │ Sufficient funds   │ Insufficient funds
                                            ▼                    ▼
                                        Purchase confirmed   Add Funds modal
                                            │                (Stripe card entry)
                                            ▼                    │
                                        Content unlocks  ◄───────┘
```

### Return Visit (Already Logged In)

If the viewer has already purchased the content, the overlay appears briefly and then automatically removes itself — they never see a payment prompt.

If the viewer is logged in but has not purchased, they are taken directly to the Confirm Purchase modal (login step skipped).

### Session Expiry

Auth tokens are stored in `sessionStorage` (tab-scoped — cleared when the tab closes). If a session expires while the viewer is on the page, the login modal re-appears automatically so they can re-authenticate without a full page reload.

### Password Reset

From the Login modal, viewers can request a password reset email via the "Forgot password?" link.

---

## Version Pinning

Always pin to a specific version in production. The CDN URL for an exact version is **permanently cached** by jsDelivr — it will never change.

```html
<!-- ✅ Exact version — recommended for production -->
src="https://cdn.jsdelivr.net/gh/ledewire/embed@v1.0.0/dist/vimeo-blocker.iife.js"

<!-- ✅ Minor version — receives patch fixes automatically -->
src="https://cdn.jsdelivr.net/gh/ledewire/embed@v1.0/dist/vimeo-blocker.iife.js"

<!-- ❌ No version — unpredictable, do not use in production -->
src="https://cdn.jsdelivr.net/gh/ledewire/embed/dist/vimeo-blocker.iife.js"
```

See the [releases page](https://github.com/ledewire/embed/releases) for all available versions and their changelogs.

---

## Troubleshooting

### Paywall does not appear

**Vimeo Blocker:**
- Verify the Vimeo `<iframe>` is present on the page before the script executes
- Check the browser console for errors — a missing or invalid `data-api-key` will log an auth error
- Confirm the Vimeo video ID in your iframe URL (`/video/XXXXXXX`) matches the `external_identifier` registered in the LedeWire dashboard — it must be formatted as `vimeo:XXXXXXX`

**Page Blocker:**
- Confirm the `content_uri` registered in the dashboard exactly matches `window.location.origin + window.location.pathname` for the current page (no trailing slash differences, no query parameters)
- If your URL has query parameters you want to ignore, use `data-external-url` to pass the canonical URL explicitly
- If the API finds no content for the current URL, the paywall silently does not render — this is intentional

### Overlay appears but purchase never completes

- Open the browser DevTools Network tab and look for failed API requests to `api.ledewire.com`
- Ensure the content is published (not draft) in the LedeWire dashboard
- Check that the wallet top-up flow completes — the Add Funds modal requires Stripe to load successfully

### Video doesn't play after unlock (Vimeo)

- Confirm the Vimeo player has the JS API enabled: in your Vimeo embed URL, ensure `?api=1` is present or that you're using the standard `player.vimeo.com/video/ID` format
- The embed sends a `play` postMessage — some Vimeo plans restrict API access

### Style conflicts

The embed uses a **Shadow DOM** for all UI — its styles cannot affect your page and your page styles cannot affect it. If you see styling issues, they are almost certainly from the `AddFunds` Stripe modal, which renders outside the Shadow DOM via a portal for Stripe compatibility.

---

## Security Notes

- **Never use your secret API key** in the script tag. The `data-api-key` attribute is your **publishable** key, visible in page source. Your secret key must remain server-side only.
- The embed transmits credentials over HTTPS to `api.ledewire.com` only — no third-party analytics or tracking.
- Auth tokens are stored in `sessionStorage` (tab-scoped). They are never written to `localStorage` or cookies, and are cleared automatically when the tab closes. Tokens do not persist across tabs.
