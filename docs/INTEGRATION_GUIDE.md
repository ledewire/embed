# LedeWire Embed — Integration Guide

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
2. Set the content type to **Video**
3. In the **Metadata** field, add the Vimeo video ID (the numeric ID from your Vimeo URL, e.g., `123456789`)
4. Set a price and publish

The embed auto-detects the Vimeo ID from the iframe's src attribute — you do not pass it manually.

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

### Page Requirements

- The page must contain exactly one Vimeo `<iframe>` whose `src` contains `player.vimeo.com/video/`
- The iframe's parent element must not have `overflow: hidden` set — the overlay is injected as a sibling inside that parent

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

1. On page load, the script checks whether the current URL matches the `data-match-pattern` (default: matches everything)
2. If it matches, a full-viewport blur overlay is rendered over the page, and body scrolling is locked
3. The viewer authenticates and purchases; on success, the overlay is removed, and scrolling is restored
4. The page content is never hidden — it is blurred and inaccessible until unlocked

### Setup in the LedeWire Dashboard

Before the script tag will work, register your page:

1. Go to **Content → New Content**
2. Set the content type to **Article** (or appropriate type)
3. In the **Metadata** field, add the `external_url` — this must exactly match the URL of your page (origin + pathname, e.g. `https://yourdomain.com/articles/my-article`)
4. Set a price and publish

The embed finds content by sending the current page URL to the API and matching it against registered `external_url` values. **If no match is found, the paywall does not render** — the page loads normally.

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
| `data-match-pattern` | No | A JavaScript regex pattern. The paywall only activates on URLs that match. Default: `.*` (all pages). Useful when the same script tag is included via a CMS template |
| `data-external-url` | No | Override the URL sent to the API for content lookup. Defaults to `window.location.origin + window.location.pathname`. Use this if your CMS adds query parameters you want to strip, or if you're testing on a different port |

### Using `data-match-pattern`

If you include the script in a shared template but only want the paywall on specific pages:

```html
<!-- Only activate on URLs containing /premium/ -->
<script
  src="https://cdn.jsdelivr.net/gh/ledewire/embed@v1.0.0/dist/page-blocker.iife.js"
  data-api-key="pk_live_abc123"
  data-creator-id="creator_456"
  data-match-pattern="/premium/"
></script>
```

```html
<!-- Only activate on specific article slugs -->
<script
  ...
  data-match-pattern="/(my-article|another-article|third-article)"
></script>
```

The pattern is matched against the full current URL using JavaScript's `RegExp` with no flags.

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
- Check the browser console for errors — a missing or invalid `data-api-key` will log `"Missing API_KEY"` or an auth error
- Confirm the Vimeo video ID in your iframe URL (`/video/XXXXXXX`) matches the ID registered in the LedeWire dashboard

**Page Blocker:**
- Confirm the `external_url` registered in the dashboard exactly matches `window.location.origin + window.location.pathname` for the current page (no trailing slash differences, no query parameters)
- If using `data-match-pattern`, verify your regex matches the current URL — test by running `/<your-pattern>/.test(window.location.href)` in the browser console
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
- Auth tokens are stored in memory only (not `localStorage` or cookies), so they do not persist across page navigations or tabs by design.
