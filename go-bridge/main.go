package main

import (
	"bufio"
	"bytes"
	"encoding/binary"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"os"
	"strconv"
	"strings"
	"time"
)

const (
	defaultListen       = ":443"
	defaultTarget       = "127.0.0.1:8443"
	defaultFallback     = "127.0.0.1:9444"
	defaultHutchExt     = 17516
	msisdnTLVType       = 0xe0
	statusTLVType       = 0xe1
	proxyV2SigLen       = 12
	maxTLSRecord        = 16384 + 2048
	maxClientHelloBytes = 65536
)

type Config struct {
	Listen       string
	Target       string
	Fallback     string
	Hosts        map[string]bool
	HutchExt     uint16
	Trace        bool
	ReadTimeout  time.Duration
	DialTimeout  time.Duration
}

func getenv(k, fallback string) string {
	if v := strings.TrimSpace(os.Getenv(k)); v != "" {
		return v
	}
	return fallback
}

func loadConfig() Config {
	ext, err := strconv.Atoi(getenv("HUTCH_EXTENSION", strconv.Itoa(defaultHutchExt)))
	if err != nil || ext < 0 || ext > 65535 {
		ext = defaultHutchExt
	}
	hosts := map[string]bool{}
	for _, h := range strings.FieldsFunc(os.Getenv("TARGET_HOSTS"), func(r rune) bool {
		return r == ',' || r == ' ' || r == '\n' || r == '\r' || r == '\t'
	}) {
		hosts[strings.ToLower(strings.TrimSpace(h))] = true
	}
	return Config{
		Listen:      getenv("LISTEN_ADDR", defaultListen),
		Target:      getenv("TARGET_UPSTREAM", defaultTarget),
		Fallback:    getenv("FALLBACK_UPSTREAM", defaultFallback),
		Hosts:       hosts,
		HutchExt:    uint16(ext),
		Trace:       getenv("TRACE", "0") == "1",
		ReadTimeout: 10 * time.Second,
		DialTimeout: 10 * time.Second,
	}
}

func main() {
	cfg := loadConfig()
	log.SetFlags(log.LstdFlags | log.Lmicroseconds)
	log.Printf("ready listen=%s target=%s fallback=%s targets=%v",
		cfg.Listen, cfg.Target, cfg.Fallback, sortedHosts(cfg.Hosts))

	ln, err := net.Listen("tcp", cfg.Listen)
	if err != nil {
		log.Fatal(err)
	}
	defer ln.Close()

	for {
		c, err := ln.Accept()
		if err != nil {
			log.Printf("accept error: %v", err)
			continue
		}
		go handle(c, cfg)
	}
}

func sortedHosts(m map[string]bool) []string {
	out := make([]string, 0, len(m))
	for h := range m {
		out = append(out, h)
	}
	return out
}

func handle(client net.Conn, cfg Config) {
	defer client.Close()
	_ = client.SetReadDeadline(time.Now().Add(cfg.ReadTimeout))

	hello, err := readClientHello(client)
	if err != nil {
		log.Printf("peer=%s hello_error=%v", client.RemoteAddr(), err)
		return
	}

	sni := parseSNI(hello)
	target := cfg.Hosts[strings.ToLower(sni)]
	cleanHello, msisdn, removed, err := stripHutchExtension(hello, cfg.HutchExt)
	if err != nil {
		cleanHello = hello
	}

	upstreamAddr := cfg.Fallback
	if target {
		upstreamAddr = cfg.Target
	}

	up, err := net.DialTimeout("tcp", upstreamAddr, cfg.DialTimeout)
	if err != nil {
		log.Printf("peer=%s sni=%q target=%v upstream=%s dial_error=%v",
			client.RemoteAddr(), sni, target, upstreamAddr, err)
		return
	}
	defer up.Close()

	if target {
		status := "untrusted_source"
		proxy := buildProxyV2(client.RemoteAddr(), up.RemoteAddr(), msisdn, status)
		if _, err := up.Write(proxy); err != nil {
			log.Printf("peer=%s sni=%q proxy_write_error=%v", client.RemoteAddr(), sni, err)
			return
		}
	}

	if _, err := up.Write(cleanHello); err != nil {
		log.Printf("peer=%s sni=%q hello_write_error=%v", client.RemoteAddr(), sni, err)
		return
	}

	if cfg.Trace {
		log.Printf("peer=%s sni=%q target=%v removed=%d msisdn=%q status=%q",
			client.RemoteAddr(), sni, target, removed, maskMSISDN(msisdn), "untrusted_source")
	}

	_ = client.SetReadDeadline(time.Time{})
	_ = up.SetReadDeadline(time.Time{})

	errc := make(chan error, 2)
	go proxyCopy(up, client, errc)
	go proxyCopy(client, up, errc)
	<-errc
}

