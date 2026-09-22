#!/usr/bin/env bash
set -euo pipefail

echo "== Listener ownership =="
sudo ss -lntp | grep -E ':443|:8443|:9444' || true

echo
echo "== NGINX validation =="
sudo nginx -t

echo
echo "== Bridge status =="
sudo systemctl status hutch-msisdn-bridge --no-pager

echo
echo "== Target TLS =="
for d in sl.eduwav.com sl.yumzyy.com sl.radiofyy.com; do
  echo "===== $d ====="
  echo | openssl s_client -connect 127.0.0.1:443 -servername "$d" -brief 2>&1 |
    grep -E 'CONNECTION|Protocol|Ciphersuite|Peer certificate|Verification|DNS|error' || true
done

echo
echo "== Bridge logs =="
sudo journalctl -u hutch-msisdn-bridge --since "10 minutes ago" --no-pager
