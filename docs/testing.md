# Test Coverage Summary

This document describes what test cases we have covered in the @ledewire/gate project and how they help ensure the paywall works as intended.

---

## Overview

The project has **42 automated tests** across **11 test files**, covering the SDK client, components, entry points, and the main App flow.

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

### SDK Client (`sdkClient.test.ts`)

| Test Case | What It Covers | How It Helps |
|-----------|----------------|--------------|
| Initialises the SDK with the provided api key and session storage | `createSdkClient` calls `init` with correct config | Ensures the SDK is bootstrapped correctly on script load |
| Dispatches `lw:auth-expired` on window when `onAuthExpired` is called | Custom event dispatch from `onAuthExpired` hook | Validates that session expiry signals the UI to re-prompt login |
| Returns the client after `createSdkClient` | `getSdkClient` singleton | Ensures the SDK client is accessible after initialisation |

**Why it matters:** `sdkClient.ts` is the single integration point with `@ledewire/browser`. These tests verify correct bootstrap, session expiry wiring, and singleton behaviour.

---

## 2. Components (Component Tests)

### Overlay (`Overlay.test.tsx`)

| Test Case | What It Covers | How It Helps |
|-----------|----------------|--------------|
| Renders price in the purchase button | Price display | Ensures the correct price is shown to the user |
| Calls onPurchase when Purchase Now is clicked | Button interaction | Validates the main CTA triggers the purchase flow |
| Displays Premium Story badge | Badge text | Confirms branding is present |
| Displays heading and subtitle | Copy | Validates key marketing/UX text |

---

### Confirm Modal (`ConfirmModal.test.tsx`)

| Test Case | What It Covers | How It Helps |
|-----------|----------------|--------------|
| Shows Ready to purchase when balance is sufficient | Sufficient funds state | Validates balance vs. price logic |
| Shows Insufficient Funds when balance is below price | Insufficient funds state | Ensures shortfall messaging is correct |
| Calls onClose when close button is clicked | Close behaviour | Validates modal can be dismissed |
| Calls onConfirm when Purchase Article is clicked | Purchase confirmation | Ensures purchase CTA is wired correctly |
| Shows Add Funds when insufficient balance | Add Funds CTA visibility | Validates alternate path when funds are low |
| Calls onAddFunds when Add Funds is clicked | Add Funds flow | Ensures Add Funds modal is triggered |

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

---

### Add Funds Modal (`AddFundsModal.test.tsx`)

| Test Case | What It Covers | How It Helps |
|-----------|----------------|--------------|
| Renders shortfall and suggested amount | Balance vs. price messaging | Validates shortfall and suggested amount calculation |
| Shows validation for invalid amount | Amount validation (min $1) | Ensures invalid amounts are rejected |
| Creates payment session for valid amount | Payment session creation | Validates Stripe session creation flow |
| Calls onClose when cancel is clicked | Cancel behaviour | Ensures modal can be closed |

---

### Reset Password (`ResetPassword.test.tsx`)

| Test Case | What It Covers | How It Helps |
|-----------|----------------|--------------|
| Sends reset code and moves to OTP step | Request reset code flow | Validates email submission and step transition |
| Shows API error when reset code request fails | Error handling | Ensures API failures are displayed |
| Calls backToLogin when link clicked | Back navigation | Validates return to login |
| Validates OTP and password in second step | OTP (6 digits) and password (min 6 chars) | Ensures validation rules are enforced |
| Submits new password and calls onClose | Complete reset flow | Validates full flow and success callback |

---

### Already Purchased Modal (`AlreadyPurchasedModal.test.tsx`)

| Test Case | What It Covers | How It Helps |
|-----------|----------------|--------------|
| Renders confirmation message | Success messaging | Validates that the "already purchased" state is shown correctly |

---

## 3. App Integration (`App.test.tsx`)

| Test Case | What It Covers | How It Helps |
|-----------|----------------|--------------|
| Renders overlay with purchase button when not authenticated | Initial state for unauthenticated user | Validates first screen and CTA |
| Shows confirm modal when checkout state is `purchase` and user clicks buy | Auth check + purchase flow | Validates flow from Overlay → Confirm when logged in |
| Unlocks content when checkout state is `view_content` on mount | Auto-unlock on mount | Validates that existing purchases skip the paywall |
| Resets to login modal when `lw:auth-expired` event fires | Session expiry handling | Ensures stale sessions re-prompt login without a page reload |

**Why it matters:** These tests tie together checkout state, modal transitions, and session management. They catch integration issues that unit tests miss.

---

## 4. Entry Points (Integration Tests)

### Page Blocker (`page-blocker.test.tsx`)

| Test Case | What It Covers | How It Helps |
|-----------|----------------|--------------|
| Finds script with `data-api-key` and creates overlay when content found | Full page blocker bootstrap | Validates script config parsing, SDK client creation, content lookup by URI, overlay creation, and App render |

**Why it matters:** Page blocker is the article paywall entry. This test ensures the full immediate-mode bootstrap path works end-to-end.

**Scroll trigger coverage note:** Scroll-trigger mode is implemented in `page-blocker.tsx` and should be manually verified until dedicated automated coverage is added. Test the script with `data-trigger="scroll"` and `data-scroll-threshold="0.7"`, confirm no overlay appears on initial load, scroll past the configured threshold, then confirm the same overlay and purchase flow render.

---

### Vimeo Blocker (`vimeo-blocker.test.tsx`)

| Test Case | What It Covers | How It Helps |
|-----------|----------------|--------------|
| Finds Vimeo iframe and creates overlay when content found | Full Vimeo blocker bootstrap | Validates iframe detection, SDK client creation, content lookup by `external_identifier`, overlay creation, and App render |
| Does not create overlay when no Vimeo iframe exists | Early exit | Ensures no overlay or API calls when no video is present |

**Why it matters:** Vimeo blocker is the video paywall entry. These tests ensure correct behaviour for both valid and missing-video cases.

---

## How These Tests Help

### 1. Verification Without Manual Testing
Run `npm run test:run` instead of manually testing every flow after changes.

### 2. Regression Protection
Refactors and new features are less likely to break existing behaviour because tests fail if something regresses.

### 3. Documentation of Behaviour
Tests describe how components and flows are expected to behave, aiding onboarding and maintenance.

### 4. Faster Feedback
Tests run in seconds, giving immediate feedback during development.

### 5. Safer Deployments
Passing tests give confidence before deploying to staging or production.

---

## Quick Reference

| Area | Files | Tests | Focus |
|------|-------|-------|-------|
| Services | 1 | 3 | SDK client bootstrap, session expiry |
| Components | 7 | 28 | UI, validation, callbacks, flows |
| App | 1 | 4 | Checkout state, modal flow, session expiry |
| Entries | 2 | 3 | Page and Vimeo blocker bootstrap |
| **Total** | **11** | **42** | Full coverage of critical paths |
