# CDN Release Roadmap

**Distribution strategy:** jsDelivr CDN via GitHub — no NPM registry required.

---

## How It Works

jsDelivr automatically mirrors any public GitHub repository. Once a git tag is pushed and `dist/` files are committed to that tag, the bundles are instantly available at:

```
https://cdn.jsdelivr.net/gh/ledewire/embed@<version>/dist/vimeo-blocker.iife.js
https://cdn.jsdelivr.net/gh/ledewire/embed@<version>/dist/page-blocker.iife.js
```

**Key facts:**
- No registration with jsDelivr needed — it's fully automatic
- Files must exist in the **git tree at that tag** (jsDelivr reads from the commit, not release assets)
- jsDelivr provides global CDN, HTTP/2, gzip, and cache headers automatically
- `dist/` is already tracked in git (confirmed: not in `.gitignore`), so this works today

---

## Repository Requirements

Before the first release, confirm these are in place:

- [ ] The GitHub repo (`ledewire/embed`) is **public**
- [ ] Branch protection on `main` requires the CI workflow to pass before merge
- [ ] `dist/` remains tracked in git (do **not** add it to `.gitignore`)

---

## GitHub Actions Workflows

Two workflows are provided in `.github/workflows/`.

### 1. CI — `.github/workflows/ci.yml`

**Trigger:** Every push to `main` and every pull request targeting `main`.

**What it does:**
1. Installs dependencies (`npm ci`)
2. Runs the full test suite (`npm run test:run`) — 68 tests across services, components, and entry points
3. Runs a full production build to verify both bundles compile cleanly
4. Uploads `dist/` as a build artifact (kept 7 days) for inspection

**Purpose:** Acts as the merge gate. No broken code reaches `main`.

---

### 2. Release — `.github/workflows/release.yml`

**Trigger:** Manual via GitHub UI — go to **Actions → Release → Run workflow**.

**Inputs:**
| Input | Required | Example |
|---|---|---|
| `version` | Yes | `1.2.0` |
| `release_notes` | No | `Add page-blocker support` |

**What it does, step by step:**
1. Checks out `main` with full git history
2. Installs dependencies
3. **Runs all tests** — release is aborted if any test fails
4. Bumps `version` in `package.json` (no local git tag yet)
5. Builds both IIFE bundles (`npm run build`)
6. Commits `package.json`, `package-lock.json`, and `dist/` with message `chore: release v1.2.0`
7. Pushes the commit to `main`
8. Creates and pushes an annotated git tag `v1.2.0`
9. Creates a GitHub Release with the tag, title, and notes; attaches both JS files as downloadable assets
10. Prints the final jsDelivr CDN URLs to the workflow log

**Why this order?** Tests run before the version bump and build. If tests fail, nothing is committed or tagged — `main` stays clean.

---

## Release Process (Step-by-Step)

### First Release

1. Ensure `main` is in a releasable state and CI is green
2. Go to `github.com/ledewire/embed` → **Actions** → **Release** → **Run workflow**
3. Enter version: `1.0.0`
4. Optionally add release notes
5. Click **Run workflow**
6. Monitor the run — CDN URLs appear in the final step's output

The embed script will then be live at:
```
https://cdn.jsdelivr.net/gh/ledewire/embed@v1.0.0/dist/vimeo-blocker.iife.js
```

### Subsequent Releases

Same process. Use semantic versioning:

| Change type | Version bump | Example |
|---|---|---|
| Bug fix | Patch | `1.0.0` → `1.0.1` |
| New feature, backwards-compatible | Minor | `1.0.0` → `1.1.0` |
| Breaking change in embed API | Major | `1.0.0` → `2.0.0` |

---

## Customer Integration

### Vimeo Paywall

```html
<script
  src="https://cdn.jsdelivr.net/gh/ledewire/embed@v1.0.0/dist/vimeo-blocker.iife.js"
  data-api-key="YOUR_API_KEY"
  data-creator-id="YOUR_CREATOR_ID"
  data-player="VIMEO_PLAYER_ID"
></script>
```

### Page Paywall

```html
<script
  src="https://cdn.jsdelivr.net/gh/ledewire/embed@v1.0.0/dist/page-blocker.iife.js"
  data-api-key="YOUR_API_KEY"
  data-creator-id="YOUR_CREATOR_ID"
></script>
```

### Version Pinning Guidance for Customers

| URL pattern | Behaviour | Recommendation |
|---|---|---|
| `@v1.0.0` | Exact version — never changes | ✅ Production |
| `@v1.0` | Latest patch of 1.0.x | Acceptable |
| `@v1` | Latest minor/patch of v1.x | Acceptable |
| (no version) | Latest commit on default branch | ❌ Never in production |

Always recommend customers pin to at least a minor version (`@v1.0`) so they receive bug fixes automatically but aren't surprised by new features.

---

## Versioning Constraints

Because the script is embedded on third-party sites by customers, version discipline is more important than in a typical app:

- **Never make breaking changes within a major version.** Customers on `@v1` should always keep working.
- A "breaking change" for this embed means: removing or renaming a `data-*` attribute, changing authentication behaviour, or altering the visual overlay in a way that requires customer action.
- Consider maintaining multiple major version branches (e.g. `v1`, `v2`) if a breaking change is needed, to give customers time to migrate.

---

## jsDelivr Cache Behaviour

- jsDelivr aggressively caches by version tag (permanent cache for immutable tags)
- After a release, propagation to all edge nodes typically takes a few minutes
- Purge the cache manually at `https://www.jsdelivr.com/tools/purge` if needed (rare)
- The `@latest` pseudo-tag for GitHub is **not recommended** — it bypasses caching and can serve stale content

---

## Future Considerations

These are out of scope for now but worth knowing:

- **Subresource Integrity (SRI):** Once on jsDelivr, you can get a pre-computed SRI hash at `https://www.jsdelivr.com/package/gh/ledewire/embed` to give customers a tamper-proof `integrity=""` attribute.
- **NPM publish:** If the project ever needs to be consumed as a module (not just a script tag), publishing to NPM as `@ledewire/embed` would enable `npm install` usage. The release workflow is already structured to make this a simple addition.
- **Automated changelogs:** Replace the simple `git log` auto-notes with [Conventional Commits](https://www.conventionalcommits.org/) + a changelog generator if the release cadence increases significantly.
