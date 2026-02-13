# Code Review: LedeWire Embed (Security)
**Date**: 2026-02-13

**Ready for Production**: No
**Critical Issues**: 2

This review focuses on the embed script + client-side auth/purchase flows and the local development CORS proxy.

## Priority 1 (Must Fix) ⛔

### 1) Seller API key is embedded client-side (public)
**Where**: index demo includes `data-api-key="..."`.

**Risk**: Any site visitor can view/copy the seller credential and use it to mint a seller access token via `POST /auth/login/api-key`. If that key is meant to be secret, this is equivalent to publishing a password.

**Impact**:
- Unauthorized access to seller-scoped endpoints (depends on backend permissions)
- Key reuse across sites/environments becomes a persistent compromise

**Recommended fixes** (pick one):
1. Replace the current API key with a *publishable* key that is safe to expose, and enforce server-side limits (origin allowlist, rate limits, scope limits).
2. Use a short-lived signed token instead of an API key (e.g., seller signs a JWT server-side and supplies it to the page at render time).
3. If you must keep a secret: move the seller-auth step server-side (your infrastructure), and issue a restricted, time-bound token to the embed.

**Proposed code change**:
- Remove the hard-coded `data-api-key` from the repository demo file.
- Ensure docs clearly mark it as a placeholder.

### 2) Access + refresh tokens stored in localStorage (XSS = account takeover)
**Where**: `TokenManager` stores `access_token`, `refresh_token`, `expires_at`, plus `seller_token` in `localStorage`.

**Risk**: Any XSS on the host page (remember: this is an embed running on third-party sites) can read localStorage and exfiltrate tokens.

**Impact**:
- User session theft (access/refresh)
- Seller token theft (seller-scoped API access)

**Recommended fixes**:
1. Preferred: use HttpOnly secure cookies for refresh tokens (requires first-party context; embeds complicate this).
2. If cookies are not viable: store tokens in-memory only (lost on refresh), keep access tokens short-lived, and rotate refresh tokens frequently.
3. If persistence is required: switch to `sessionStorage` (still vulnerable to XSS, but reduces long-term exposure) + add strong host guidance on CSP.

**Proposed code change**:
- Introduce a `StorageAdapter` abstraction and default to in-memory storage; optionally allow `sessionStorage`.

## Priority 2 (Should Fix)

### 3) Client controls `price_cents` in purchase request (tampering risk)
**Where**: Purchase request includes `{ content_id, price_cents }`.

**Risk**: A malicious client can send a lower price unless the server ignores it.

**Recommendation**:
- Backend: ignore client-supplied price; compute authoritative price from `content_id`.
- Frontend: stop sending `price_cents` entirely (or rename param to `display_price_cents` and treat it as non-authoritative).

### 4) URL query construction should encode `contentId`
**Where**: `verifyPurchase` builds `/purchase/verify?content_id=${contentId}`.

**Risk**: Not classic SQL injection (server-side), but unencoded values can break requests, poison logs, and complicate proxy behavior.

**Proposed change**:
- Use `encodeURIComponent(contentId)` or `new URLSearchParams({ content_id: contentId })`.

### 5) Dev CORS proxy is overly permissive and forwards headers unsafely
**Where**: `cors-proxy.cjs`.

Issues:
- Sets `Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials: true` (browsers will reject credentialed requests with `*`; also sends a misleading security posture).
- Forwards arbitrary incoming headers to the upstream.
- Forwards upstream response headers verbatim.

**Recommendation**:
- Make it explicit dev-only.
- Reflect the request Origin (or restrict to `http://localhost:<port>`), and either remove `Allow-Credentials` or set a specific origin.
- Use an allowlist of forwarded headers.

### 6) Potential sensitive logging
**Where**: `AuthService.loginWithGoogle` logs raw axios response.

**Risk**: If response includes tokens or identifiers, they leak to console (and potentially to log collectors).

**Recommendation**:
- Remove console logging or log only minimal fields.

### 7) External URL sent to backend may leak query parameters
**Where**: page blocker uses `window.location.href` as `external_url`.

**Risk**: Query strings may include sensitive data (campaign IDs, email, auth tokens, etc.).

**Recommendation**:
- Default to `location.origin + location.pathname` and only include query params if explicitly needed.

## Priority 3 (Nice to Have)

### 8) Avoid storing Stripe objects on `window`
**Where**: Add Funds modal stores Stripe instance and Card Element on globals.

**Risk**: In an XSS scenario, globals are easy targets. (Note: raw card data is not directly exposed by Stripe Elements, but reducing attack surface still helps.)

**Recommendation**:
- Keep references in component state/refs only; if a fallback is needed, use a closure/module-level variable, not `window`.

### 9) Docker dev server is exposed to the network
**Where**: Dockerfile runs `vite --host`.

**Risk**: Makes dev server reachable on LAN; can be problematic in shared networks.

**Recommendation**:
- Default to localhost binding unless explicitly requested.

## Proposed Patch Set (Not Applied Yet)

If you approve, I would implement a small, low-risk patch series:

1. **Remove secret material from repo demos**
   - Replace `data-api-key` in the demo HTML with a placeholder, and document how to supply it.

2. **Harden request construction**
   - Encode `content_id` in `verifyPurchase`.

3. **Reduce client-side tampering**
   - Stop sending `price_cents` in the purchase call (or rename to make it clearly non-authoritative).

4. **Token storage improvements (configurable)**
   - Add an in-memory default token store; optionally allow `sessionStorage`.

5. **Dev proxy tightening**
   - Restrict allowed origins/headers and remove misleading credentials handling.

## Notes / Assumptions

- The highest-risk item here is whether `data-api-key` is a true secret. If it is meant to be publishable, that should be explicitly documented and enforced server-side with strict scope/rate limits.
- As an embed, this code executes in untrusted host pages; assume host-page XSS is plausible and design token handling accordingly.
