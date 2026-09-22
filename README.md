# TLS Control Portal

Responsive React/Vite customer-facing deployment portal for a Go TLS bridge + NGINX architecture.

## Start

```bash
npm install
npm run dev
```

Open:

http://localhost:5173

## Production build

```bash
npm run build
npm run preview
```

## Included workflow

1. Customer/environment
2. Target SNI domains
3. Go bridge configuration
4. NGINX target listener
5. Verification
6. Troubleshooting
7. Rollback

The portal is intentionally review-first. It generates commands/configuration but does not silently modify a production server.

## Important

Replace example certificate paths and application upstreams with values for the actual environment. Review all commands before production use.


See `DEPLOYMENT-GUIDE.md` for the complete Linux/macOS/Windows deployment reference.


## UI / Motion

This version adds a responsive premium dark interface with:
- animated hero/architecture nodes
- subtle grid motion
- hover elevation and glow
- animated login entrance
- responsive mobile navigation
- reduced-motion support
- polished code cards and copy interactions

All deployment guides remain functional and are kept separate from the visual layer.


## Complete project layout

- `src/` — animated responsive portal
- `go-bridge/main.go` — Go TLS/Hutch bridge source
- `go-bridge/go.mod` — Go module
- `deployment/hutch-msisdn-bridge.env.example` — bridge environment
- `deployment/hutch-msisdn-bridge.service` — systemd unit
- `deployment/nginx-target.conf.example` — NGINX target listener
- `deployment/verify.sh` — verification script
- `deployment/rollback.sh` — rollback helper
- `DEPLOYMENT-GUIDE.md` — Linux/macOS/Windows guide
- `GO-BRIDGE.md` — Go source/behavior reference
"# tlsportal" 
