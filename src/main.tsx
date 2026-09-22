import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity, ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2,
  ChevronRight, Clipboard, Code2, Copy, Download, ExternalLink, FileCode2,
  Globe, KeyRound, LayoutDashboard, LifeBuoy, Lock, LogOut, Menu,
  Network, Play, RefreshCcw, Rocket, Server, Settings, ShieldCheck,
  Sparkles, Terminal, TriangleAlert, X, Zap
} from "lucide-react";
import "./styles.css";

type Config = {
  customer: string;
  domains: string[];
  publicIp: string;
  targetUpstream: string;
  fallbackUpstream: string;
  appUpstream: string;
  port: number;
  extension: number;
  trace: boolean;
};

const DEFAULT: Config = {
  customer: "",
  domains: ["sl.eduwav.com", "sl.yumzyy.com", "sl.radiofyy.com"],
  publicIp: "46.62.253.110",
  targetUpstream: "127.0.0.1:8443",
  fallbackUpstream: "127.0.0.1:9444",
  appUpstream: "http://127.0.0.1:8080",
  port: 8443,
  extension: 17516,
  trace: true
};

const nav = [
  ["overview", "Overview", LayoutDashboard],
  ["wizard", "Deployment Wizard", Rocket],
  ["architecture", "Architecture", Network],
  ["go", "Go Bridge", Code2],
  ["nginx", "NGINX", Server],
  ["verify", "Verify & Test", Activity],
  ["trouble", "Troubleshooting", LifeBuoy],
  ["rollback", "Rollback", RefreshCcw],
  ["platform", "Platform Setup", Terminal]
] as const;

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }
  return <button className="copy" onClick={copy}><Copy size={14}/>{copied ? "Copied" : "Copy"}</button>;
}

function CodeCard({ title, code, note }: { title: string; code: string; note?: string }) {
  return <section className="code-card">
    <div className="code-head">
      <div><Terminal size={16}/><b>{title}</b></div>
      <CopyButton value={code}/>
    </div>
    {note && <p className="code-note">{note}</p>}
    <pre><code>{code}</code></pre>
  </section>;
}

function App() {
  const [logged, setLogged] = useState(false);
  const [page, setPage] = useState("overview");
  const [mobile, setMobile] = useState(false);
  const [cfg, setCfg] = useState<Config>(DEFAULT);

  if (!logged) return <Login onLogin={() => setLogged(true)} />;

  const title = nav.find(n => n[0] === page)?.[1] || "Overview";
  return <div className="app">
    <aside className={"sidebar " + (mobile ? "show" : "")}>
      <div className="brand">
        <div className="brand-mark"><ShieldCheck size={20}/></div>
        <div><strong>TLS Control</strong><span>SECURE DEPLOYMENT</span></div>
        <button className="mobile-close" onClick={() => setMobile(false)}><X/></button>
      </div>

      <div className="side-label">WORKSPACE</div>
      {nav.map(([id, label, Icon]) =>
        <button key={id} className={"nav-item " + (page === id ? "active" : "")}
          onClick={() => { setPage(id); setMobile(false); }}>
          <Icon size={18}/><span>{label}</span>{page === id && <ChevronRight size={15}/>}
        </button>
      )}

      <div className="sidebar-bottom">
        <div className="online"><span/> System guide online</div>
        <button className="nav-item" onClick={() => setLogged(false)}><LogOut size={18}/><span>Sign out</span></button>
      </div>
    </aside>

    <main className="main">
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setMobile(true)}><Menu/></button>
        <div className="breadcrumbs"><span>TLS Control</span><ChevronRight size={14}/><b>{title}</b></div>
        <div className="top-user"><div className="avatar">A</div><span>admin</span></div>
      </header>

      {page === "overview" && <Overview go={setPage}/>}
      {page === "wizard" && <Wizard cfg={cfg} setCfg={setCfg}/>}
      {page === "architecture" && <Architecture/>}
      {page === "go" && <GoGuide cfg={cfg}/>}
      {page === "nginx" && <NginxGuide cfg={cfg}/>}
      {page === "verify" && <Verify cfg={cfg}/>}
      {page === "trouble" && <Trouble/>}
      {page === "rollback" && <Rollback/>}
      {page === "platform" && <PlatformGuide cfg={cfg}/>} 
    </main>
  </div>;
}

