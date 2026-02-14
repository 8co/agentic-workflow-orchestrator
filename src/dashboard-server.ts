#!/usr/bin/env node
/**
 * Dashboard Launcher
 * Starts the metrics dashboard server
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import http from 'node:http';
import { generatePerformanceMetrics } from './observabilityUtil.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3000;

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Serve metrics API
  if (req.url === '/api/metrics' && req.method === 'GET') {
    try {
      const metrics = generatePerformanceMetrics();
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify(metrics, null, 2));
    } catch (error) {
      console.error('Error generating metrics:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to generate metrics' }));
    }
    return;
  }

  // Serve dashboard HTML
  if (req.url === '/' || req.url === '/index.html') {
    try {
      const htmlPath = join(__dirname, 'dashboard', 'index.html');
      const html = readFileSync(htmlPath, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } catch (error) {
      console.error('Error reading dashboard HTML:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Failed to load dashboard');
    }
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log('');
  console.log('🖥️  ═══════════════════════════════════════');
  console.log('   📊 METRICS DASHBOARD');
  console.log('   ═══════════════════════════════════════');
  console.log(`   🌐 URL: http://localhost:${PORT}`);
  console.log('   📈 Endpoints:');
  console.log(`      - GET /           (Dashboard UI)`);
  console.log(`      - GET /api/metrics (JSON API)`);
  console.log('   ═══════════════════════════════════════');
  console.log('   Press Ctrl+C to stop');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down dashboard...');
  server.close(() => {
    console.log('✅ Dashboard stopped');
    process.exit(0);
  });
});

