# Go Bridge Source

The actual bridge source is in `go-bridge/main.go`.

Build:

```bash
cd go-bridge
go mod download
go build -o hutch-bridge .
```

The bridge:
- listens on `:443`
- reads SNI from the first ClientHello
- routes configured target SNI to `127.0.0.1:8443`
- routes other SNI to `127.0.0.1:9444`
- removes the configured Hutch extension from ClientHello
- extracts the 11-digit `947...` MSISDN payload
- emits PROXY v2 TLVs `0xe0` (MSISDN) and `0xe1` (status) for target traffic
- supports trace logging
- uses a non-root systemd service with `CAP_NET_BIND_SERVICE`

Review and test the source in your own environment before production use.