function Login({onLogin}:{onLogin:()=>void}) {
  const [u,setU]=useState("admin"), [p,setP]=useState(""), [error,setError]=useState("");
  function submit(e:React.FormEvent){e.preventDefault(); if(p.length < 1){setError("Enter your portal password.");return;} onLogin();}
  return <div className="login-page">
    <div className="orb orb-a"/><div className="orb orb-b"/>
    <div className="login-card">
      <div className="login-brand"><div className="brand-mark"><ShieldCheck/></div><div><b>TLS Control</b><span>DEPLOYMENT PORTAL</span></div></div>
      <div className="login-icon"><Lock/></div>
      <p className="eyebrow">SECURE OPERATIONS</p>
      <h1>Deploy TLS without the guesswork.</h1>
      <p className="muted">Configure your Go TLS bridge, NGINX listeners, verification checks and rollback plan from one workspace.</p>
      <form onSubmit={submit} className="login-form">
        <label>Username<input value={u} onChange={e=>setU(e.target.value)} placeholder="admin"/></label>
        <label>Password<input type="password" value={p} onChange={e=>setP(e.target.value)} placeholder="Portal password"/></label>
        {error && <div className="error">{error}</div>}
        <button className="primary wide">Open control panel <ArrowRight size={17}/></button>
      </form>
      <div className="secure-foot"><KeyRound size={14}/> JWT session · bcrypt-ready authentication</div>
    </div>
  </div>;
}

function Overview({go}:{go:(x:string)=>void}) {
  return <div className="page">
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow"><span className="pulse"/> HTTPS / TLS OPERATIONS</div>
        <h1>A professional control room for your TLS bridge.</h1>
        <p>Move from public HTTPS to Go routing, NGINX target listeners and application traffic with a guided, review-first deployment workflow.</p>
        <div className="hero-actions"><button className="primary" onClick={()=>go("wizard")}>Start deployment <ArrowRight size={17}/></button><button className="secondary" onClick={()=>go("architecture")}>View architecture</button></div>
      </div>
      <div className="hero-visual">
        <div className="grid-glow"/>
        <div className="visual-node internet"><Globe/><b>Internet</b><small>:443</small></div>
        <div className="line l1"/>
        <div className="visual-node bridge"><Code2/><b>Go Bridge</b><small>SNI routing</small></div>
        <div className="line l2"/>
        <div className="visual-node nginx"><Server/><b>NGINX</b><small>:8443 / :9444</small></div>
        <div className="line l3"/>
        <div className="visual-node app"><Zap/><b>Application</b><small>private upstream</small></div>
      </div>
    </section>

    <div className="stats">
      <Stat icon={<ShieldCheck/>} value="TLS" label="Protected edge"/>
      <Stat icon={<Network/>} value="3" label="Target domains"/>
      <Stat icon={<Activity/>} value="7" label="Verification checks"/>
      <Stat icon={<RefreshCcw/>} value="1" label="Rollback path"/>
    </div>

    <section className="section">
      <div className="section-title"><div><p className="eyebrow">DEPLOYMENT FLOW</p><h2>Everything in the correct order</h2></div></div>
      <div className="steps">
        {[
          ["01","Prepare","Back up NGINX and confirm current listener ownership."],
          ["02","Build","Install Go, compile the bridge and create systemd service."],
          ["03","Route","Move public :443 to Go and target traffic to NGINX :8443."],
          ["04","Verify","Run TLS, HTTPS, listener and bridge-log checks."],
          ["05","Recover","Keep a tested rollback procedure beside the deployment."]
        ].map(x=><div className="step-card" key={x[0]}><span>{x[0]}</span><b>{x[1]}</b><p>{x[2]}</p></div>)}
      </div>
    </section>
  </div>;
}

