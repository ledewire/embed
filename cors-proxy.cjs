#!/usr/bin/env node

/**
 * Simple CORS Proxy for Local Development
 * Proxies requests to https://api.ledewire.com/v1
 */

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 8010;
const TARGET = 'https://api-staging.ledewire.com/v1';

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parse the request URL
  const parsedUrl = url.parse(req.url);
  const targetUrl = `${TARGET}${parsedUrl.path}`;

  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} → ${targetUrl}`);

  // Prepare proxy request options
  const options = {
    method: req.method,
    headers: {
      ...req.headers,
      host: 'api.ledewire.com',
    },
  };

  // Remove problematic headers
  delete options.headers['host'];
  delete options.headers['origin'];
  delete options.headers['referer'];

  // Make the proxy request
  const proxyReq = https.request(targetUrl, options, (proxyRes) => {
    // Forward status code
    res.writeHead(proxyRes.statusCode, proxyRes.headers);

    // Forward response body
    proxyRes.pipe(res);
  });

  // Handle errors
  proxyReq.on('error', (err) => {
    console.error('❌ Proxy error:', err.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Proxy error: ' + err.message }));
  });

  // Forward request body
  req.pipe(proxyReq);
});

server.listen(PORT, () => {
  console.log(`\n✅ CORS Proxy running on http://localhost:${PORT}`);
  console.log(`📡 Proxying to: ${TARGET}`);
  console.log(`\n🔗 Your app should use: http://localhost:${PORT}\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
    console.error(`   Try: kill -9 $(lsof -ti:${PORT})`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

