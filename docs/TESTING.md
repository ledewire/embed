# Test Coverage Summary

This document describes what test cases we have covered in the embed project and how they help ensure the tools work as intended.

---

## Overview

The embed project has **68 automated tests** across **14 test files**, covering services, components, entry points, and the main App flow. These tests provide **verification without manual testing**—critical for confidence that the embed works correctly after changes.

---

```bash
# Run tests in watch mode (re-runs on file changes)
npm test

# Run tests once
npm run test:run

# Run tests with coverage report
npm run test:coverage
```

---

## 1. Services (Unit Tests)

### Storage Adapter (`storageAdapter.test.ts`)

| Test Case | What It Covers | How It Helps |
|-----------|----------------|--------------|
| Returns null for non-existent keys | `InMemoryStorage.getItem` for missing keys | Ensures token lookups fail safely when nothing is stored |
| Stores and retrieves values | Basic set/get behavior | Validates the core storage contract used for tokens |
| Overwrites existing values | Updating an existing key | Ensures token refresh overwrites correctly |
| Removes items | `removeItem` clears data | Confirms logout/clear behaves correctly |
| removeItem on non-existent key does not throw | Edge case on clear | Prevents crashes when clearing already-empty storage |
| Returns in-memory storage by default | `getTokenStorage` / `setTokenStorage` | Confirms default adapter is in-memory (XSS-safe for embeds) |
| Persists values within same adapter instance | Shared storage across calls | Ensures tokens persist for the session |
| Allows custom storage adapter | `setTokenStorageAdapter` | Validates the pluggable storage design |

**Why it matters:** The storage adapter is the foundation for token persistence. Bugs here could leak tokens or break auth.

---

### Token Manager (`tokenManager.test.ts`)

| Test Case | What It Covers | How It Helps |
|-----------|----------------|--------------|
| Stores and retrieves tokens | `setTokens`, `getAccessToken`, `getRefreshToken`, `getExpiresAt` | Confirms tokens are stored and read correctly |
| Stores and retrieves seller token | `setSellerToken` / `getSellerToken` | Validates seller auth token handling |
| Returns true when no expires_at | `isTokenExpired` edge case | Ensures missing expiry is treated as expired |
| Returns true when token is expired | Past expiry date | Validates expiry detection |
| Returns false when token has future expiry | Valid token | Ensures valid tokens are not treated as expired |
| Returns true when within 5 min buffer of expiry | Near-expiry buffer | Confirms proactive refresh before expiry |
| Returns false when no access token | `isAuthenticated` | Ensures unauthenticated state is correct |
| Returns true when valid token exists | Authenticated state | Validates authenticated detection |
| Clears all tokens | `clearTokens` | Ensures logout clears everything including seller token |
| Returns null when tokens are incomplete | `getAllTokens` | Handles partial/corrupt state safely |
| Returns all tokens when complete | Full token retrieval | Validates serialization of token state |
| Throws when no refresh token | `refreshAccessToken` pre-check | Ensures clear error when refresh is impossible |
| Calls API and updates tokens on success | Token refresh flow | Validates the refresh cycle end-to-end |

**Why it matters:** Token management drives auth state. Expiry logic and refresh behavior must be correct or users will be logged out unexpectedly or remain logged in when they shouldn’t.

---

### API Client (`api.test.ts`)

| Test Case | What It Covers | How It Helps |
|-----------|----------------|--------------|
| GET returns JSON on success | `ApiClient.get` with mock fetch | Ensures GET requests and response parsing work |
| POST sends body and returns JSON | `ApiClient.post` | Validates request body and response handling |
| Throws on non-ok response with error message | Error handling from API | Ensures failures surface as meaningful errors |
| Includes Authorization header when includeAuth is true | Auth header injection | Validates that authenticated calls send the Bearer token |

**Why it matters:** All API calls go through `ApiClient`. These tests protect against regressions in request building, error handling, and auth headers.

---

### Purchase Service (`purchaseService.test.ts`)