function Stat({icon,value,label}:{icon:React.ReactNode,value:string,label:string}) {
  return <div className="stat"><div className="stat-icon">{icon}</div><div><b>{value}</b><span>{label}</span></div></div>;
}

function Wizard({cfg,setCfg}:{cfg:Config,setCfg:React.Dispatch<React.SetStateAction<Config>>}) {
  const [step,setStep]=useState(1);
  const [done,setDone]=useState(false);
  const domains=cfg.domains.join("\n");

  const generatedEnv = `TARGET_UPSTREAM=${cfg.targetUpstream}
FALLBACK_UPSTREAM=${cfg.fallbackUpstream}
TARGET_HOSTS=${cfg.domains.filter(Boolean).join(",")}
HUTCH_EXTENSION=${cfg.extension}
MSISDN_TLV=0xe0
STATUS_TLV=0xe1
TRACE=${cfg.trace ? 1 : 0}`;

  const nginx = cfg.domains.filter(Boolean).map(d=>`server {
    listen 127.0.0.1:${cfg.port} ssl proxy_protocol;
    server_name ${d};

    ssl_certificate /etc/ssl/${d}/fullchain.pem;
    ssl_certificate_key /etc/ssl/${d}/privkey.pem;

    proxy_set_header X-MSISDN $proxy_protocol_tlv_0xe0;

    location / {
        proxy_pass ${cfg.appUpstream};
    }
}`).join("\n\n");

  if(done) return <div className="page">
    <PageHead eyebrow="PACKAGE READY" title="Your deployment blueprint is ready." text="Review every generated file before applying it to production."/>
    <div className="ready-card"><div className="ready-icon"><CheckCircle2/></div><h2>Deployment configuration generated</h2><p>{cfg.customer || "TLS deployment"} · {cfg.domains.length} target domain(s)</p><div className="ready-files">{["hutch-bridge.env","hutch-msisdn-bridge.service","nginx-target.conf","verify.sh","rollback.sh","README.md"].map(f=><div key={f}><FileCode2 size={16}/>{f}<span>ready</span></div>)}</div><div className="hero-actions"><button className="primary" onClick={()=>downloadText("deployment-config.txt", `TLS DEPLOYMENT\\n\\n${generatedEnv}\\n\\n${nginx}`)}>Download config</button><button className="secondary" onClick={()=>setDone(false)}>Edit configuration</button></div></div>
  </div>;

  return <div className="page">
    <PageHead eyebrow="DEPLOYMENT WIZARD" title="Build a production deployment." text="Complete the stages below. Nothing is changed on your server by this UI."/>
    <div className="wizard-progress">{["Customer","Domains","Bridge","Review","Ready"].map((x,i)=><div className={step>i?"progress active":"progress"} key={x}><span>{step>i ? <Check size={14}/> : i+1}</span><b>{x}</b></div>)}</div>
    <section className="panel">
      {step===1 && <><PanelTitle icon={<Settings/>} title="Customer & environment" text="Identify the deployment and its public edge."/><div className="form-grid"><Field label="Customer / project" value={cfg.customer} placeholder="Acme Production Edge" onChange={v=>setCfg({...cfg,customer:v})}/><Field label="Public IPv4" value={cfg.publicIp} placeholder="46.62.253.110" onChange={v=>setCfg({...cfg,publicIp:v})}/></div><Actions next={()=>setStep(2)} disabled={!cfg.customer.trim()}/></>}
      {step===2 && <><PanelTitle icon={<Globe/>} title="Target HTTPS domains" text="These SNI names are sent to the Go bridge target list."/><label>Domains<textarea value={domains} rows={7} onChange={e=>setCfg({...cfg,domains:e.target.value.split(/[\s,]+/).filter(Boolean)})}/></label><div className="notice"><LightbulbIcon/> One hostname per line. Certificates must exist for each target hostname on NGINX.</div><Actions back={()=>setStep(1)} next={()=>setStep(3)} disabled={!cfg.domains.length}/></>}
      {step===3 && <><PanelTitle icon={<Network/>} title="Bridge & NGINX settings" text="Define the local handoff and application upstream."/><div className="form-grid"><Field label="Target upstream" value={cfg.targetUpstream} onChange={v=>setCfg({...cfg,targetUpstream:v})}/><Field label="Fallback upstream" value={cfg.fallbackUpstream} onChange={v=>setCfg({...cfg,fallbackUpstream:v})}/><Field label="NGINX target port" value={String(cfg.port)} onChange={v=>setCfg({...cfg,port:Number(v)||8443})}/><Field label="Application upstream" value={cfg.appUpstream} onChange={v=>setCfg({...cfg,appUpstream:v})}/><Field label="Hutch extension" value={String(cfg.extension)} onChange={v=>setCfg({...cfg,extension:Number(v)||17516})}/><label className="check"><input type="checkbox" checked={cfg.trace} onChange={e=>setCfg({...cfg,trace:e.target.checked})}/> Enable trace logging</label></div><Actions back={()=>setStep(2)} next={()=>setStep(4)}/></>}
      {step===4 && <><PanelTitle icon={<ShieldCheck/>} title="Review deployment" text="Confirm routing before generating artifacts."/><div className="review-grid">{[["Public edge","Go bridge :443"],["Target listener",`NGINX 127.0.0.1:${cfg.port}`],["Fallback",cfg.fallbackUpstream],["Target hosts",cfg.domains.join(", ")],["Hutch extension",String(cfg.extension)],["MSISDN TLV","0xe0"],["Status TLV","0xe1"]].map(x=><div className="review" key={x[0]}><span>{x[0]}</span><b>{x[1]}</b></div>)}</div><Actions back={()=>setStep(3)} next={()=>setDone(true)} text="Generate deployment"/></>}
    </section>
  </div>;
}

