# @ledewire/gate

A lightweight paywall script for web content — drop in a single `<script>` tag to gate articles and Vimeo videos behind a LedeWire paywall.

## 📖 Documentation

| Document                                           | Description                                                                                              |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| [Integration Guide](docs/integration-guide.md)     | **Start here if you're embedding on a site.** Script tag usage, attributes, viewer flow, troubleshooting |
| [CDN Release Roadmap](docs/cdn-release-roadmap.md) | jsDelivr CDN setup, GitHub Actions release process, version pinning                                      |
| [Architecture](docs/architecture.md)               | How the embed works internally — entry points, Shadow DOM, modal state machine                           |
| [Testing](docs/testing.md)                         | Test coverage summary and how to run tests                                                               |

## 🚀 Quick Start

### Development (2 Terminals Required)

**Terminal 1 - Start CORS Proxy:**

```bash
npm run proxy
```

_Keep this running_

**Terminal 2 - Start Dev Server:**

```bash
npm run dev
```

**Open Browser:**

```
http://localhost:5173
```

### Production Build

```bash
npm run build
```

Output: `dist/vimeo-blocker.iife.js`, `dist/page-blocker.iife.js`, and `dist/embed.css`

## 📁 Environment Configuration

### `.env` (Development)

```bash
VITE_API_BASE_URL=http://localhost:8010  # CORS proxy for local dev
```

### `.env.production` (Production)

```bash
VITE_API_BASE_URL=https://api.ledewire.com/v1  # Direct API (no proxy)
```

## 🔧 Why CORS Proxy?

**The Problem:**

- ✅ API works in Postman
- ❌ API blocks browser requests from `localhost` (CORS policy)

**The Solution:**

- **Development:** Use local CORS proxy (`localhost:8010`)
- **Production:** Direct API calls work (no CORS issues)

```
Development Flow:
Browser → http://localhost:8010 (proxy) → https://api.ledewire.com/v1 ✅

Production Flow:
Browser → https://api.ledewire.com/v1 ✅
```

## 🎯 Features

- ✅ Email/Password authentication
- � Google OAuth login (coming soon)
- ✅ Video paywall overlay
- ✅ Purchase confirmation flow
- ✅ Token management (JWT)
- ✅ **Auto token refresh** - Seamless session extension
- ✅ **Skip login for authenticated users** - Better UX
- ✅ Responsive design
- ✅ Shadow DOM isolation

## 📦 Bundle Size

- **JS:** 35.99 kB (11.36 kB gzipped)
- **CSS:** 5.13 kB (1.35 kB gzipped)

## 🛠️ Tech Stack

- Preact
- TypeScript
- Tailwind CSS
- Vite

## 📚 API Integration

### Base URL

```
https://api.ledewire.com/v1
```

### Endpoints Used

- `POST /auth/login/email` - Email/password login
- `POST /auth/token/refresh` - Refresh access token

## 🐛 Troubleshooting

### CORS Error in Browser?

Make sure the proxy is running:

```bash
npm run proxy
```

### Port 8010 Already in Use?

```bash
kill -9 $(lsof -ti:8010)
```
