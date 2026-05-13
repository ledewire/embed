# LedeWire Embed — Architecture & Functional Overview

## Purpose

LedeWire Embed is a lightweight, embeddable JavaScript paywall script that content creators drop onto any web page via a single `<script>` tag. It intercepts access to video or written content, prompts the viewer to authenticate and pay, and then removes itself upon successful purchase.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Host Page (creator site)                 │
│                                                                 │
│  ┌──────────────┐   ┌─────────────────────────────────────────┐ │
│  │  <script>    │   │  Shadow DOM Container (style isolation) │ │
│  │  embed tag   │──▶│                                         │ │
│  └──────────────┘   │   ┌─────────────────────────────────┐   │ │
│                     │   │    Preact App (App.tsx)         │   │ │
│                     │   │                                 │   │ │
│                     │   │  Modal State Machine:           │   │ │
│                     │   │  overlay → login/signup         │   │ │
│                     │   │         → confirm → addFunds    │   │ │
│                     │   │         → alreadyPurchased      │   │ │
│                     │   │         → unlocked              │   │ │
│                     │   └─────────────────────────────────┘   │ │
│                     └─────────────────────────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │   Video Element (Vimeo iframe or <video>)               │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTPS
                    ┌─────────────────────┐
                    │  api.ledewire.com   │
                    │  /v1/...            │
                    └─────────────────────┘
```

---

## Entry Points

The embed compiles to two separate IIFE bundles, selectable at build time via the `BUILD_TARGET` environment variable.

### 1. `vimeo-blocker.tsx` (default)

**Use case:** Paywall over a Vimeo `<iframe>` already on the page.

**Bootstrap sequence:**
1. Reads config from the `<script>` tag attributes (`data-api-key`, `data-creator-id`, `data-player`, `data-autoplay`).
2. Auto-detects the Vimeo video ID from the iframe `src` URL.
3. Immediately disables pointer events on the iframe and sends repeated `pause` postMessages via `window.postMessage` to the Vimeo Player API (retries for 5 s to handle players still loading).
4. Injects an absolutely-positioned `<div>` container over the video element.
5. Attaches a **Shadow DOM** to that container for style isolation.
6. Authenticates the seller (API key → bearer token), loads seller config (Google Client ID), and fetches content metadata using the detected Vimeo video ID.
7. Renders the Preact `App` inside the Shadow DOM.
8. On unlock, sends a `play` postMessage to the Vimeo iframe and re-enables pointer events.

### 2. `page-blocker.tsx`

**Use case:** Paywall over an entire article/page (text content).

**Bootstrap sequence:**
1. Waits for `document.body`, then resolves trigger mode.
2. Defaults to immediate mode. If scroll mode is configured, waits until the viewer reaches the configured scroll threshold before continuing.
3. Reads config similarly but derives a `contentId` via `data-external-url` (or falls back to `window.location.origin + pathname`).
4. Creates a **full-viewport fixed overlay** (`100vw × 100vh`, `z-index: 2147483647`) with a frosted-glass backdrop (`blur(10px)`).
5. Sets `document.body.style.overflow = "hidden"` to prevent scrolling the underlying content.
6. Attaches a **Shadow DOM** for style isolation.
7. Authenticates the seller and searches for content metadata by `external_url`.
8. Renders the Preact `App`.
9. On unlock, removes the overlay container and restores `body.overflow`.

**Scroll trigger configuration:**

| Source | Example | Notes |
|--------|---------|-------|
| Script attributes | `data-trigger="scroll"` and `data-scroll-threshold="0.7"` | Preferred for normal embeds |
| Script URL params | `?trigger=scroll&scrollThreshold=0.7` | Useful when a CMS cannot add custom attributes |
| Global config | `window.EMBED_PAGE_BLOCKER_CONFIG = { trigger: "scroll", scrollThreshold: 0.7 }` | Must be defined before the page blocker script loads |

The threshold is parsed as a number and defaults to `0.7` when missing or invalid. Scroll progress is calculated as `window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)`, so pages with no scrollable height do not fire the scroll trigger.

---

## Application UI (`App.tsx`) — Modal State Machine

`App` is a stateful Preact component that controls which UI panel is visible. All state transitions happen through a single `modalState` string variable.

```
              ┌──────────┐
              │ overlay  │◀─────────────────── (close / cancel)
              └────┬─────┘
                   │ Purchase click
                   ▼
         ┌──────────────────┐
         │ authenticated?   │
         └──────┬─────┬─────┘
          Yes   │     │  No
                │     ▼
                │  ┌───────┐
                │  │ login │◀──── "switch to signup"
                │  └───┬───┘
                │      │ success
                │      ▼
         ┌──────┴─────────────┐
         │    confirm         │────▶ addFunds (if wallet balance insufficient)
         └────────────────────┘
                   │ confirm purchase
                   ▼
         ┌────────────────────┐
         │ call /purchases    │
         └────────┬───────────┘
          success │     │ already purchased
                  │     ▼
                  │  ┌─────────────────────┐
                  │  │ alreadyPurchased    │──▶ unlocked (auto, 2 s)
                  │  └─────────────────────┘
                  ▼
              ┌─────────┐
              │ unlocked│──▶ onUnlock() callback removes container
              └─────────┘