function Field({label,value,onChange,placeholder}:{label:string,value:string,onChange:(v:string)=>void,placeholder?:string}) {
  return <label>{label}<input value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/></label>;
}
function Actions({back,next,disabled=false,text="Continue"}:{back?:()=>void,next:()=>void,disabled?:boolean,text?:string}) {
  return <div className="actions">{back?<button className="secondary" onClick={back}><ArrowLeft size={16}/> Back</button>:<span/>}<button className="primary" disabled={disabled} onClick={next}>{text}<ArrowRight size={16}/></button></div>;
}
function PanelTitle({icon,title,text}:{icon:React.ReactNode,title:string,text:string}) {return <div className="panel-title"><div>{icon}</div><section><h2>{title}</h2><p>{text}</p></section></div>}
function PageHead({eyebrow,title,text}:{eyebrow:string,title:string,text:string}) {return <div className="page-head"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{text}</p></div>;}
function LightbulbIcon(){return <Sparkles size={17}/>}

function Architecture() {
  return <div className="page"><PageHead eyebrow="SYSTEM ARCHITECTURE" title="See every hop before you change it." text="The public edge belongs to the Go bridge. NGINX stays local."/><div className="architecture">
    <FlowNode icon={<Globe/>} title="Internet" sub="HTTPS :443"/>
    <FlowArrow/><FlowNode icon={<Code2/>} title="Go TLS Bridge" sub="SNI + ClientHello"/>
    <div className="route-label">Target SNI → :8443 · Other SNI → :9444</div>
    <div className="branches"><div><FlowNode icon={<Server/>} title="NGINX Target" sub="127.0.0.1:8443 · PROXY v2"/><FlowArrow/><FlowNode icon={<Zap/>} title="Target App" sub="application upstream"/></div><div><FlowNode icon={<Server/>} title="NGINX Fallback" sub="127.0.0.1:9444"/><FlowArrow/><FlowNode icon={<Globe/>} title="Existing Sites" sub="normal HTTPS"/></div></div>
  </div></div>;
}
function FlowNode({icon,title,sub}:{icon:React.ReactNode,title:string,sub:string}){return <div className="flow-node"><div>{icon}</div><b>{title}</b><small>{sub}</small></div>}
function FlowArrow(){return <div className="flow-arrow"><ArrowRight/></div>}


