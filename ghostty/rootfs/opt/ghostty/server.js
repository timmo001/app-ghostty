#!/usr/bin/env node
/**
 * Ghostty Terminal Server for Home Assistant
 * WebSocket PTY server with Express static file serving
 */

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import pty from '@lydell/node-pty';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = process.env.PORT || 4277;
const SHELL = process.env.SHELL || '/bin/bash';

// Track active PTY sessions
const sessions = new Map();

/**
 * Create Express app and HTTP server
 */
function createApp() {
  const app = express();

  // Serve static frontend files
  app.use(express.static(path.join(__dirname, 'public')));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', sessions: sessions.size });
  });

  return app;
}

/**
 * Create PTY session for a WebSocket connection
 */
function createPtySession(cols, rows) {
  const ptyProcess = pty.spawn(SHELL, [], {
    name: 'xterm-256color',
    cols: cols || 80,
    rows: rows || 24,
    cwd: process.env.HOME || '/',
    env: {
      ...process.env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
    },
  });

  return ptyProcess;
}

/**
 * Handle WebSocket connection
 */
function handleConnection(ws, req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const cols = parseInt(url.searchParams.get('cols') || '80', 10);
  const rows = parseInt(url.searchParams.get('rows') || '24', 10);

  console.log(`[PTY] New connection: ${cols}x${rows}`);

  // Create PTY session
  const ptyProcess = createPtySession(cols, rows);
  sessions.set(ws, { pty: ptyProcess });

  // PTY -> WebSocket
  ptyProcess.onData((data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(data);
    }
  });

  ptyProcess.onExit(({ exitCode }) => {
    console.log(`[PTY] Process exited with code ${exitCode}`);
    if (ws.readyState === ws.OPEN) {
      ws.send(`\r\n\x1b[33mShell exited (code: ${exitCode})\x1b[0m\r\n`);
      ws.close();
    }
  });

  // WebSocket -> PTY
  ws.on('message', (data) => {
    const message = data.toString('utf8');

    // Check for JSON control messages
    if (message.startsWith('{')) {
      try {
        const msg = JSON.parse(message);
        if (msg.type === 'resize' && msg.cols && msg.rows) {
          ptyProcess.resize(msg.cols, msg.rows);
          console.log(`[PTY] Resized to ${msg.cols}x${msg.rows}`);
          return;
        }
      } catch (e) {
        // Not JSON, treat as input
      }
    }

    // Send to PTY
    ptyProcess.write(message);
  });

  ws.on('close', () => {
    console.log('[PTY] Connection closed');
    const session = sessions.get(ws);
    if (session) {
      session.pty.kill();
      sessions.delete(ws);
    }
  });

  ws.on('error', (err) => {
    console.error('[PTY] WebSocket error:', err.message);
  });
}

/**
 * Graceful shutdown
 */
function shutdown(server, wss) {
  console.log('\n[Server] Shutting down...');

  // Kill all PTY sessions
  for (const [ws, session] of sessions.entries()) {
    session.pty.kill();
    ws.close();
  }
  sessions.clear();

  // Close servers
  wss.close();
  server.close(() => {
    console.log('[Server] Shutdown complete');
    process.exit(0);
  });

  // Force exit after timeout
  setTimeout(() => {
    console.log('[Server] Forcing exit');
    process.exit(1);
  }, 5000);
}

/**
 * Main entry point
 */
function main() {
  const app = createApp();
  const server = createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', handleConnection);

  // Handle shutdown signals
  process.on('SIGTERM', () => shutdown(server, wss));
  process.on('SIGINT', () => shutdown(server, wss));

  server.listen(PORT, () => {
    console.log(`[Server] Ghostty terminal server listening on port ${PORT}`);
    console.log(`[Server] Shell: ${SHELL}`);
  });
}

main();

