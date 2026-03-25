# **LedeWire HTML5 Pay-to-Unlock Embed (MVP Engineering Brief)**

> **Historical document.** This is the original MVP brief written before the SDK (`@ledewire/browser`) existed. The implementation has since evolved significantly — see the [Integration Guide](integration-guide.md) for current usage and the source code for current architecture. This document is preserved as a record of the original design intent.

---

### **Objective**

Create a lightweight embeddable JavaScript file (`ledewire.js`) that allows creators to monetize individual videos (Vimeo or HTML5) through the existing LedeWire API.
Viewers should see a “Unlock to Watch – $X” overlay until they authenticate and complete a purchase.

---

## **🧱 High-Level Architecture**

**Core Idea:**
 A single script tag inserted into any page should:

1. Detect the video (Vimeo iframe or `<video>` element).
2. Render a paywall overlay with price and unlock button.
3. On click, authenticate the user and call `/v1/purchase`.
4. On success, remove the overlay and trigger playback.

---

### Basic Flow
The codebase is divided into two main components: the entry point script and the overlay component.
The entry point script is responsible for detecting the video element and determine weather to show the paywall or not.
The overlay component is responsible for rendering the paywall and handling user interactions.

This way we can easily swap out the entry point script for a different one, such as a page blocker, without having to modify the overlay component.

## **Technical Requirements**

### **Script Tag Format**

Creators will use:
```html
<script
  src="https://cdn.ledewire.com/embed.js"
  data-content-id="abc123"
  data-price="2.00"
  data-creator-id="creator_456"
  data-player="vimeo"
></script>
```

#### **Attributes**

| Name | Description |
| ----- | ----- |
| `data-content-id` | LedeWire content ID (from `/v1/seller/content`) |
| `data-price` | USD price as string |
| `data-creator-id` | Creator’s unique ID or subdomain |
| `data-player` | `"vimeo"` or `"html5"` |
| `data-autoplay` | (optional) `"true"` if you want to start playback automatically |

---

## **Script Behavior (Pseudocode)**

```JavaScript
// ledewire.js (pseudo)

(async function() {
  const script = document.currentScript;
  const contentId = script.dataset.contentId;
  const price = script.dataset.price;
  const playerType = script.dataset.player;
  const creatorId = script.dataset.creatorId;

  // 1️⃣ Locate video element
  let videoEl;
  if (playerType === 'vimeo') {
    videoEl = document.querySelector('iframe[src*="vimeo.com"]');
  } else {
    videoEl = document.querySelector('video');
  }

  if (!videoEl) return console.warn('LedeWire: No video found');

  // 2️⃣ Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'ledewire-overlay';
   overlay.innerHTML =
    <div class="ledewire-lock">
      <p>Unlock to Watch – $${price}</p>
      <button id="ledewire-purchase">Unlock Now</button>
    </div>
   ;
  videoEl.parentElement.style.position = 'relative';
   overlay.style.cssText =
    position:absolute;top:0;left:0;width:100%;height:100%;
    background:rgba(0,0,0,0.8);display:flex;
    align-items:center;justify-content:center;
    color:white;z-index:9999;
   ;
  videoEl.parentElement.appendChild(overlay);

  // 3️⃣ Purchase flow
  document.getElementById('ledewire-purchase').onclick = async () => {
    try {
      // 3a: Check auth
      const auth = await fetch('/v1/checkout/state/' + contentId, {credentials: 'include'}).then(r=>r.json());
      if (auth.next_required_action === 'authenticate') {
        return openAuthModal(); // use existing LedeWire auth modal
      }

      // 3b: Fund wallet or purchase
      if (auth.next_required_action === 'purchase') {
        await fetch('/v1/purchases', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          credentials: 'include',
          body: JSON.stringify({ content_id: contentId, price_cents: Math.round(parseFloat(price) * 100) })
        });
      }

      // 3c: Unlock
      overlay.remove();
      if (playerType === 'vimeo') {
        const player = new Vimeo.Player(videoEl);
        player.play();
      } else {
        videoEl.play();
      }

    } catch (err) {
      console.error('LedeWire Purchase Error:', err);
    }
  };
})();
```
---

## **API Endpoints Used**:

| Action | Endpoint | Notes |
| :---- | :---- | :---- |
| Check state | `GET /v1/checkout/state/{content_id}` | Determines `next_required_action` |
| Purchase | `POST /v1/purchases` | Requires JWT or session cookie |
| Balance check | `GET /v1/wallet/balance` | Optional for pre-validation |
| Auth | `/v1/auth/login/email` or OAuth | Use existing auth modal |

---

## **🎨 Minimal CSS (Inline or CDN)**
```css
.ledewire-overlay {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.75);
  display: flex; align-items: center; justify-content: center;
  flex-direction: column;
  color: #fff;
  font-family: sans-serif;
}

.ledewire-lock button {
  background: #00aaff;
  border: none;
  padding: 0.6em 1.2em;
  border-radius: 4px;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
}
```
---

## **Optional Phase 2 Enhancements (after MVP)**

* Auto-detect “already purchased” state on page load (skip overlay).
* Add `/ahoy/events` calls for analytics (“unlock\_clicked”, “video\_unlocked”).
* Add data attributes for styling (`data-theme`, `data-button-text`).
* Support YouTube/Wistia players using the same unlock interface.

---

##  **Acceptance Criteria**

* Loads on any HTML page with a single `<script>` tag.
* Works for both Vimeo iframe and native HTML5 `<video>`
* Uses live `/v1/purchase` API endpoint for transactions.
* Displays and removes overlay cleanly.
* No external dependencies.
* No cross-origin or CSP violations.

---

## **Stretch Deliverables (Week 2\)**

* `beehiivAdapter.js`: small wrapper that injects the same logic into Beehiiv posts.
* Simple CLI or static generator to produce embed snippet from a content\_id \+ price.

---

**Outcome:**
 By the end of Week 1, you’ll have a fully working video paywall you can hand to your first creator.
 They can drop one `<script>` tag into their Vimeo or HTML5 player page and start generating revenue.

---