type OS = "linux" | "mac" | "windows";

const osCommands: Record<OS, {name:string; shell:string; steps:{title:string; code:string; note?:string}[]}> = {
  linux: {
    name: "Linux / Ubuntu",
    shell: "bash",
    steps: [
      {title:"Install prerequisites", code:`sudo apt update
sudo apt install -y nginx golang git curl openssl`},
      {title:"Create bridge account and directory", code:`sudo useradd --system --no-create-home --shell /usr/sbin/nologin hutchbridge || true
sudo mkdir -p /opt/hutch-msisdn-bridge-go
sudo chown -R hutchbridge:hutchbridge /opt/hutch-msisdn-bridge-go`},
      {title:"Build the reviewed Go source", code:`cd /opt/hutch-msisdn-bridge-go
go mod download
go build -o hutch-bridge .
sudo chmod 755 hutch-bridge
sudo chown hutchbridge:hutchbridge hutch-bridge`},
      {title:"Create environment", code:`sudo tee /etc/hutch-msisdn-bridge.env >/dev/null <<'EOF'
TARGET_UPSTREAM=127.0.0.1:8443
FALLBACK_UPSTREAM=127.0.0.1:9444
TARGET_HOSTS=sl.eduwav.com,sl.yumzyy.com,sl.radiofyy.com
HUTCH_EXTENSION=17516
MSISDN_TLV=0xe0
STATUS_TLV=0xe1
TRACE=1
EOF
sudo chmod 640 /etc/hutch-msisdn-bridge.env`},
      {title:"Create systemd service", code:`sudo tee /etc/systemd/system/hutch-msisdn-bridge.service >/dev/null <<'EOF'
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
EOF
sudo systemctl daemon-reload
sudo systemctl enable hutch-msisdn-bridge
sudo systemctl restart hutch-msisdn-bridge`},
      {title:"Verify", code:`sudo systemctl status hutch-msisdn-bridge --no-pager
sudo ss -lntp | grep -E ':443|:8443|:9444'
sudo nginx -t`},
    ]
  },
  mac: {
    name: "macOS",
    shell: "zsh",
    steps: [
      {title:"Install Homebrew packages", code:`brew update
brew install go nginx openssl curl`},
      {title:"Create project directory", code:`sudo mkdir -p /opt/hutch-msisdn-bridge-go
sudo chown -R "$(whoami)" /opt/hutch-msisdn-bridge-go
cd /opt/hutch-msisdn-bridge-go`},
      {title:"Build the reviewed Go source", code:`go mod download
go build -o hutch-bridge .
chmod 755 hutch-bridge`},
      {title:"Run locally for development", code:`export TARGET_UPSTREAM=127.0.0.1:8443
export FALLBACK_UPSTREAM=127.0.0.1:9444
export TARGET_HOSTS=sl.eduwav.com,sl.yumzyy.com,sl.radiofyy.com
export HUTCH_EXTENSION=17516
export MSISDN_TLV=0xe0
export STATUS_TLV=0xe1
export TRACE=1
./hutch-bridge`},
      {title:"Verify ports", code:`lsof -nP -iTCP:443 -sTCP:LISTEN
lsof -nP -iTCP:8443 -sTCP:LISTEN
lsof -nP -iTCP:9444 -sTCP:LISTEN`},
    ]
  },
  windows: {
    name: "Windows PowerShell",
    shell: "powershell",
    steps: [
      {title:"Install Go", code:`winget install --id GoLang.Go
go version`},
      {title:"Create project directory", code:`New-Item -ItemType Directory -Force C:\\hutch-msisdn-bridge-go
Set-Location C:\\hutch-msisdn-bridge-go`},
      {title:"Build the reviewed Go source", code:`go mod download
go build -o hutch-bridge.exe .
Get-ChildItem .\\hutch-bridge.exe`},
      {title:"Set development environment", code:`$env:TARGET_UPSTREAM="127.0.0.1:8443"
$env:FALLBACK_UPSTREAM="127.0.0.1:9444"
$env:TARGET_HOSTS="sl.eduwav.com,sl.yumzyy.com,sl.radiofyy.com"
$env:HUTCH_EXTENSION="17516"
$env:MSISDN_TLV="0xe0"
$env:STATUS_TLV="0xe1"
$env:TRACE="1"`},
      {title:"Run the bridge", code:`.\\hutch-bridge.exe`},
      {title:"Check listening ports", code:`Get-NetTCPConnection -State Listen |
  Where-Object {$_.LocalPort -in 443,8443,9444} |
  Format-Table LocalAddress,LocalPort,OwningProcess`},
    ]
  }
};

