# SDK Migration Plan: `@ledewire/browser` v0.5.0

## Overview

This document tracks the migration of all hand-rolled API interaction in the embed codebase to the official `@ledewire/browser` SDK. The goal is to delete `ApiClient`, `TokenManager`, `StorageAdapter`, and the bulk of `AuthService` / `PurchaseService`, replacing them with the SDK client — reducing maintenance surface and gaining automatic token refresh, typed error classes, and seller content discovery for free.

**Target SDK version:** `@ledewire/browser@0.5.0`

---

## Mapping: Current Code → SDK

### Full replacement coverage (no raw API calls needed)

| Current code                                                      | SDK equivalent                                                             | Notes                                            |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------ |
| `ApiClient` + `TokenManager` + `StorageAdapter`                   | `init({ apiKey, storage?, onAuthExpired? })`                               | Token lifecycle fully managed by SDK             |
| `AuthService.authenticateSeller(apiKey)`                          | `lw.auth.loginWithApiKey({ key: apiKey })`                                 | New in v0.4.0                                    |
| `AuthService.getConfig(apiKey)`                                   | `lw.config.getPublic()`                                                    | No auth required                                 |
| `AuthService.getContentMetadata(contentId)`                       | `lw.content.getWithAccess(contentId)`                                      |                                                  |
| `AuthService.searchContentByMetadata({ vimeo_id, external_url })` | `lw.seller.content.search({ metadata: { vimeo_id, external_url } })`       | New in v0.4.0 — was the primary migration risk   |
| `AuthService.loginWithEmail(email, password)`                     | `lw.auth.loginWithEmail({ email, password })`                              | SDK stores tokens correctly                      |
| `AuthService.loginWithGoogle(idToken)`                            | `lw.auth.loginWithGoogle({ id_token })`                                    | SDK stores tokens correctly — fixes broken OAuth |
| `AuthService.signup(...)`                                         | `lw.auth.signup({ email, password, first_name, last_name })`               |                                                  |
| `AuthService.ensureAuthenticated()`                               | `lw.checkout.state(contentId)` — replaces the pattern                      | See App.tsx simplification below                 |
| `PurchaseService.getWalletBalance()`                              | `lw.wallet.balance()`                                                      |                                                  |
| `PurchaseService.purchaseContent(id, cents)`                      | `lw.purchases.create({ content_id })`                                      | SDK derives price from content record            |
| `PurchaseService.verifyPurchase(contentId)`                       | `lw.checkout.state(contentId)` — `next_required_action === 'view_content'` | Single call replaces verify + auth check         |
| `PurchaseService.createPaymentSession(cents)`                     | `lw.wallet.createPaymentSession({ amount_cents })`                         |                                                  |

### Full replacement coverage — all raw API calls eliminated

All methods are now covered by the SDK as of v0.5.0. `axios` can be fully removed from the project.

| Current code                                              | SDK equivalent                                           | Notes                                                                                     |
| --------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `AuthService.getResetCode(email)`                         | `lw.auth.requestPasswordReset({ email })`                | Added in v0.5.0. Returns ambiguous success message to prevent account enumeration.        |
| `AuthService.setNewPassword({ email, newPassword, otp })` | `lw.auth.resetPassword({ email, reset_code, password })` | Added in v0.5.0. Note: param renamed from `otp`/`newPassword` to `reset_code`/`password`. |

---

## The Big Win: `lw.checkout.state()` simplifies `App.tsx`

The current `App.tsx` mount effect makes two sequential API calls to determine initial state, and `handlePurchaseClick` makes another separate auth check. The SDK's `lw.checkout.state(contentId)` returns a single `next_required_action`:

```
'authenticate' | 'fund_wallet' | 'purchase' | 'view_content'
```

The entire App state machine collapses into one call on mount and one call on purchase click — both driven by the same `switch` statement:

```typescript
const { checkout_state } = await lw.checkout.state(contentId);

switch (checkout_state.next_required_action) {
  case "view_content":
    return unlockContent(); // already purchased
  case "authenticate":
    return setModalState("login");
  case "fund_wallet":
    return setModalState("addFunds");
  case "purchase":
    return setModalState("confirm");
}
```

This also eliminates the separate `verifyPurchase()` + `ensureAuthenticated()` round trips on mount, directly resolving Improvement #5 from `ARCHITECTURE.md`.

---

## SDK Singleton Pattern

Both entry points currently call `AuthService.authenticateSeller(apiKey)` independently. After migration, a single `sdkClient.ts` module initialises the SDK once and exports the `lw` instance:

```typescript
// src/services/sdkClient.ts
import { init } from "@ledewire/browser";

let _lw: ReturnType<typeof init> | null = null;

export function createSdkClient(apiKey: string) {
  _lw = init({ apiKey });
  return _lw;
}

export function getSdkClient() {
  if (!_lw) throw new Error("SDK client not initialised");
  return _lw;
}
```

Entry points call `createSdkClient(apiKey)` during bootstrap. Everything else calls `getSdkClient()`.

---

## Phased Migration

### Phase 1 — Install & SDK singleton

**Goal:** Get the SDK wired in without breaking anything existing.

- `npm install @ledewire/browser@0.4.0`
- Create `src/services/sdkClient.ts` (see above)
- In both entry points, replace `AuthService.authenticateSeller(apiKey)` with `createSdkClient(apiKey)` (which internally calls `lw.auth.loginWithApiKey`)
- Run tests — all existing service tests should still pass as nothing else has changed yet