func proxyCopy(dst, src net.Conn, errc chan<- error) {
	_, err := io.Copy(dst, src)
	errc <- err
}

func readClientHello(r io.Reader) ([]byte, error) {
	var header [5]byte
	if _, err := io.ReadFull(r, header[:]); err != nil {
		return nil, err
	}
	if header[0] != 0x16 {
		return nil, errors.New("first TLS record is not handshake")
	}
	n := int(binary.BigEndian.Uint16(header[3:5]))
	if n <= 0 || n > maxTLSRecord {
		return nil, fmt.Errorf("invalid TLS record length %d", n)
	}
	body := make([]byte, n)
	if _, err := io.ReadFull(r, body); err != nil {
		return nil, err
	}
	return append(header[:], body...), nil
}

func parseSNI(record []byte) string {
	if len(record) < 5+4 {
		return ""
	}
	p := record[5:]
	if p[0] != 1 || len(p) < 4 {
		return ""
	}
	hsLen := int(p[1])<<16 | int(p[2])<<8 | int(p[3])
	if hsLen <= 0 || hsLen+4 > len(p) {
		return ""
	}
	h := p[4 : 4+hsLen]
	if len(h) < 34 {
		return ""
	}
	pos := 34
	if pos >= len(h) {
		return ""
	}
	sidLen := int(h[pos])
	pos++
	pos += sidLen
	if pos+2 > len(h) {
		return ""
	}
	csLen := int(binary.BigEndian.Uint16(h[pos:]))
	pos += 2 + csLen
	if pos >= len(h) {
		return ""
	}
	compLen := int(h[pos])
	pos++
	pos += compLen
	if pos+2 > len(h) {
		return ""
	}
	extLen := int(binary.BigEndian.Uint16(h[pos:]))
	pos += 2
	end := pos + extLen
	if end > len(h) {
		return ""
	}
	for pos+4 <= end {
		typ := binary.BigEndian.Uint16(h[pos:])
		ln := int(binary.BigEndian.Uint16(h[pos+2:]))
		pos += 4
		if pos+ln > end {
			return ""
		}
		if typ == 0x0000 && ln >= 5 {
			e := h[pos : pos+ln]
			listLen := int(binary.BigEndian.Uint16(e))
			if listLen+2 > len(e) {
				return ""
			}
			q := 2
			for q+3 <= len(e) {
				nameType := e[q]
				nameLen := int(binary.BigEndian.Uint16(e[q+1:]))
				q += 3
				if q+nameLen > len(e) {
					return ""
				}
				if nameType == 0 {
					return string(e[q : q+nameLen])
				}
				q += nameLen
			}
		}
		pos += ln
	}
	return ""
}

func stripHutchExtension(record []byte, wanted uint16) ([]byte, string, int, error) {
	if len(record) < 5+4 {
		return record, "", 0, errors.New("short TLS record")
	}
	p := record[5:]
	if p[0] != 1 {
		return record, "", 0, errors.New("not ClientHello")
	}
	hsLen := int(p[1])<<16 | int(p[2])<<8 | int(p[3])
	if hsLen+4 > len(p) || hsLen > maxClientHelloBytes {
		return record, "", 0, errors.New("invalid ClientHello length")
	}
	h := p[4 : 4+hsLen]
	if len(h) < 34 {
		return record, "", 0, errors.New("short ClientHello")
	}
	pos := 34
	if pos >= len(h) {
		return record, "", 0, errors.New("missing session id")
	}
	sidLen := int(h[pos]); pos++
	pos += sidLen
	if pos+2 > len(h) { return record, "", 0, errors.New("missing cipher suites") }
	csLen := int(binary.BigEndian.Uint16(h[pos:])); pos += 2 + csLen
	if pos >= len(h) { return record, "", 0, errors.New("missing compression") }
	compLen := int(h[pos]); pos++; pos += compLen
	if pos+2 > len(h) { return record, "", 0, errors.New("missing extensions") }
	extLenPos := pos
	extLen := int(binary.BigEndian.Uint16(h[pos:])); pos += 2
	extStart, extEnd := pos, pos+extLen
	if extEnd > len(h) { return record, "", 0, errors.New("invalid extension length") }

	var kept bytes.Buffer
	var msisdn string
	removed := 0
	for pos < extEnd {
		if pos+4 > extEnd { return record, "", 0, errors.New("truncated extension") }
		typ := binary.BigEndian.Uint16(h[pos:])
		ln := int(binary.BigEndian.Uint16(h[pos+2:]))
		total := 4 + ln
		if pos+total > extEnd { return record, "", 0, errors.New("invalid extension size") }
		if typ == wanted {
			if v, ok := parseHutchPayload(h[pos+4 : pos+total]); ok {
				msisdn = v
			}
			removed += total
		} else {
			kept.Write(h[pos : pos+total])
		}
		pos += total
	}

	newH := make([]byte, 0, len(h)-removed)
	newH = append(newH, h[:extStart]...)
	var extLenBuf [2]byte
	binary.BigEndian.PutUint16(extLenBuf[:], uint16(kept.Len()))
	newH = append(newH, extLenBuf[:]...)
	newH = append(newH, kept.Bytes()...)
	newH = append(newH, h[extEnd:]...)

	newHsLen := len(newH)
	out := make([]byte, 5+4+newHsLen)
	copy(out, record[:5])
	out[0] = 0x16
	binary.BigEndian.PutUint16(out[3:], uint16(4+newHsLen))
	out[5] = 1
	out[6] = byte(newHsLen >> 16)
	out[7] = byte(newHsLen >> 8)
	out[8] = byte(newHsLen)

	// Preserve any bytes after the first handshake message in the TLS record.
	tail := record[5+4+hsLen:]
	out = append(out, newH...)
	out = append(out, tail...)

	_ = extLenPos
	return out, msisdn, removed, nil
}