function OSGuide({cfg}:{cfg:Config}) {
  const [os,setOS]=useState<OS>("linux");
  const data=osCommands[os];
  return <div className="os-guide">
    <div className="os-tabs">
      {(["linux","mac","windows"] as OS[]).map(x=><button key={x} className={os===x?"os-tab active":"os-tab"} onClick={()=>setOS(x)}>
        {x==="linux"?"Linux":x==="mac"?"macOS":"Windows"}
      </button>)}
    </div>
    <div className="os-banner"><Terminal size={17}/><div><b>{data.name}</b><span>Commands are tailored for this operating system.</span></div></div>
    {data.steps.map((s,i)=><CodeCard key={s.title} title={`${String(i+1).padStart(2,"0")} · ${s.title}`} code={s.code} note={s.note}/>)}
  </div>;
}

function GoGuide({cfg}:{cfg:Config}) {
  const env=`TARGET_UPSTREAM=${cfg.targetUpstream}
FALLBACK_UPSTREAM=${cfg.fallbackUpstream}
TARGET_HOSTS=${cfg.domains.join(",")}
HUTCH_EXTENSION=${cfg.extension}
MSISDN_TLV=0xe0
STATUS_TLV=0xe1
TRACE=${cfg.trace?1:0}`;
  const service=`[Unit]
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
WantedBy=multi-user.target`;
  return <GuidePage eyebrow="GO BRIDGE" title="Install and run the TLS bridge." text="Use the commands in order. Build from your reviewed Go source."><CodeCard title="01 · Install prerequisites" code={`sudo apt update
sudo apt install -y nginx golang git

sudo useradd --system --no-create-home --shell /usr/sbin/nologin hutchbridge || true

sudo mkdir -p /opt/hutch-msisdn-bridge-go
sudo chown -R hutchbridge:hutchbridge /opt/hutch-msisdn-bridge-go`}/><CodeCard title="02 · Build the bridge" code={`cd /opt/hutch-msisdn-bridge-go

# Put your reviewed main.go and go.mod here.
go build -o hutch-bridge .

sudo chmod 755 hutch-bridge
sudo chown hutchbridge:hutchbridge hutch-bridge`}/><CodeCard title="03 · Bridge environment" code={env}/><CodeCard title="04 · systemd service" code={service}/><CodeCard title="05 · Start the service" code={`sudo systemctl daemon-reload
sudo systemctl enable hutch-msisdn-bridge
sudo systemctl restart hutch-msisdn-bridge

sudo systemctl status hutch-msisdn-bridge --no-pager`}/><CodeCard title="06 · Confirm listeners" code={`sudo ss -lntp | grep -E ':443|:8443|:9444'`}/></GuidePage>;
}