| Test Case | What It Covers | How It Helps |
|-----------|----------------|--------------|
| Returns wallet balance from API | `getWalletBalance` | Validates balance fetch and response shape |
| Purchases content and returns response | `purchaseContent` | Ensures purchase flow calls correct endpoint with correct payload |
| Returns has_purchased true when purchased | `verifyPurchase` success path | Validates purchase verification logic |
| Returns has_purchased false when not purchased | `verifyPurchase` failure path | Ensures non-purchased state is detected |
| Creates payment session with amount | `createPaymentSession` | Validates payment session creation for Add Funds flow |

**Why it matters:** Purchase and wallet flows are critical. These tests ensure API usage and payloads stay correct as the backend evolves.

---

## 2. Components (Component Tests)

### Overlay (`Overlay.test.tsx`)

| Test Case | What It Covers | How It Helps |
|-----------|----------------|--------------|
| Renders price in the purchase button | Price display | Ensures the correct price is shown to the user |
| Calls onPurchase when Purchase Now is clicked | Button interaction | Validates the main CTA triggers the purchase flow |
| Displays Premium Story badge | Badge text | Confirms branding is present |
| Displays heading and subtitle | Copy | Validates key marketing/UX text |

**Why it matters:** The Overlay is the first screen users see. These tests catch regressions in display and behavior.

---

### Confirm Modal (`ConfirmModal.test.tsx`)

| Test Case | What It Covers | How It Helps |
|-----------|----------------|--------------|
| Shows Ready to purchase when balance is sufficient | Sufficient funds state | Validates balance vs. price logic |
| Shows Insufficient Funds when balance is below price | Insufficient funds state | Ensures shortfall messaging is correct |
| Calls onClose when close button is clicked | Close behavior | Validates modal can be dismissed |
| Calls onConfirm when Purchase Article is clicked | Purchase confirmation | Ensures purchase CTA is wired correctly |
| Shows Add Funds when insufficient balance | Add Funds CTA visibility | Validates alternate path when funds are low |
| Calls onAddFunds when Add Funds is clicked | Add Funds flow | Ensures Add Funds modal is triggered |

**Why it matters:** Confirm Modal sits at the core of the purchase decision. Balance logic and CTAs must behave correctly.

---

### Login Modal (`LoginModal.test.tsx`)

| Test Case | What It Covers | How It Helps |
|-----------|----------------|--------------|
| Renders login UI | Header and copy | Validates layout and content |
| Shows validation error when fields are missing | Form validation | Ensures empty submit shows proper error |
| Submits email login and calls success callback | Email/password login | Validates full login flow and success handling |
| Shows auth error when login fails | Error display | Ensures API errors are surfaced to the user |
| Triggers reset and switch callbacks | Forgot Password & Sign up links | Validates navigation between modals |
| Shows Google error message | Google OAuth error | Ensures Google failure is handled |

**Why it matters:** Login is the gateway to purchases. Validation, error handling, and navigation must be correct.

---

### Signup Modal (`SignupModal.test.tsx`)

| Test Case | What It Covers | How It Helps |
|-----------|----------------|--------------|
| Renders signup UI | Header and copy | Validates layout and content |
| Shows validation error when fields are empty | Form validation | Ensures all required fields are validated |
| Submits signup and calls success callback | Full signup flow | Validates registration and success handling |
| Shows error when signup fails | API error display | Ensures signup failures are shown |
| Triggers switch to login callback | Log in link | Validates navigation to Login Modal |
| Shows Google signup error | Google OAuth error | Ensures Google failure is handled |

**Why it matters:** Signup onboarding must work reliably. Validation and error paths are especially important.

---

### Add Funds Modal (`AddFundsModal.test.tsx`)

