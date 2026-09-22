# TLS Control — Deployment Guide

## Architecture

Internet HTTPS :443
→ Go TLS/Hutch bridge
→ target SNI → NGINX 127.0.0.1:8443 (`ssl proxy_protocol`)
→ application upstream

Other SNI
→ NGINX 127.0.0.1:9444
→ existing HTTPS sites

The public listener ownership must be explicit: only the Go bridge should own public :443 in the reference layout.

## Linux production

### Prerequisites

```bash
sudo apt update
sudo apt install -y nginx golang git curl openssl
```

### Bridge account

```bash
sudo useradd --system --no-create-home --shell /usr/sbin/nologin hutchbridge || true
sudo mkdir -p /opt/hutch-msisdn-bridge-go
sudo chown -R hutchbridge:hutchbridge /opt/hutch-msisdn-bridge-go
```

### Build

```bash
cd /opt/hutch-msisdn-bridge-go
go mod download
go build -o hutch-bridge .
sudo chmod 755 hutch-bridge
sudo chown hutchbridge:hutchbridge hutch-bridge
```

### Environment

```bash
sudo tee /etc/hutch-msisdn-bridge.env >/dev/null <<'EOF'
TARGET_UPSTREAM=127.0.0.1:8443
FALLBACK_UPSTREAM=127.0.0.1:9444
TARGET_HOSTS=sl.eduwav.com,sl.yumzyy.com,sl.radiofyy.com
HUTCH_EXTENSION=17516
MSISDN_TLV=0xe0
STATUS_TLV=0xe1
TRACE=1
EOF
sudo chmod 640 /etc/hutch-msisdn-bridge.env
```

### systemd

```ini
[Unit]
Description=Hutch MSISDN TLS Bridge
After=network-online.target nginx.service
Wants=network-online.target

[Service]
Type=simple
User=hutchbridge
Group=hutchbridge
AmbientCapabilities=CAP_NET_BIND_SERVICE
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
EnvironmentFile=/etc/hutch-msisdn-bridge.env
ExecStart=/opt/hutch-msisdn-bridge-go/hutch-bridge
Restart=always
RestartSec=2
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable hutch-msisdn-bridge
sudo systemctl restart hutch-msisdn-bridge
```

## NGINX target

```nginx
server {
    listen 127.0.0.1:8443 ssl proxy_protocol;
    server_name sl.eduwav.com;

    ssl_certificate /etc/ssl/sl.eduwav.com/fullchain.pem;
    ssl_certificate_key /etc/ssl/sl.eduwav.com/privkey.pem;

    proxy_set_header X-MSISDN $proxy_protocol_tlv_0xe0;

    location / {
        proxy_pass http://127.0.0.1:8080;
    }
}
```

Repeat the server block for the other target domains with their certificates and application routing.

## Verification

```bash
sudo nginx -t
sudo ss -lntp | grep -E ':443|:8443|:9444'
sudo systemctl status hutch-msisdn-bridge --no-pager
sudo journalctl -u hutch-msisdn-bridge --since "10 minutes ago" --no-pager
```

TLS:

```bash
for d in sl.eduwav.com sl.yumzyy.com sl.radiofyy.com; do
  echo "===== $d ====="
  echo | openssl s_client -connect 127.0.0.1:443 -servername "$d" -brief 2>&1
done
```

HTTPS:

```bash
for d in sl.eduwav.com sl.yumzyy.com sl.radiofyy.com; do
  curl -kIsS --connect-timeout 10 --max-time 20 \
    --resolve "$d:443:46.62.253.110" \
    "https://$d/" | head -n 12
done
```

Target logs:

```bash
sudo journalctl -u hutch-msisdn-bridge --since "1 hour ago" --no-pager |
grep -E 'sl\.eduwav\.com|sl\.yumzyy\.com|sl\.radiofyy\.com'
```

## macOS

Use Homebrew for development:

```bash
brew update
brew install go nginx openssl curl
cd /opt/hutch-msisdn-bridge-go
go mod download
go build -o hutch-bridge .
```

Development environment:

```bash
export TARGET_UPSTREAM=127.0.0.1:8443
export FALLBACK_UPSTREAM=127.0.0.1:9444
export TARGET_HOSTS=sl.eduwav.com,sl.yumzyy.com,sl.radiofyy.com
export HUTCH_EXTENSION=17516
export MSISDN_TLV=0xe0
export STATUS_TLV=0xe1
export TRACE=1
./hutch-bridge
```

## Windows PowerShell

```powershell
winget install --id GoLang.Go
go version
New-Item -ItemType Directory -Force C:\hutch-msisdn-bridge-go
Set-Location C:\hutch-msisdn-bridge-go
go mod download
go build -o hutch-bridge.exe .
```

Environment:

```powershell
$env:TARGET_UPSTREAM="127.0.0.1:8443"
$env:FALLBACK_UPSTREAM="127.0.0.1:9444"
$env:TARGET_HOSTS="sl.eduwav.com,sl.yumzyy.com,sl.radiofyy.com"
$env:HUTCH_EXTENSION="17516"
$env:MSISDN_TLV="0xe0"
$env:STATUS_TLV="0xe1"
$env:TRACE="1"
.\hutch-bridge.exe
```

Port check:

```powershell
Get-NetTCPConnection -State Listen |
  Where-Object {$_.LocalPort -in 443,8443,9444} |
  Format-Table LocalAddress,LocalPort,OwningProcess
```

## Rollback

Always create a pre-change backup.

Linux:

```bash
sudo cp -a /etc/nginx /etc/nginx.backup-before-hutch-$(date +%Y%m%d-%H%M%S)
sudo systemctl stop hutch-msisdn-bridge
sudo nginx -t
sudo systemctl reload nginx
```

Restore the exact backup you created through your normal change-control process.

## Security

- Never put private TLS keys in the portal source.
- Never commit `.env` files containing production secrets.
- Review generated commands before execution.
- Keep target :8443 and fallback :9444 private.
- Keep trace logging temporary when it can expose sensitive metadata.
- Use a real secret manager for production credentials.
