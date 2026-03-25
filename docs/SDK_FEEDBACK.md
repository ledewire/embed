# SDK Feedback: `@ledewire/browser`

Observations, type gaps, and improvement suggestions collected during the
migration of the `embed` project from hand-rolled API calls to the SDK.
All line numbers reference `node_modules/@ledewire/browser/dist/index.d.ts`.

| Version | Status                                                      |
| ------- | ----------------------------------------------------------- |
| v0.5.0  | Original feedback raised                                    |
| v0.6.0  | Items #1, #2, #3, #4, #6, #7, #8 resolved — see notes below |

---

## Bugs / Breaking Issues

### ✅ 1. `ContentResponse` is not exported — **Resolved in v0.6.0**

`ContentResponse` is now exported (`export declare type ContentResponse`, line 1344).

---

### ✅ 2. `WalletPaymentSessionRequest.metadata` typed as `Record<string, never>` — **Resolved in v0.6.0**

Fixed to `{ [key: string]: unknown }` — consumers can now attach arbitrary metadata to payment sessions.

---

### ✅ 3. `ForbiddenError` JSDoc imports from the wrong package — **Resolved in v0.6.0**

The JSDoc example now correctly imports from `'@ledewire/browser'`. A separate
example showing the `@ledewire/node` import has also been added for server-side consumers.

---

## Type Gaps / Ergonomics

### 4. `CheckoutState` and `CheckoutStateResponse` are confusingly duplicated

Two separate exported types represent essentially the same concept:

| Type                                           | Source         | `has_sufficient_funds`                | `next_required_action` variants                |
| ---------------------------------------------- | -------------- | ------------------------------------- | ---------------------------------------------- |
| `CheckoutState` (interface, line 501)          | hand-written   | `boolean` (non-nullable)              | `CheckoutNextAction` (includes `view_content`) |
| `CheckoutStateResponse` (type alias, line 512) | OpenAPI schema | `boolean \| null` (nullable optional) | same enum but via schema                       |

`lw.checkout.state()` returns `Promise<CheckoutStateResponse>`, but
`CheckoutState` looks like the "intended" interface and is more ergonomic.
Having two overlapping types with different nullability on the same field causes
unnecessary `?.` chains or non-null assertions in consumer code.

**Ask:** Consolidate to a single exported type, or clearly document that
`CheckoutState` is the consumer-facing alias and `CheckoutStateResponse` is
internal.

---

### ✅ 5. `SellerContentSearchRequest` has no typed provider-identifier search — **Resolved in v0.6.0**

`external_identifier?: string` has been added for exact-match platform ID lookup
(e.g. `'vimeo:123456789'`). This replaces the previous untyped `metadata: { vimeo_id }`
workaround in `vimeo-blocker.tsx`.

The `metadata: { external_url }` workaround in `page-blocker.tsx` has been replaced
with the existing typed `uri` partial-match field, which is the correct mechanism
for external URL lookups.

**Remaining:** No issues — both search paths are now typed.

---

### ✅ 6. No `sessionStorageAdapter` shipped — **Resolved in v0.6.0**

`sessionStorageAdapter()` is now exported from `@ledewire/browser`. The
hand-rolled shim in `src/services/sdkClient.ts` has been removed and replaced
with the SDK-provided implementation. Default key is `"lw:tokens"`.

---

### ✅ 7. `lw.auth.loginWithApiKey` belongs conceptually under `lw.seller` — **Resolved in v0.6.0**

`loginWithApiKey` has moved to `lw.seller.loginWithApiKey()`. The call in
`src/services/sdkClient.ts` has been updated accordingly.

---

### ✅ 8. `content_body` and `teaser` are base64-encoded but this is not surfaced in JSDoc — **Resolved in v0.6.0**

The SDK now decodes base64 transparently before returning — `content_body` and
`teaser` are delivered as plain UTF-8 text. Method-level JSDoc on
`lw.content.getWithAccess()`, `lw.seller.content.get()`, and
`lw.seller.content.list()` all note this explicitly. No `atob()` calls are
needed in consumer code.

---

### 9. `metadata.read_time` renamed to `metadata.reading_time` — **Open**

The embed codebase (and presumably existing API consumers) reference
`content.metadata.read_time`. The SDK's `ContentResponse.metadata` defines
`reading_time` instead. This silent rename will cause runtime `undefined`
rather than a type error in any project that doesn't have strict-null checks
enabled everywhere.

**Ask:** Confirm whether this is an intentional API rename or a doc/codegen
inconsistency. If intentional, add a deprecation note in the changelog.

---

### 10. `lw.content.getWithAccess(id, userId?)` — seller-proxy behaviour undocumented — **Open**

```ts
getWithAccess(id: string, userId?: string): Promise<ContentWithAccessResponse>;
```

The compiled implementation passes `userId` as a `user_id` query parameter:

```js
// from index.js
async getWithAccess(e, t) {
  const r = {};
  return t !== void 0 && (r.user_id = t), this.http.get(
    `/v1/content/${e}/with-access`,
    Object.keys(r).length > 0 ? r : void 0
  );
}
```

So this is a seller-proxy call: check access for a _specific buyer_ while
a seller token is active in the SDK. The existing `@param` doc says only
`"Optional user ID to check a specific user's access status"` — which is not
enough context for a browser consumer to know:

1. Whether the call requires seller auth (i.e. `loginWithApiKey` must have run
   first) or buyer auth.
2. Whether passing `userId` with only a buyer token in storage silently falls
   back to the authenticated user or throws.
3. That this is the mechanism for a seller dashboard to preview buyer access
   state — a completely different use case from the typical buyer embed flow.

**Ask:** Expand the JSDoc to explicitly state that `userId` requires an active
seller token, describe the seller-dashboard use case, and add an `@example`
showing the correct bootstrap sequence. Consider also whether this method
should live under `lw.seller.content` rather than `lw.content` when a
`userId` is provided, to make the auth requirement obvious from the namespace.

---

## Observations / Positive Notes

- The `lw.checkout.state()` single-call pattern is a significant DX improvement
  over the two-call mount sequence in the current `App.tsx` — the `next_required_action`
  enum cleanly drives a `switch` without additional boolean logic.
- Typed error classes (`AuthError`, `PurchaseError`, `ForbiddenError`,
  `NotFoundError`) enable clean `instanceof` guards in error handlers and
  test assertions — a meaningful upgrade from matching on string messages.
- `lw.auth.loginWithGoogle()` storing tokens correctly resolves a long-standing
  OAuth bug in the hand-rolled implementation.
- The `onAuthExpired` callback in `BrowserClientConfig` is a thoughtful addition
  for embeds that need to prompt re-authentication without a full page reload.