```

**On mount**, the app silently:
1. Calls `AuthService.ensureAuthenticated()` (refreshes the JWT if needed).
2. If authenticated, checks `PurchaseService.verifyPurchase()` — if already bought, unlocks immediately with no UI shown.
3. If authenticated but not purchased, fetches the wallet balance to pre-populate the Confirm modal.

---

## Component Catalogue

| Component | File | Role |
|-----------|------|------|
| `Overlay` | [src/components/Overlay.tsx](../src/components/Overlay.tsx) | Initial paywall card — "Access the full story / Purchase Now · $X" |
| `LoginModal` | [src/components/LoginModal.tsx](../src/components/LoginModal.tsx) | Email + password form; Google OAuth button (UI complete, token handling partial) |
| `SignupModal` | [src/components/SignupModal.tsx](../src/components/SignupModal.tsx) | Account creation form (first name, last name, email, password); Google OAuth button |
| `ConfirmModal` | [src/components/ConfirmModal.tsx](../src/components/ConfirmModal.tsx) | Shows wallet balance vs. price; "Confirm Purchase" or "Add Funds" CTA |
| `AddFundsModal` | [src/components/AddFundsModal.tsx](../src/components/AddFundsModal.tsx) | Stripe card element; creates a payment session via `/wallet/payment-session` and processes the card |
| `AlreadyPurchasedModal` | [src/components/AlreadyPurchasedModal.tsx](../src/components/AlreadyPurchasedModal.tsx) | Transient success notice; auto-dismisses after 2 s |
| `ResetPassword` | [src/components/ResetPassword.tsx](../src/components/ResetPassword.tsx) | Two-step flow: request OTP via email → submit OTP + new password |

---

## Service Layer

### `ApiClient` ([src/services/api.ts](../src/services/api.ts))

Thin `fetch`-based HTTP client. Key behaviours:
- **Auto token refresh** — every authenticated request calls `refreshTokenIfNeeded()` before dispatching. If the refresh fails, tokens are cleared and an error is thrown.
- Reads `VITE_API_BASE_URL` env var; falls back to `https://api.ledewire.com/v1`.
- CORS mode `"cors"`, credentials `"omit"` (tokens sent via `Authorization: Bearer` header, not cookies).

### `AuthService` ([src/services/authService.ts](../src/services/authService.ts))

| Method | Description |
|--------|-------------|
| `authenticateSeller(apiKey)` | Exchanges the embed's publishable API key for a short-lived seller bearer token via `/auth/login/api-key`. Stores it via `TokenManager.setSellerToken`. |
| `getConfig(apiKey)` | Fetches seller-level config (e.g., `google_client_id`) using the seller token. |
| `getContentMetadata(contentId)` | Fetches full content record (title, price, teaser, access info) by ID. |
| `searchContentByMetadata(metadata)` | Searches content by `vimeo_id` or `external_url`; returns the first match. Used by both entry points to resolve `contentId` dynamically. |
| `loginWithEmail(email, password)` | POST `/auth/login/email`; stores JWT tokens via `TokenManager`. |
| `loginWithGoogle(idToken)` | POST `/auth/login/google` with `multipart/form-data`; Google OAuth flow. |
| `signup(email, password, firstName, lastName)` | POST `/auth/signup`; stores JWT tokens. |
| `getResetCode(email)` | POST `/auth/password/reset-request`; triggers OTP email. |
| `setNewPassword({ email, newPassword, otp })` | POST `/auth/password/reset`; completes the password reset. |
| `ensureAuthenticated()` | Checks token presence; triggers refresh via `TokenManager.ensureValidToken()` if expired. Returns `false` rather than throwing if unauthenticated. |
| `logout()` | Clears all tokens. |

### `PurchaseService` ([src/services/purchaseService.ts](../src/services/purchaseService.ts))

