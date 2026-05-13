# Steps to Inject a Script in Local Ghost Setup
## 1: Local Ghost via Ghost CLI (no Docker, no MySQL)
**Requirements:** Node.js **v22.13.1 or newer**. Ghost 6.x does not run on Node 20. If you see *"Ghost v6.x is not compatible with the current Node version"*, upgrade Node (e.g. with nvm: `nvm install 22 && nvm use 22`).

**Important:** Use a **new, empty directory** (do not run this inside the `embed` repo).

```bash
# Optional: if you use nvm and have Node 20, switch to Node 22
nvm install 22 && nvm use 22
node -v   # should show v22.x

# Install Ghost CLI globally (once)
npm install ghost-cli@latest -g

# Create an empty directory and install Ghost there (not inside embed!)
mkdir -p ~/my-ghost && cd ~/my-ghost
ghost install local
```

- When it finishes, open **http://localhost:2368**, complete the one-time setup, then use **Settings → Code Injection → Site Footer** for the paywall script injection then save.
- Useful commands (run from `~/my-ghost`): `ghost stop`, `ghost start`, `ghost ls`.
- If you see "Current directory is not empty", you are in the wrong folder; use an empty one.

#### NOTE: Paywall on Ghost will only be visible if the external URL (for example, **http://localhost:2368**) is registered in LedeWire.

## Implementation
1. **Serve the script** so Ghost can load it. From the embed repo (in a separate terminal):
   ```bash
   cd /embed
   npm run build
   npx serve .
   ```
   Leave this running. The script will be at **http://localhost:3000/dist/page-blocker.iife.js**.
2. **In Ghost admin:** open **Settings** (gear in the sidebar) → **Code Injection**.
3. In **Site Footer**, paste this (replace `YOUR_API_KEY` with your API key – for testing you can use the one in this repo’s `index.html`):
   ```html
   <script src="http://localhost:3000/dist/page-blocker.iife.js"
     data-api-key="YOUR_API_KEY"
     data-creator-id="creator_456">
   </script>
   ```
4. Click **Save**, and the paywall should appear on the page for registered content.

## Scroll Trigger Option

Use the scroll trigger when Ghost readers should see part of the post before the paywall appears:

```html
<script src="http://localhost:3000/dist/page-blocker.iife.js"
  data-api-key="YOUR_API_KEY"
  data-creator-id="creator_456"
  data-trigger="scroll"
  data-scroll-threshold="0.7">
</script>
```

`data-scroll-threshold="0.7"` means the paywall appears after the reader reaches 70% of the scrollable page. If the post is short, use a lower value or remove `data-trigger="scroll"` to block immediately.
