#!/usr/bin/env bash
set -euo pipefail
sudo systemctl stop hutch-msisdn-bridge || true
echo "Restore the exact pre-change NGINX backup using your approved change-control process."
sudo nginx -t
sudo systemctl reload nginx
sudo ss -lntp | grep -E ':443|:8443|:9444' || true