| Method | Endpoint | Description |
|--------|----------|-------------|
| `getWalletBalance()` | `GET /wallet/balance` | Returns `balance_cents`. |
| `purchaseContent(contentId, priceCents)` | `POST /purchases` | Creates a purchase record. Returns `PurchaseResponse` including status. |
| `verifyPurchase(contentId)` | `GET /purchase/verify?content_id=…` | Returns `{ has_purchased: boolean }`. Used on mount and post-login to skip the purchase flow if already owned. |
| `createPaymentSession(amountCents)` | `POST /wallet/payment-session` | Returns a Stripe `client_secret`, `session_id`, and `public_key` used to initialise Stripe Elements. |

### `TokenManager` ([src/services/tokenManager.ts](../src/services/tokenManager.ts))

Manages two token scopes stored via a pluggable `IStorageAdapter`:
- **Buyer tokens** — `access_token`, `refresh_token`, `expires_at` (JWT for the viewing user).
- **Seller token** — `seller_token` (API key exchange token for the creator's account).

Token expiry is checked with a **5-minute proactive buffer** (`isTokenExpired()`). `ensureValidToken()` calls `refreshAccessToken()` via `/auth/token/refresh` if needed.

### `StorageAdapter` ([src/services/storageAdapter.ts](../src/services/storageAdapter.ts))

Provides a swappable storage interface (`IStorageAdapter`) with two built-in implementations:

| Adapter | Class | Notes |
|---------|-------|-------|
| In-memory (default) | `InMemoryStorage` | XSS-safe; tokens lost on page refresh. Correct default for an embed running on third-party sites. |
| Session storage | `SessionStorageAdapter` | Survives page navigation within the tab; still readable by XSS on the host page. Use only when persistence is explicitly required. |

Configure with `setTokenStorage("memory" | "session")` or inject a custom adapter via `setTokenStorageAdapter(custom)`.

---

## Build System

| Command | Output | Description |
|---------|--------|-------------|
| `npm run build` | Both bundles | Runs vimeo then page builds sequentially |
| `npm run build:vimeo` | `dist/vimeo-blocker.iife.js` | Vimeo paywall bundle |
| `npm run build:page` | `dist/page-blocker.iife.js` | Full-page paywall bundle |
| `npm run dev` | Dev server on `:5173` | Vimeo entry by default |
| `npm run dev:page` | Dev server on `:5173` | Page-blocker entry |
| `npm run proxy` | CORS proxy on `:8010` | Required in development to forward requests to `api.ledewire.com` (browser CORS restriction) |

Both bundles are compiled as **IIFE** (Immediately Invoked Function Expression) via Vite + Rollup — no `import`/`require`, safe to drop onto any page. Minification uses Terser.

A custom Vite plugin (`htmlPlugin`) rewrites the `index.html` entry point at dev-server time based on `BUILD_TARGET` so both modes are previewable without manually editing HTML.

**Tech stack:**
- **Preact** (React-compatible, ~3 kB) — UI framework
- **TypeScript** — type safety across all layers
- **Tailwind CSS** (injected into Shadow DOM as inline string via `?inline` import) — utility styling
- **Axios** — used in `AuthService` for seller-facing calls (supports `multipart/form-data` and `validateStatus` control); `fetch` used in `ApiClient` for buyer calls
- **Stripe.js** (loaded lazily from CDN in `AddFundsModal`) — card payment elements
- **Google OAuth** (`@react-oauth/google`) — Google login button

---

## Security Considerations

| Concern | Mitigation |
|---------|-----------|
| Token storage on third-party sites | Default `InMemoryStorage`: tokens never written to `localStorage` or `sessionStorage`, preventing exfiltration by other scripts on the host page. |
| Style bleed-in / bleed-out | Shadow DOM isolates all Tailwind and component CSS from the host page. |
| CORS | Production calls go directly to `api.ledewire.com`; development uses a local proxy on `:8010`. The embed uses `credentials: "omit"` — no cookies sent. |
| XSS via `innerHTML` | None used; all DOM construction is via `document.createElement` and Preact's virtual DOM. |
| Stripe PCI scope | Card data never touches LedeWire servers; Stripe Elements iframe handles raw card entry. |

---

## Key Data Flows

### First-time Viewer (unauthenticated)

```
Page load
  └─ Entry point bootstraps
       └─ authenticateSeller(apiKey)          → seller JWT stored
       └─ getConfig(apiKey)                   → Google Client ID
       └─ searchContentByMetadata(url/id)     → contentMetadata (title, price_cents)
       └─ App mounts → ensureAuthenticated()  → false (no token)
       └─ show Overlay

Click "Purchase Now"
  └─ ensureAuthenticated() → false
  └─ show LoginModal

Login with email/password
  └─ loginWithEmail()      → buyer JWT stored
  └─ verifyPurchase()      → false
  └─ getWalletBalance()
  └─ show ConfirmModal

  If balance < price:
    └─ show AddFundsModal
         └─ createPaymentSession()  → Stripe client_secret
         └─ Stripe confirms card
         └─ getWalletBalance() (refresh)
         └─ back to ConfirmModal

Confirm purchase
  └─ purchaseContent(contentId, priceCents)
  └─ onUnlock() → container removed / video plays
```

### Returning Viewer (authenticated with valid token)

```
Page load
  └─ Entry point bootstraps
  └─ App mounts → ensureAuthenticated() → true (valid or auto-refreshed JWT)
  └─ verifyPurchase()      → true
  └─ unlockContent() immediately — no UI shown
```

---

## Known Limitations & Future Work

- **Google OAuth** — The UI button is present in Login and Signup modals and the `id_token` is sent to `/auth/login/google`, but the response token is not currently stored in `TokenManager`. Full buyer SSO via Google is not yet operational end-to-end.
- **Session persistence** — In-memory storage is XSS-safe but means a page refresh forces re-authentication. Returning viewers who do not have a valid token will see the paywall again even after purchase (until `verifyPurchase` confirms ownership).
- **Analytics** — No `/ahoy/events` calls are made; events such as `unlock_clicked` and `video_unlocked` are not tracked.
- **YouTube / Wistia** — Only Vimeo and native HTML5 `<video>` are supported.
- **Beehiiv adapter** — There is no separate Beehiiv adapter. Beehiiv web posts should use the generic `page-blocker.iife.js` flow documented in [Beehiiv Integration Steps](./BEEHIIV_INTEGRATION_STEPS.md), subject to Beehiiv's script-injection limitations.

---

## Improvement Opportunities

### High Priority

**1. Disable or feature-flag the Google OAuth button until complete**
The Google login button is visible in both `LoginModal` and `SignupModal` but the flow does not store tokens after the API call, leaving the SSO path silently broken. A non-functional auth button is a user-facing credibility issue. The button should be hidden behind a feature flag (e.g., a `sellerConfig.google_sso_enabled` field) or removed from the UI until the token storage step in `AuthService.loginWithGoogle` is implemented and tested end-to-end.

**2. Add a Preact error boundary around the App**
There is currently no error boundary wrapping the Preact component tree. An unhandled runtime exception in any modal will crash the embed and leave the host page permanently blocked with no recovery path for the viewer. A top-level error boundary should catch rendering errors and either render a safe fallback (e.g. remove the overlay and log the error) or display a user-friendly message.

### Medium Priority

**3. Restore Shadow DOM isolation for `AddFundsModal`**
`AddFundsModal` uses `createPortal` to render outside the Shadow DOM, and compensates by injecting a minimal `<style>` tag into `document.head`. This breaks the style isolation guarantee that Shadow DOM provides and risks visual conflicts with host page CSS. The modal should be refactored to render inside the Shadow DOM root, using a stacking context (absolute/fixed positioning within the shadow root) rather than a document-level portal.

**4. Split `AuthService` into seller and buyer concerns**
`AuthService` currently handles two distinct authentication actors: the seller (API key exchange) and the buyer (JWT login/signup/reset). These have separate token lifecycles, different API endpoints, and different error handling needs. Separating them into `SellerAuthService` and `BuyerAuthService` (or similar) would make each easier to test in isolation and reduce the risk of accidentally mixing seller and buyer token logic.

**5. Measure and address mount-time API latency**
On every page load, the embed makes at least two sequential API calls before any UI is shown: `ensureAuthenticated()` and `verifyPurchase()`. On slow connections or under API load, this delay will be visible to users. The calls should be profiled in production, and if latency is significant, consider parallelising them with `Promise.all` or caching the purchase verification result in session storage with a short TTL.

### Low Priority

**6. Implement `matchPattern` validation in `page-blocker`**
The `data-match-pattern` attribute is read from the script tag and defaults to `".*"`, meaning the page blocker fires on every page where the script is included. If a creator places the script on a shared layout template, it will block pages that should not be paywalled. The entry point should evaluate `matchPattern` against `window.location.pathname` at runtime and bail out early if there is no match, giving creators fine-grained control over which URLs trigger the paywall.