function NginxGuide({cfg}:{cfg:Config}) {
  const blocks=cfg.domains.map(d=>`server {
    listen 127.0.0.1:${cfg.port} ssl proxy_protocol;
    server_name ${d};

    ssl_certificate /etc/ssl/${d}/fullchain.pem;
    ssl_certificate_key /etc/ssl/${d}/privkey.pem;

    proxy_set_header X-MSISDN $proxy_protocol_tlv_0xe0;

    location / {
        proxy_pass ${cfg.appUpstream};
    }
}`).join("\n\n");
  return <GuidePage eyebrow="NGINX" title="Configure certificates, listeners and proxy headers." text="The target listener accepts PROXY v2 from the Go bridge. Keep it bound to loopback.">
    <CodeCard title="01 · Back up NGINX" code={`sudo cp -a /etc/nginx /etc/nginx.backup-before-hutch-$(date +%Y%m%d-%H%M%S)`}/>
    <CodeCard title="02 · Certificate directory" code={`sudo mkdir -p /etc/ssl/${cfg.domains[0] || "example.com"}
# Install the reviewed fullchain.pem and privkey.pem for each target domain.
# Do not paste private keys into this portal or commit them to source control.`}/>
    <CodeCard title="03 · Target server blocks" code={blocks}/>
    <CodeCard title="04 · Fallback listener" code={`# Existing non-target HTTPS sites should remain on:
listen 127.0.0.1:9444 ssl;

# Do not expose the fallback listener publicly.`}/>
    <CodeCard title="05 · Validate configuration" code={`sudo nginx -t
sudo nginx -T | grep -nE 'listen .*:(443|${cfg.port}|9444)|server_name'`}/>
    <CodeCard title="06 · Reload safely" code={`sudo systemctl reload nginx
sudo ss -lntp | grep -E ':443|:${cfg.port}|:9444'`}/>
    <div className="warning"><TriangleAlert/><div><b>Listener ownership matters</b><p>Before starting the bridge, verify nothing else owns public :443. The Go process must be the public TLS entry point in the reference architecture.</p></div></div>
  </GuidePage>;
}

function Verify({cfg}:{cfg:Config}) {
  const domains=cfg.domains.join(" ");
  return <GuidePage eyebrow="VERIFY & TEST" title="Prove the deployment works." text="Run each check and inspect the result before declaring the deployment complete."><CodeCard title="01 · NGINX validation" code={`sudo nginx -t
sudo ss -lntp | grep -E ':443|:${cfg.port}|:9444'`}/><CodeCard title="02 · Bridge health" code={`sudo systemctl status hutch-msisdn-bridge --no-pager
sudo journalctl -u hutch-msisdn-bridge --since "10 minutes ago" --no-pager`}/><CodeCard title="03 · TLS handshake — all target domains" code={`for d in ${domains}; do
  echo
  echo "========== $d =========="
  echo | openssl s_client -connect 127.0.0.1:443 -servername "$d" -brief 2>&1 |
    grep -E 'CONNECTION|Protocol|Ciphersuite|Peer certificate|Verification|DNS|error'
done`}/><CodeCard title="04 · HTTPS response" code={`for d in ${domains}; do
  echo
  echo "========== HTTPS $d =========="
  curl -kIsS --connect-timeout 10 --max-time 20 \\
    --resolve "$d:443:${cfg.publicIp}" \\
    "https://$d/" | head -n 12
done`}/><CodeCard title="05 · Find target portal logs" code={`sudo journalctl -u hutch-msisdn-bridge --since "1 hour ago" --no-pager |
grep -E 'sl\\.eduwav\\.com|sl\\.yumzyy\\.com|sl\\.radiofyy\\.com'`}/><CodeCard title="06 · Watch target traffic live" code={`sudo journalctl -u hutch-msisdn-bridge -f |
grep -E 'sl\\.eduwav\\.com|sl\\.yumzyy\\.com|sl\\.radiofyy\\.com'`}/></GuidePage>;
}

