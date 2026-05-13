# Steps to Inject LedeWire in Beehiiv Web Posts

## 1: Beehiiv Platform Notes

**Important:** LedeWire's page blocker is a browser script. It can only run on the published web version of a Beehiiv post, not inside an email client.

Beehiiv's post **HTML Snippet** block is useful for basic HTML and embeds, but Beehiiv documents that `<script>` and `<style>` elements are not saved in post snippets. Do not paste the LedeWire `<script>` tag into a normal post HTML Snippet unless you have confirmed your Beehiiv plan/editor preserves scripts in that location.

Use a Beehiiv website/template/custom-code area that allows JavaScript on the web post page. If your Beehiiv workspace does not expose a script-preserving custom-code area, use an external article page or a custom Beehiiv website page that supports script injection, then link to that page from the newsletter email.

#### NOTE: Paywall on Beehiiv will only be visible if the published web post URL is registered in LedeWire.

## 2: Register the Beehiiv Post in LedeWire

1. Publish or preview the Beehiiv post on the web.
2. Copy the canonical web URL, for example:
   ```text
   https://yourpublication.beehiiv.com/p/premium-market-brief
   ```
3. In the LedeWire dashboard, create the content record.
4. Set the content type to **Article** or **External Ref**.
5. Set the **Content URI** to the Beehiiv web URL without query parameters.
6. Set the price and publish the content.

## 3: Local Script Testing

Before testing in Beehiiv, serve the local build from this repo:

```bash
cd /embed
npm run build
npx serve .
```

Leave this running. The local page blocker script will be available at:

```text
http://localhost:3000/dist/page-blocker.iife.js
```

For production, replace the local URL with a pinned CDN release:

```text
https://cdn.jsdelivr.net/gh/ledewire/embed@v1.0.0/dist/page-blocker.iife.js
```

## 4: Immediate Paywall Implementation

Use this when the paywall should appear as soon as the Beehiiv web post loads.

Paste this into the Beehiiv custom-code area that runs on the published web post page:

```html
<script
  src="https://cdn.jsdelivr.net/gh/ledewire/embed@v1.0.0/dist/page-blocker.iife.js"
  data-api-key="YOUR_PUBLISHABLE_API_KEY"
  data-creator-id="YOUR_CREATOR_ID">
</script>
```

For local testing:

```html
<script
  src="http://localhost:3000/dist/page-blocker.iife.js"
  data-api-key="YOUR_PUBLISHABLE_API_KEY"
  data-creator-id="YOUR_CREATOR_ID">
</script>
```

## 5: Scroll Trigger Implementation

Use this when readers should see part of the Beehiiv web post before the paywall appears.

```html
<script
  src="https://cdn.jsdelivr.net/gh/ledewire/embed@v1.0.0/dist/page-blocker.iife.js"
  data-api-key="YOUR_PUBLISHABLE_API_KEY"
  data-creator-id="YOUR_CREATOR_ID"
  data-trigger="scroll"
  data-scroll-threshold="0.7">
</script>
```

`data-scroll-threshold="0.7"` means the paywall appears after the reader reaches 70% of the scrollable page. Use a lower value such as `0.4` for shorter posts.

If Beehiiv strips custom `data-*` attributes but preserves the script URL, configure the trigger with query parameters:

```html
<script
  src="https://cdn.jsdelivr.net/gh/ledewire/embed@v1.0.0/dist/page-blocker.iife.js?trigger=scroll&scrollThreshold=0.7"
  data-api-key="YOUR_PUBLISHABLE_API_KEY"
  data-creator-id="YOUR_CREATOR_ID">
</script>
```

## 6: URL Override for Beehiiv Preview or Custom Domains

The page blocker looks up content using:

```text
window.location.origin + window.location.pathname
```

If Beehiiv preview URLs, tracking parameters, or custom-domain redirects do not match the URL registered in LedeWire, set the canonical URL explicitly:

```html
<script
  src="https://cdn.jsdelivr.net/gh/ledewire/embed@v1.0.0/dist/page-blocker.iife.js"
  data-api-key="YOUR_PUBLISHABLE_API_KEY"
  data-creator-id="YOUR_CREATOR_ID"
  data-external-url="https://yourpublication.beehiiv.com/p/premium-market-brief">
</script>
```

Use the same `data-external-url` value as the **Content URI** in LedeWire.

## 7: Email Fallback

The LedeWire overlay will not run in inboxes. For the email version of a Beehiiv post:

1. Include a normal Beehiiv button or link to the published web post.
2. Make the web post URL the paid-content destination.
3. Let the LedeWire page blocker run on the web version after the reader clicks through.

## Troubleshooting

### Script disappears after saving

Beehiiv post HTML Snippets can strip `<script>` tags. Move the code to a Beehiiv website/template/custom-code area that preserves JavaScript, or use a custom page/external site for the paid article.

### Paywall does not appear

- Confirm the published Beehiiv web post URL exactly matches the LedeWire **Content URI**.
- Check for custom-domain redirects and trailing slash differences.
- Use `data-external-url` when the runtime URL differs from the registered URL.
- Check the browser console for API key or network errors.
- If scroll trigger is enabled, scroll past the configured threshold.

### Paywall appears on the wrong Beehiiv page

Only place the script on pages that should be paywalled, or use page-specific custom code if Beehiiv provides it. The current embed does not enforce `data-match-pattern`.

### Scroll trigger never fires

- Confirm the page is tall enough to scroll.
- Use a lower threshold such as `0.4`.
- Remove `data-trigger="scroll"` for short posts where immediate blocking is more reliable.

## References

- [Using HTML in Beehiiv posts](https://www.beehiiv.com/support/article/4413248700439-Using-HTML-in-beehiiv-posts) documents that post HTML snippets can be used for custom HTML, but that `<script>` and `<style>` elements are not saved in those snippets.
- [Ways to migrate audio and video posts from Substack to Beehiiv](https://beehiivhelp.zendesk.com/hc/en-us/articles/35448935420951-Ways-to-migrate-audio-and-video-posts-from-Substack-to-beehiiv) documents the web-post vs. email-client limitation for iframe-style embeds, which is why the LedeWire flow should link email readers to the web post.
