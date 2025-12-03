# LedeWire Embed Script

A lightweight paywall embed script for video content with email authentication.

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

Output: `dist/ledewire.iife.js` and `dist/embed.css`

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
- 🚧 Google OAuth login (UI ready, backend integration pending)
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