function GuidePage({eyebrow,title,text,children}:{eyebrow:string,title:string,text:string,children:React.ReactNode}) {return <div className="page"><PageHead eyebrow={eyebrow} title={title} text={text}/><div className="guide">{children}</div></div>;}

function Trouble() {
  const items=[
    ["Port 443 is already in use","Run ss -lntp and identify the current owner. Do not start a second public listener."],
    ["NGINX cannot bind to 8443","Check nginx -T for duplicate 8443 blocks and confirm only the intended target blocks use proxy_protocol."],
    ["Wrong certificate","Verify SNI and the target server_name. Confirm fullchain.pem and privkey.pem paths."],
    ["MSISDN is empty","Inspect bridge trace logs. Confirm the real ClientHello contains the expected Hutch extension and that the bridge extracted it."],
    ["Target works but other sites fail","Verify the fallback NGINX listener remains on 127.0.0.1:9444 and non-target SNI is routed there."],
    ["502 from the application","Check the application upstream and verify the app is listening locally."],
    ["Bridge starts then stops","Inspect systemctl status and journalctl. Check environment variables, binary permissions and port ownership."]
  ];
  return <div className="page"><PageHead eyebrow="KNOWLEDGE BASE" title="Troubleshoot from the edge inward." text="Start with listener ownership, then service logs, SNI routing and the application upstream."/><div className="faq">{items.map(x=><details key={x[0]}><summary><TriangleAlert size={16}/><b>{x[0]}</b><ChevronRight/></summary><p>{x[1]}</p><code>sudo ss -lntp | grep -E ':443|:8443|:9444'</code></details>)}</div></div>;
}

function PlatformGuide({cfg}:{cfg:Config}) {
  return <div className="page">
    <PageHead eyebrow="PLATFORM SETUP" title="Choose your operating system." text="Use the matching guide for development or customer-side deployment. Linux is the reference production layout for the systemd + NGINX architecture."/>
    <OSGuide cfg={cfg}/>
    <div className="platform-grid">
      <div className="info-card"><ShieldCheck/><b>Linux production</b><p>Recommended reference layout: Go owns public :443, NGINX owns local :8443 and :9444.</p></div>
      <div className="info-card"><Code2/><b>macOS development</b><p>Use the environment-variable workflow to run and test the bridge locally.</p></div>
      <div className="info-card"><Terminal/><b>Windows development</b><p>Use PowerShell and Go for source/build testing. Production NGINX commands are not Windows commands.</p></div>
    </div>
  </div>;
}

function Rollback() {
  return <div className="page"><PageHead eyebrow="RECOVERY" title="Rollback with a known-good sequence." text="Keep the pre-change backup path explicit. Replace the example path with your actual backup."/><div className="guide"><CodeCard title="01 · Stop the bridge" code={`sudo systemctl stop hutch-msisdn-bridge
sudo ss -lntp | grep ':443'`}/><CodeCard title="02 · Restore your NGINX backup" code={`# Replace with the backup created before your change.
sudo cp -a /etc/nginx.backup-before-change /etc/nginx
sudo nginx -t`}/><CodeCard title="03 · Reload NGINX" code={`sudo systemctl reload nginx
sudo ss -lntp | grep -E ':443|:8443|:9444'`}/><CodeCard title="04 · Keep bridge disabled until repaired" code={`sudo systemctl disable hutch-msisdn-bridge
sudo journalctl -u hutch-msisdn-bridge -n 100 --no-pager`}/></div></div>;
}

function downloadText(name:string,text:string) {
  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([text],{type:"text/plain"})); a.download=name; a.click(); URL.revokeObjectURL(a.href);
}

createRoot(document.getElementById("root")!).render(<App/>);
