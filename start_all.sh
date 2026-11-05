#!/bin/zsh
DIR="/Users/danil/.gemini/antigravity/scratch/chibilove-tma"
cd "$DIR"

function log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

function start_server() {
  pkill -f "backend/server.py" 2>/dev/null || true
  sleep 1
  nohup /usr/bin/python3 -u "$DIR/backend/server.py" >> "$DIR/backend/server.log" 2>&1 &
  log "[Watchdog] Server spawned with PID: $!"
}

function start_tunnel() {
  pkill -f "cloudflared tunnel" 2>/dev/null || true
  rm -f "$DIR/backend/tunnel.log"
  nohup /Users/danil/.local/bin/cloudflared tunnel --protocol http2 --url http://127.0.0.1:8085 > "$DIR/backend/tunnel.log" 2>&1 &
  log "[Watchdog] Cloudflare Tunnel spawned with PID: $!"
}

# Clean old zombie processes
pkill -f "nokey@localhost.run" 2>/dev/null || true

# Start both services
start_server
start_tunnel

TUNNEL_FAIL_COUNT=0
TUNNEL_NO_URL_COUNT=0
SERVER_FAIL_COUNT=0

# Auto-reconnecting supervisor loop
while true; do
  # 1. Health check server.py (process alive AND local port 8085 responding)
  if ! pgrep -f "backend/server.py" > /dev/null; then
    log "[Watchdog] Server process died, restarting..."
    start_server
    SERVER_FAIL_COUNT=0
    sleep 2
  elif ! curl -s -f -m 3 "http://127.0.0.1:8085/api/health" > /dev/null 2>&1; then
    SERVER_FAIL_COUNT=$((SERVER_FAIL_COUNT + 1))
    log "[Watchdog] Local server healthcheck failed ($SERVER_FAIL_COUNT/3)"
    if [[ $SERVER_FAIL_COUNT -ge 3 ]]; then
      log "[Watchdog] Server unresponsive on port 8085 after 3 checks, restarting..."
      start_server
      SERVER_FAIL_COUNT=0
      sleep 2
    fi
  else
    SERVER_FAIL_COUNT=0
  fi

  # 2. Health check cloudflared & check for expired/unauthorized quick tunnel
  if ! pgrep -f "cloudflared tunnel" > /dev/null; then
    log "[Watchdog] Tunnel process died, restarting..."
    start_tunnel
    TUNNEL_FAIL_COUNT=0
    TUNNEL_NO_URL_COUNT=0
    sleep 3
  elif grep -q "Unauthorized: Tunnel not found" "$DIR/backend/tunnel.log" 2>/dev/null; then
    log "[Watchdog] Cloudflare reported 'Unauthorized: Tunnel not found', restarting tunnel..."
    start_tunnel
    TUNNEL_FAIL_COUNT=0
    TUNNEL_NO_URL_COUNT=0
    sleep 3
  fi

  # 3. Check for updated tunnel URL
  URL=$(grep -oE "https://[a-zA-Z0-9-]+\\.trycloudflare\\.com" "$DIR/backend/tunnel.log" 2>/dev/null | tail -n 1 || true)
  if [[ -n "$URL" ]]; then
    TUNNEL_NO_URL_COUNT=0
    OLD=$(cat "$DIR/backend/tunnel_url.txt" 2>/dev/null || true)
    if [[ "$URL" != "$OLD" ]]; then
      echo "$URL" > "$DIR/backend/tunnel_url.txt"
      log "[Watchdog] TUNNEL_URL updated -> $URL"
      TUNNEL_FAIL_COUNT=0
    fi

    # 4. Active public tunnel HTTP health check
    if ! curl -s -f -m 5 "$URL/api/health" > /dev/null 2>&1; then
      TUNNEL_FAIL_COUNT=$((TUNNEL_FAIL_COUNT + 1))
      log "[Watchdog] Tunnel healthcheck failed ($TUNNEL_FAIL_COUNT/3) for $URL"
      if [[ $TUNNEL_FAIL_COUNT -ge 3 ]]; then
        log "[Watchdog] Tunnel unreachable after 3 consecutive failures, restarting cloudflared..."
        start_tunnel
        TUNNEL_FAIL_COUNT=0
        sleep 3
      fi
    else
      TUNNEL_FAIL_COUNT=0
    fi
  else
    TUNNEL_NO_URL_COUNT=$((TUNNEL_NO_URL_COUNT + 1))
    if [[ $TUNNEL_NO_URL_COUNT -ge 8 ]]; then
      log "[Watchdog] Cloudflare tunnel produced no URL after 30s, restarting cloudflared..."
      start_tunnel
      TUNNEL_NO_URL_COUNT=0
      sleep 3
    fi
  fi
  sleep 4
done