| Test Case | What It Covers | How It Helps |
|-----------|----------------|--------------|
| Renders shortfall and suggested amount | Balance vs. price messaging | Validates shortfall and suggested amount calculation |
| Shows validation for invalid amount | Amount validation (min $1) | Ensures invalid amounts are rejected |
| Creates payment session for valid amount | Payment session creation | Validates Stripe session creation flow |
| Calls onClose when cancel is clicked | Cancel behavior | Ensures modal can be closed |

**Why it matters:** Add Funds handles wallet top-ups. Validation and session creation must be correct.

---

### Reset Password (`ResetPassword.test.tsx`)

| Test Case | What It Covers | How It Helps |
|-----------|----------------|--------------|
| Sends reset code and moves to OTP step | Request reset code flow | Validates email submission and step transition |
| Shows API error when reset code request fails | Error handling | Ensures API failures are displayed |
| Calls backToLogin when link clicked | Back navigation | Validates return to login |
| Validates OTP and password in second step | OTP (6 digits) and password (min 6 chars) | Ensures validation rules are enforced |
| Submits new password and calls onClose | Complete reset flow | Validates full flow and success callback |

**Why it matters:** Password reset is sensitive. Validation and error handling must be robust.

---

### Already Purchased Modal (`AlreadyPurchasedModal.test.tsx`)

| Test Case | What It Covers | How It Helps |
|-----------|----------------|--------------|
| Renders confirmation message | Success messaging | Validates that the “already purchased” state is shown correctly |

**Why it matters:** This state must be clear so users understand they already have access.

---

## 3. App Integration (`App.test.tsx`)

| Test Case | What It Covers | How It Helps |
|-----------|----------------|--------------|
| Renders overlay with purchase button when not authenticated | Initial state for unauthenticated user | Validates first screen and CTA |
| Shows confirm modal when user is authenticated and clicks purchase | Auth check + purchase flow | Validates flow from Overlay → Confirm when logged in |
| Unlocks content when already purchased | Auto-unlock on mount | Validates that existing purchases skip the paywall |

**Why it matters:** These tests tie together auth, purchase verification, and modal flow. They catch integration issues that unit tests might miss.

---

## 4. Entry Points (Integration Tests)

### Page Blocker (`page-blocker.test.tsx`)

| Test Case | What It Covers | How It Helps |
|-----------|----------------|--------------|
| Finds script with data-api-key and creates overlay when content found | Full page blocker bootstrap | Validates script config parsing, AuthService calls, overlay creation, and App render for article embeds |

**Why it matters:** Page blocker is the article paywall entry. This test ensures the full bootstrap path works for publishers.

---

### Vimeo Blocker (`vimeo-blocker.test.tsx`)

| Test Case | What It Covers | How It Helps |
|-----------|----------------|--------------|
| Finds vimeo iframe and creates overlay when content found | Full vimeo blocker bootstrap | Validates Vimeo iframe detection, AuthService calls, overlay creation, and App render for video embeds |
| Does not create overlay when no vimeo iframe exists | Early exit | Ensures no overlay or API calls when no video is present |

**Why it matters:** Vimeo blocker is the video paywall entry. These tests ensure correct behavior for both valid and missing-video cases.

---

## How These Tests Help

### 1. Verification Without Manual Testing
You can run `npm run test:run` instead of manually testing every flow after changes.

### 2. Regression Protection
Refactors and new features are less likely to break existing behavior because tests will fail if something regresses.

### 3. Documentation of Behavior
Tests describe how components and flows are expected to behave, which helps onboarding and maintenance.

### 4. Faster Feedback
Tests run in seconds, giving quick feedback during development.

### 5. Safer Deployments
Passing tests give confidence before deploying to staging or production.

---

## Quick Reference

| Area | Files | Tests | Focus |
|------|-------|-------|-------|
| Services | 4 | 30 | API, auth tokens, storage, purchases |
| Components | 7 | 32 | UI, validation, callbacks, flows |
| App | 1 | 3 | End-to-end modal and unlock flow |
| Entries | 2 | 3 | Page and Vimeo blocker bootstrap |
| **Total** | **14** | **68** | Full coverage of critical paths |