**Files:** `package.json`, new `src/services/sdkClient.ts`, `src/entries/vimeo-blocker.tsx`, `src/entries/page-blocker.tsx`

---

### Phase 2 — Replace `PurchaseService`

**Goal:** Remove all hand-rolled purchase and wallet API calls.

Replace each method body to delegate to the SDK:

- `getWalletBalance()` → `lw.wallet.balance()`
- `purchaseContent()` → `lw.purchases.create()`
- `verifyPurchase()` → `lw.checkout.state()` — adapt return to `{ has_purchased: boolean }` to keep call sites unchanged for now
- `createPaymentSession()` → `lw.wallet.createPaymentSession()`

Update `purchaseService.test.ts` to mock the SDK client instead of `ApiClient`.

**Files:** `src/services/purchaseService.ts`, `src/services/purchaseService.test.ts`

---

### Phase 3 — Replace buyer auth in `AuthService`

**Goal:** Remove hand-rolled login, signup, and seller config calls.

- `loginWithEmail` → `lw.auth.loginWithEmail()`
- `loginWithGoogle` → `lw.auth.loginWithGoogle()` — **this fixes the broken OAuth flow**
- `signup` → `lw.auth.signup()`
- `getConfig` → `lw.config.getPublic()`
- `getContentMetadata` → `lw.content.getWithAccess()`
- `searchContentByMetadata` → `lw.seller.content.search({ metadata: ... })`
- `ensureAuthenticated` / `logout` — keep as thin wrappers or inline at call sites
- Replace `getResetCode` → `lw.auth.requestPasswordReset({ email })` and `setNewPassword` → `lw.auth.resetPassword({ email, reset_code, password })`. Note the param rename: `otp` → `reset_code`, `newPassword` → `password`.

**Files:** `src/services/authService.ts`

---

### Phase 4 — Simplify `App.tsx` with `checkout.state()`

**Goal:** Replace the two-call mount pattern with a single `lw.checkout.state()` drive.

Refactor the `useEffect` on mount and `handlePurchaseClick` to use the `switch` pattern described above. Remove the separate `checkAlreadyPurchased()` helper entirely — it becomes the `'view_content'` case.

Update `App.test.tsx` to mock `checkout.state()` responses instead of individual service mocks.

**Files:** `src/App.tsx`, `src/App.test.tsx`

---

### Phase 5 — Delete replaced infrastructure

**Goal:** Remove files that are now fully superseded.

Once all call sites have been migrated:

- Delete `src/services/api.ts`
- Delete `src/services/tokenManager.ts`
- Delete `src/services/storageAdapter.ts`
- Delete or repurpose `src/services/tokenManager.test.ts` and `src/services/storageAdapter.test.ts`
- Delete `src/services/authService.ts` and `src/services/purchaseService.ts` in their entirety

Also remove `axios` from `package.json` — it is no longer needed anywhere in the codebase.

---

### Phase 6 — Update test suite

**Goal:** Ensure tests mock at the right boundary post-migration.

The SDK ships typed error classes (`AuthError`, `PurchaseError`, `NotFoundError`, `ForbiddenError`) which make error-path assertions cleaner than matching on string messages. Update any error-path tests to use `instanceof AuthError` etc. where appropriate.

---

## Risks & Notes

| Item                                         | Status                | Notes                                                                                                                                                                   |
| -------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `searchContentByMetadata` coverage           | ✅ Resolved in v0.4.0 | `lw.seller.content.search({ metadata: { external_url, vimeo_id } })`                                                                                                    |
| Broken Google OAuth                          | ✅ Resolved by SDK    | `lw.auth.loginWithGoogle()` stores tokens correctly                                                                                                                     |
| Password reset methods                       | ✅ Resolved in v0.5.0 | `lw.auth.requestPasswordReset()` and `lw.auth.resetPassword()` — `axios` can be fully removed                                                                           |
| SDK version pinning                          | ⚠️ Pre-1.0            | Use `@ledewire/browser@0.5.0` exact pin; review changelog before bumping                                                                                                |
| Bundle size increase                         | ⚠️ Monitor            | SDK unpacked size grew: 155 kB (v0.3.0) → 190 kB (v0.4.0) → 197 kB (v0.5.0). Measure gzipped IIFE diff after Phase 1.                                                   |
| `localStorage` vs `sessionStorage` semantics | ℹ️ Note               | SDK's `localStorageAdapter()` persists across tabs and browser restarts — different from the current `SessionStorageAdapter`. Default in-memory behaviour is unchanged. |

---

## Improvements Resolved by This Migration

Cross-referencing `ARCHITECTURE.md` Improvement Opportunities:

| #   | Improvement                                    | Resolution                                                                                   |
| --- | ---------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1   | Disable broken Google OAuth button             | Resolved in Phase 3 — `lw.auth.loginWithGoogle()` works end-to-end                           |
| 4   | Split `AuthService` into seller/buyer concerns | Resolved structurally — SDK gives clear `lw.auth` (buyer) vs `lw.seller` (seller) namespaces |
| 5   | Mount-time API latency (two sequential calls)  | Resolved in Phase 4 — single `lw.checkout.state()` call replaces both                        |
