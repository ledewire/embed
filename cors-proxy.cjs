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
    },
  };

  // Remove problematic headers
  delete options.headers['host'];
  delete options.headers['origin'];
  delete options.headers['referer'];

  // Make the proxy request
  const proxyReq = https.request(targetUrl, options, (proxyRes) => {
    console.log(`📥 Response: ${proxyRes.statusCode} ${proxyRes.statusMessage}`);
    
    // Collect response body for logging and forwarding
    let responseBody = Buffer.from([]);
    proxyRes.on('data', (chunk) => {
      responseBody = Buffer.concat([responseBody, chunk]);
    });
    
    proxyRes.on('end', () => {
      const bodyStr = responseBody.toString();
      if (proxyRes.statusCode >= 400) {
        console.error('❌ Error Response:', bodyStr);
      } else {
        console.log('✅ Success Response:', bodyStr.substring(0, 200));
      }
      
      // Forward status code
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      // Forward response body
      res.end(responseBody);
    });
  });

  // Handle errors
  proxyReq.on('error', (err) => {
    console.error('❌ Proxy error:', err.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Proxy error: ' + err.message }));
  });

  // Forward request body and log it for debugging
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    let requestBody = Buffer.from([]);
    req.on('data', (chunk) => {
      requestBody = Buffer.concat([requestBody, chunk]);
    });
    req.on('end', () => {
      const bodyStr = requestBody.toString();
      if (bodyStr) {
        console.log('📤 Request Body:', bodyStr);
      }
      proxyReq.end(requestBody);
    });
  } else {
    req.pipe(proxyReq);
  }
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

