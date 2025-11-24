#!/usr/bin/env node

/**
 * Simple HTTP server for testing the embeddable dashboard
 *
 * This serves the test-embed.html file and the build directory
 * so you can test the Module Federation setup locally.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3002;
const HOST = 'localhost';

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.map': 'application/json'
};

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  // Default to test-embed.html for root
  let filePath = req.url === '/' ? '/test-embed.html' : req.url;

  // Try to find file in multiple locations:
  // 1. First try the public directory (for static assets like images)
  // 2. Then try the root directory (for build files and test-embed.html)
  let filePathToTry = path.join(__dirname, 'public', filePath);

  // Check if file exists in public directory first
  if (!fs.existsSync(filePathToTry)) {
    // If not in public, try root directory
    filePathToTry = path.join(__dirname, filePath);
  }

  // Get file extension
  const ext = path.extname(filePathToTry);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Check if file exists
  fs.readFile(filePathToTry, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1><p>File: ' + filePathToTry + '</p>', 'utf-8');
      } else {
        // Server error
        res.writeHead(500);
        res.end('Server Error: ' + err.code, 'utf-8');
      }
    } else {
      // Success
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*', // Enable CORS for testing
        'Cache-Control': 'no-cache' // Disable cache for development
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('🚀 Test Server Running!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log(`   URL: http://${HOST}:${PORT}`);
  console.log('');
  console.log('   This server hosts the test-embed.html file');
  console.log('   which demonstrates the embeddable dashboard.');
  console.log('');
  console.log('   Make sure you have run "npm run build:embed"');
  console.log('   before testing!');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
  console.log('');
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});
