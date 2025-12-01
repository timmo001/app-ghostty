/**
 * Ghostty Terminal Frontend
 * Initializes ghostty-web terminal with WebSocket PTY connection
 */

import { init, Terminal, FitAddon } from 'ghostty-web';

// DOM elements
const terminalContainer = document.getElementById('terminal');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');

// State
let term = null;
let fitAddon = null;
let ws = null;
let reconnectTimeout = null;

/**
 * Update connection status UI
 */
function setStatus(state, text) {
  statusDot.className = `status-dot ${state}`;
  statusText.textContent = text;
}

/**
 * Build WebSocket URL for current environment
 * Handles both direct access and Home Assistant ingress
 */
function getWebSocketUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;

  // Get terminal dimensions
  const cols = term?.cols || 80;
  const rows = term?.rows || 24;

  // For ingress, we need to use the current path as base
  // URL looks like: /api/hassio_ingress/<token>/
  // WebSocket should be: /api/hassio_ingress/<token>/ws
  let basePath = window.location.pathname;

  // Ensure basePath ends without trailing slash for clean concatenation
  if (basePath.endsWith('/')) {
    basePath = basePath.slice(0, -1);
  }

  return `${protocol}//${host}${basePath}/ws?cols=${cols}&rows=${rows}`;
}

/**
 * Connect to WebSocket PTY server
 */
function connect() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    return;
  }

  setStatus('connecting', 'Connecting...');

  const wsUrl = getWebSocketUrl();
  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    setStatus('connected', 'Connected');

    // Clear any pending reconnect
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
  };

  ws.onmessage = (event) => {
    term.write(event.data);
  };

  ws.onclose = () => {
    setStatus('disconnected', 'Disconnected');
    ws = null;

    // Attempt to reconnect after delay
    if (!reconnectTimeout) {
      reconnectTimeout = setTimeout(() => {
        reconnectTimeout = null;
        connect();
      }, 2000);
    }
  };

  ws.onerror = () => {
    setStatus('disconnected', 'Connection error');
  };
}

/**
 * Send resize message to server
 */
function sendResize(cols, rows) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'resize', cols, rows }));
  }
}

/**
 * Initialize terminal
 */
async function initTerminal() {
  // Initialize WASM
  await init();

  // Create terminal with Home Assistant-friendly theme
  term = new Terminal({
    cols: 80,
    rows: 24,
    cursorBlink: true,
    fontSize: 14,
    fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
    theme: {
      background: '#1e1e1e',
      foreground: '#d4d4d4',
      cursor: '#d4d4d4',
      cursorAccent: '#1e1e1e',
      black: '#1e1e1e',
      red: '#f44747',
      green: '#6a9955',
      yellow: '#dcdcaa',
      blue: '#569cd6',
      magenta: '#c586c0',
      cyan: '#4ec9b0',
      white: '#d4d4d4',
      brightBlack: '#808080',
      brightRed: '#f44747',
      brightGreen: '#6a9955',
      brightYellow: '#dcdcaa',
      brightBlue: '#569cd6',
      brightMagenta: '#c586c0',
      brightCyan: '#4ec9b0',
      brightWhite: '#ffffff',
    },
    scrollback: 10000,
  });

  // Load FitAddon for responsive sizing
  fitAddon = new FitAddon();
  term.loadAddon(fitAddon);

  // Open terminal in container
  await term.open(terminalContainer);
  fitAddon.fit();
  fitAddon.observeResize();

  // Handle terminal input -> send to server
  term.onData((data) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });

  // Handle terminal resize -> notify server
  term.onResize(({ cols, rows }) => {
    sendResize(cols, rows);
  });

  // Handle window resize
  window.addEventListener('resize', () => {
    fitAddon.fit();
  });

  // Connect to server
  connect();
}

// Initialize on load
initTerminal().catch((err) => {
  console.error('Failed to initialize terminal:', err);
  setStatus('disconnected', 'Initialization failed');
});
