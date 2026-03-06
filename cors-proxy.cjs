#!/usr/bin/env node

/**
 * CORS Proxy for LOCAL DEVELOPMENT ONLY.
 * Do not use in production. Proxies to API and restricts origins/headers.
 */

const http = require("http");
const https = require("https");
const url = require("url");

const PORT = 8010;
const TARGET = "https://api-staging.ledewire.com/v1";

const ALLOWED_ORIGINS = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

const FORWARD_REQUEST_HEADERS = [
  "content-type",
  "authorization",
  "accept",
  "accept-language",
];

function isAllowedOrigin(origin) {
  if (!origin) return false;
  return ALLOWED_ORIGINS.some((re) => re.test(origin.trim()));
}

function getCorsOrigin(req) {
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) return origin;
  return "http://localhost:5173";
}

function copyForwardedHeaders(req) {
  const out = {};
  const raw = req.headers;
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = raw[name];
    if (value) out[name] = value;
  }
  return out;
}

const FORWARD_RESPONSE_HEADERS = [
  "content-type",
  "content-length",
  "cache-control",
];

function copyResponseHeaders(proxyRes) {
  const out = {};
  const raw = proxyRes.headers;
  for (const name of FORWARD_RESPONSE_HEADERS) {
    const value = raw[name];
    if (value) out[name] = value;
  }
  return out;
}

const server = http.createServer((req, res) => {
  const origin = getCorsOrigin(req);
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept"
  );
  res.setHeader("Access-Control-Max-Age", "86400");
  // Do not set Access-Control-Allow-Credentials unless you need cookies;
  // with a specific origin we could, but omit for simplicity.

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url);
  const targetUrl = `${TARGET}${parsedUrl.path}`;

  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.url} → ${targetUrl}`
  );

  const options = {
    method: req.method,
    headers: {
      ...copyForwardedHeaders(req),
      host: url.parse(TARGET).host,
    },
  };

  const proxyReq = https.request(targetUrl, options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, copyResponseHeaders(proxyRes));
    proxyRes.pipe(res);
  });

  proxyReq.on("error", (err) => {
    console.error("❌ Proxy error:", err.message);
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Proxy error: " + err.message }));
  });

  req.pipe(proxyReq);
});

server.listen(PORT, () => {
  console.log(`\n✅ CORS Proxy (dev only) running on http://localhost:${PORT}`);
  console.log(`📡 Proxying to: ${TARGET}`);
  console.log(`🔒 Allowed origins: localhost / 127.0.0.1\n`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use!`);
    console.error(`   Try: kill -9 $(lsof -ti:${PORT})`);
  } else {
    console.error("❌ Server error:", err);
  }
  process.exit(1);
});
