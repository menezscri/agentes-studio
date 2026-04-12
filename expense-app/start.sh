#!/bin/bash
# SplitZ — start the development server
set -e

cd "$(dirname "$0")"

echo "╔══════════════════════════════════╗"
echo "║  SplitZ — Expense Sharing App    ║"
echo "╚══════════════════════════════════╝"
echo ""

# Find local IP for mobile access
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || ifconfig 2>/dev/null | grep 'inet ' | grep -v '127.0.0.1' | awk '{print $2}' | head -1)

echo "📱 Desktop:  http://localhost:3000"
if [ -n "$LOCAL_IP" ]; then
  echo "📱 Mobile:   http://$LOCAL_IP:3000"
fi
echo ""
echo "Para acessar no celular, conecte ao mesmo Wi-Fi"
echo "e abra o endereço acima no navegador."
echo ""
echo "Pressione Ctrl+C para parar."
echo "────────────────────────────────────"

python3 server.py