func parseHutchPayload(p []byte) (string, bool) {
	if len(p) < 4 {
		return "", false
	}
	// Supported payload framing used by this bridge: version byte + uint16 length + 11 ASCII digits.
	if p[0] != 1 && p[0] != 3 {
		return "", false
	}
	n := int(binary.BigEndian.Uint16(p[1:3]))
	if n != 11 || 3+n > len(p) {
		return "", false
	}
	d := string(p[3 : 3+n])
	if !strings.HasPrefix(d, "947") {
		return "", false
	}
	for _, r := range d {
		if r < '0' || r > '9' {
			return "", false
		}
	}
	return d, true
}

func buildProxyV2(src, dst net.Addr, msisdn, status string) []byte {
	var srcIP, dstIP net.IP
	var srcPort, dstPort int
	switch a := src.(type) {
	case *net.TCPAddr:
		srcIP, srcPort = a.IP, a.Port
	}
	switch a := dst.(type) {
	case *net.TCPAddr:
		dstIP, dstPort = a.IP, a.Port
	}
	var addrPart []byte
	fam := byte(0x11) // TCP over IPv4
	if s4, d4 := srcIP.To4(), dstIP.To4(); s4 != nil && d4 != nil {
		addrPart = make([]byte, 12)
		copy(addrPart[0:4], s4); copy(addrPart[4:8], d4)
		binary.BigEndian.PutUint16(addrPart[8:10], uint16(srcPort))
		binary.BigEndian.PutUint16(addrPart[10:12], uint16(dstPort))
	} else {
		fam = 0x21
		addrPart = make([]byte, 36)
		copy(addrPart[0:16], srcIP.To16()); copy(addrPart[16:32], dstIP.To16())
		binary.BigEndian.PutUint16(addrPart[32:34], uint16(srcPort))
		binary.BigEndian.PutUint16(addrPart[34:36], uint16(dstPort))
	}

	tlvs := make([]byte, 0, 64)
	if msisdn != "" {
		tlvs = appendTLV(tlvs, msisdnTLVType, []byte(msisdn))
	}
	if status != "" {
		tlvs = appendTLV(tlvs, statusTLVType, []byte(status))
	}

	out := make([]byte, 0, 16+len(addrPart)+len(tlvs))
	out = append(out, []byte{0x0d,0x0a,0x0d,0x0a,0x00,0x0d,0x0a,0x51,0x55,0x49,0x54,0x0a}...)
	out = append(out, 0x21, fam)
	var ln [2]byte
	binary.BigEndian.PutUint16(ln[:], uint16(len(addrPart)+len(tlvs)))
	out = append(out, ln[:]...)
	out = append(out, addrPart...)
	out = append(out, tlvs...)
	return out
}

func appendTLV(dst []byte, typ byte, value []byte) []byte {
	dst = append(dst, typ)
	var n [2]byte
	binary.BigEndian.PutUint16(n[:], uint16(len(value)))
	dst = append(dst, n[:]...)
	return append(dst, value...)
}

func maskMSISDN(s string) string {
	if len(s) < 4 { return s }
	return strings.Repeat("*", len(s)-4) + s[len(s)-4:]
}

func debugHex(b []byte) string {
	if len(b) > 64 { b = b[:64] }
	return hex.EncodeToString(b)
}

var _ = bufio.ErrInvalidUnreadByte
var _ = debugHex
