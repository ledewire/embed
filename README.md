# LedeWire Embed Script

A lightweight, embeddable JavaScript library for monetizing video content (Vimeo & HTML5) via LedeWire.

## Features

- **Universal Embed**: Works with a single `<script>` tag.
- **Platform Support**: Supports Vimeo iframes and HTML5 `<video>` elements.
- **Paywall Overlay**: Customizable overlay that blocks playback until unlocked.
- **Modern Stack**: Built with **Preact**, **TypeScript**, and **Tailwind CSS** for performance and developer experience.
- **Shadow DOM**: Uses Shadow DOM to isolate styles and prevent conflicts with host websites.
- **Developer Friendly**: Hot-reload development environment via Vite.

## Prerequisites

- Node.js (v18+)
- Docker (optional, for containerized development)

## Installation

```bash
npm install
```

## Configuration

1.  Copy the example environment file:

    ```bash
    cp .env.dev .env
    ```

2.  Open `.env` and add your Google Client ID:

    ```env
    VITE_GOOGLE_CLIENT_ID=your_actual_client_id
    ```

## Development

Start the development server with hot-reload:

```bash
npm run dev
```

This will serve the `index.html` file at `http://localhost:5173`.

### Docker Development

You can also run the development environment inside a Docker container:

1.  **Build the image:**

    ```bash
    docker build -t ledewire-embed .
    ```

2.  **Run the container:**

    ```bash
    docker run -p 5173:5173 -v $(pwd):/app -v /app/node_modules ledewire-embed
    ```

## Building for Production

To create the minified production bundle:

```bash
npm run build
```

This will generate `dist/ledewire.iife.js`.

## Usage

Include the script on your page with the necessary configuration attributes:

```html
<script
  src="https://cdn.ledewire.com/embed.js" 
  data-content-id="YOUR_CONTENT_ID"
  data-price="2.00"
  data-creator-id="YOUR_CREATOR_ID"
  data-player="vimeo"
></script>
```

**Attributes:**

| Attribute | Description |
| :--- | :--- |
| `data-content-id` | The unique ID of the content from LedeWire. |
| `data-price` | Price to display (e.g., "2.00"). |
| `data-creator-id` | The creator's unique identifier. |
| `data-player` | Player type: `"vimeo"` or `"html5"`. |
| `data-autoplay` | (Optional) `"true"` to autoplay after unlock. |

## Project Structure

- `src/main.tsx`: Entry point. Initializes Shadow DOM and mounts the Preact app.
- `src/App.tsx`: Main application component.
- `src/components/`: React/Preact components (Overlay, LoginModal).
- `src/style.css`: Tailwind CSS entry point.
- `vite.config.ts`: Vite build configuration.
- `tailwind.config.js`: Tailwind configuration.
