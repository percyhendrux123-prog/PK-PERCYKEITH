import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, Command, ArrowUpRight, ArrowRight, Plus, Sparkles,
  Users, Library, Settings, Activity, ChevronRight, Filter,
  MoreHorizontal, Clock, Send, X, CornerDownLeft, Zap,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────
// PKFIT · IDENTITY ARCHITECT · PERCY KEITH
// Operator console — Liquid Glass / true black / Geist
// ─────────────────────────────────────────────────────────
const TK = {
  field: '#000000',
  raise1: '#0A0A0A',
  raise2: '#141414',
  text: '#FAFAFA',
  textDim: 'rgba(250,250,250,0.62)',
  textMute: 'rgba(250,250,250,0.40)',
  textGhost: 'rgba(250,250,250,0.22)',
  hairline: 'rgba(250,250,250,0.08)',
  hairlineStrong: 'rgba(250,250,250,0.14)',
  gold: '#C9A961',
  goldSoft: 'rgba(201,169,97,0.22)',
  goldGlow: 'rgba(201,169,97,0.35)',
  success: 'rgba(108,197,154,0.85)',
  warn: 'rgba(224,185,122,0.85)',
  danger: 'rgba(224,122,108,0.85)',
};

const STYLES = `
  :root {
    --pk-field: #000;
    --pk-text: #FAFAFA;
    --pk-gold: #C9A961;
  }

  .pk-hub { font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #000; color: #FAFAFA; min-height: 100vh; }
  .pk-mono { font-family: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace; font-feature-settings: "tnum"; }

  /* Liquid Glass surfaces */
  .pk-glass {
    background: rgba(250, 250, 250, 0.035);
    -webkit-backdrop-filter: blur(28px) saturate(180%);
    backdrop-filter: blur(28px) saturate(180%);
    border: 1px solid rgba(250, 250, 250, 0.08);
    border-radius: 18px;
    position: relative;
    overflow: hidden;
  }
  .pk-glass::before {
    content: ''; position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(180deg, rgba(255,255,255,0.06), transparent 22%);
    border-radius: inherit;
  }
  .pk-glass-elev {
    background: rgba(250, 250, 250, 0.055);
    -webkit-backdrop-filter: blur(40px) saturate(200%);
    backdrop-filter: blur(40px) saturate(200%);
    border: 1px solid rgba(201, 169, 97, 0.16);
  }

  .pk-row-hover { transition: background 180ms ease, border-color 180ms ease; }
  .pk-row-hover:hover { background: rgba(250,250,250,0.04); }

  .pk-cta {
    font-family: 'Geist Mono', monospace;
    letter-spacing: 0.16em; text-transform: uppercase;
    font-size: 11px; font-weight: 600;
    padding: 11px 18px; border-radius: 10px;
    background: #FAFAFA; color: #000; border: none; cursor: pointer;
    display: inline-flex; align-items: center; gap: 8px;
    transition: transform 180ms cubic-bezier(0.2,0.7,0.2,1);
  }
  .pk-cta:hover { transform: translateY(-1px); }
  .pk-cta:active { transform: translateY(0) scale(0.98); }

  .pk-cta-ghost {
    font-family: 'Geist Mono', monospace;
    letter-spacing: 0.16em; text-transform: uppercase;
    font-size: 11px; font-weight: 600;
    padding: 11px 18px; border-radius: 10px;
    background: rgba(250,250,250,0.04); color: #FAFAFA;
    border: 1px solid rgba(250,250,250,0.10); cursor: pointer;
    display: inline-flex; align-items: center; gap: 8px;
    transition: all 180ms ease;
  }
  .pk-cta-ghost:hover { background: rgba(250,250,250,0.07); border-color: rgba(250,250,250,0.18); }

  .pk-label {
    font-family: 'Geist Mono', monospace;
    letter-spacing: 0.20em; text-transform: uppercase;
    font-size: 10px; color: rgba(250,250,250,0.40); font-weight: 500;
  }

  .pk-display { font-weight: 800; letter-spacing: -0.04em; line-height: 0.92; }

  /* Spotlight that follows cursor — subtle Bruce Wayne energy */
  .pk-spot {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background: radial-gradient(600px circle at var(--mx, 50%) var(--my, 50%), rgba(201,169,97,0.06), transparent 50%);
    transition: background 80ms linear;
  }

  /* Grain */
  .pk-grain::after {
    content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 1;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.025 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    opacity: 0.6; mix-blend-mode: overlay;
  }

  /* Status dots */
  .pk-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
  .pk-dot-gold { background: #C9A961; box-shadow: 0 0 8px rgba(201,169,97,0.6); }
  .pk-dot-green { background: #6CC59A; box-shadow: 0 0 6px rgba(108,197,154,0.4); }
  .pk-dot-warn { background: #E0B97A; }
  .pk-dot-mute { background: rgba(250,250,250,0.25); }

  /* Command palette */
  .pk-pal-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(0,0,0,0.6);
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
    display: flex; align-items: flex-start; justify-content: center;
    padding-top: 18vh;
    animation: pk-fade 180ms ease both;
  }
  @keyframes pk-fade { from { opacity: 0; } to { opacity: 1; } }
  @keyframes pk-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

  .pk-kbd {
    font-family: 'Geist Mono', monospace; font-size: 10px;
    padding: 3px 6px; border-radius: 5px;
    background: rgba(250,250,250,0.06);
    border: 1px solid rgba(250,250,250,0.10);
    color: rgba(250,250,250,0.62);
    letter-spacing: 0.04em;
  }

  .pk-link { color: rgba(250,250,250,0.62); text-decoration: none; transition: color 180ms ease; }
  .pk-link:hover { color: #FAFAFA; }

  /* Scroll niceties */
  .pk-hub *::-webkit-scrollbar { width: 6px; height: 6px; }
  .pk-hub *::-webkit-scrollbar-thumb { background: rgba(250,250,250,0.10); border-radius: 3px; }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
  }
`;

// ─────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────
const NOW = { weekday: 'TUE', date: '02 MAY', time: '10:51' };
const COACH = { initials: 'PK', name: 'Percy Keith' };

const SESSIONS_DUE = [
  { id: 1, client: 'M. Rivera', tag: 'Push · Hypertrophy', due: '06:00 PM', status: 'gold', delta: '+5 lb bench last' },
  { id: 2, client: 'J. Kim', tag: 'Pull · Volume', due: '07:30 PM', status: 'green', delta: 'Hit RPE 8 across' },
  { id: 3, client: 'P. Shah', tag: 'Mobility · Recovery', due: '08:00 PM', status: 'mute', delta: 'New block · day 1' },
];

const CLIENTS = [
  { id: 1, name: 'Maria Rivera',     status: 'gold',  next: '06:00 PM',  last: '12h ago',   tag: 'Push · Hypertrophy', notes: '+5 lb OHP last Friday' },
  { id: 2, name: 'Jordan Kim',       status: 'green', next: '07:30 PM',  last: '1d ago',    tag: 'Pull · Volume',      notes: 'Wants to add a 4th day' },
  { id: 3, name: 'Priya Shah',       status: 'mute',  next: '08:00 PM',  last: '2d ago',    tag: 'Mobility',           notes: 'Returning from knee tweak' },
  { id: 4, name: 'Diego Santos',     status: 'green', next: 'Wed 6:30',  last: '3h ago',    tag: 'Legs · Heavy',       notes: '12-week peak phase' },
  { id: 5, name: 'Aisha Mensah',     status: 'warn',  next: 'Wed 7:00',  last: '5d ago',    tag: 'Full body',          notes: 'Slipping on check-ins' },
  { id: 6, name: 'Liam O\'Connor',   status: 'green', next: 'Thu 5:30',  last: '6h ago',    tag: 'Push · Strength',    notes: 'Form video pending review' },
  { id: 7, name: 'Sana Patel',       status: 'mute',  next: 'Thu 8:00',  last: '4d ago',    tag: 'Hybrid · Run',       notes: 'Marathon block week 3' },
  { id: 8, name: 'Marcus Webb',      status: 'green', next: 'Fri 6:00',  last: '8h ago',    tag: 'Pull · Heavy',       notes: 'Deload next week' },
  { id: 9, name: 'Eli Schwartz',     status: 'gold',  next: 'Fri 7:30',  last: '2h ago',    tag: 'Legs · Volume',      notes: 'Squat PR target Sat' },
  { id: 10, name: 'Naomi Carter',    status: 'warn',  next: 'Sat 10:00', last: '7d ago',    tag: 'Full body',          notes: 'Needs re-engagement DM' },
  { id: 11, name: 'Tobi Adebayo',    status: 'green', next: 'Sat 11:30', last: '1d ago',    tag: 'Push · Hyp.',        notes: 'Feeling strong this block' },
  { id: 12, name: 'Hana Watanabe',   status: 'mute',  next: 'Sun 9:00',  last: '3d ago',    tag: 'Mobility',           notes: 'Light week — travel' },
];

const LIBRARY_TEMPLATES = [
  { id: 1, name: 'PUSH · HYPERTROPHY · A',   sets: 24, time: '72m', uses: 38 },
  { id: 2, name: 'PULL · VOLUME · A',        sets: 22, time: '65m', uses: 41 },
  { id: 3, name: 'LEGS · HEAVY · A',         sets: 20, time: '78m', uses: 29 },
  { id: 4, name: 'MOBILITY · 24',            sets: 12, time: '24m', uses: 52 },
  { id: 5, name: 'PUSH · STRENGTH · A',      sets: 18, time: '60m', uses: 22 },
  { id: 6, name: 'FULL BODY · 45',           sets: 14, time: '45m', uses: 17 },
];

const COMMANDS = [
  { id: 'gen-workout',  label: 'Generate workout for client...', icon: Sparkles, hint: 'AI' },
  { id: 'open-client',  label: 'Open client view...',            icon: Users,    hint: 'Nav' },
  { id: 'assign-tmpl',  label: 'Assign template to client...',   icon: Library,  hint: 'Action' },
  { id: 'new-msg',      label: 'New message...',                 icon: Send,     hint: 'Action' },
  { id: 'log-pr',       label: 'Log a PR...',                    icon: Activity, hint: 'Action' },
  { id: 'settings',     label: 'Open settings',                  icon: Settings, hint: 'Nav' },
];

// ─────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────
const Header = ({ onCmd }) => (
  <header style={{
    position: 'sticky', top: 0, zIndex: 50,
    padding: '14px 28px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(20px) saturate(160%)',
    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
    borderBottom: `1px solid ${TK.hairline}`,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 26, height: 26, borderRadius: 7,
        background: TK.gold, color: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: 13, letterSpacing: '-0.04em',
      }}>P</div>
      <div className="pk-mono" style={{
        fontSize: 11, letterSpacing: '0.20em', textTransform: 'uppercase',
        color: TK.text, fontWeight: 600,
      }}>
        PKFIT <span style={{ color: TK.textMute, margin: '0 8px' }}>·</span>
        <span style={{ color: TK.textDim }}>IDENTITY ARCHITECT</span>
        <span style={{ color: TK.textMute, margin: '0 8px' }}>·</span>
        <span style={{ color: TK.textMute }}>PERCY KEITH</span>
      </div>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button
        onClick={onCmd}
        className="pk-glass pk-row-hover"
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 12px 8px 14px', borderRadius: 10,
          color: TK.textDim, fontSize: 13, cursor: 'pointer',
          border: `1px solid ${TK.hairline}`, background: 'rgba(250,250,250,0.025)',
        }}
      >
        <Search size={13} strokeWidth={2} />
        <span style={{ fontFamily: 'Geist Mono, monospace', fontSize: 12 }}>Search</span>
        <span className="pk-kbd">⌘K</span>
      </button>
      <div style={{
        width: 30, height: 30, borderRadius: 8,
        background: 'rgba(250,250,250,0.06)',
        border: `1px solid ${TK.hairline}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Geist Mono, monospace', fontSize: 11, fontWeight: 600,
        letterSpacing: '0.05em',
      }}>
        {COACH.initials}
      </div>
    </div>
  </header>
);

// ─────────────────────────────────────────────────────────
// HERO — "WHAT'S NEXT?"
// ─────────────────────────────────────────────────────────
const Hero = () => (
  <section style={{ padding: '64px 28px 32px', maxWidth: 1320, margin: '0 auto', width: '100%' }}>
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      marginBottom: 28, flexWrap: 'wrap', gap: 12,
    }}>
      <div className="pk-label">TODAY · OPERATOR'S CONSOLE</div>
      <div className="pk-mono" style={{
        fontSize: 12, color: TK.textDim, letterSpacing: '0.10em',
      }}>
        {NOW.weekday} · {NOW.date} · {NOW.time}
      </div>
    </div>

    <h1 className="pk-display" style={{
      fontSize: 'clamp(64px, 11vw, 168px)',
      margin: 0, color: TK.text,
    }}>
      what's<br />
      <span style={{ color: TK.gold }}>next?</span>
    </h1>

    <div style={{
      marginTop: 36, display: 'flex', gap: 36, flexWrap: 'wrap',
      borderTop: `1px solid ${TK.hairline}`, paddingTop: 24,
    }}>
      <Stat n="03" label="sessions due" />
      <Stat n="02" label="messages" accent />
      <Stat n="01" label="PR logged" />
      <Stat n="12" label="active clients" />
    </div>
  </section>
);

const Stat = ({ n, label, accent }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
    <span className="pk-mono" style={{
      fontSize: 38, fontWeight: 600, letterSpacing: '-0.04em',
      color: accent ? TK.gold : TK.text,
    }}>{n}</span>
    <span className="pk-label">{label}</span>
  </div>
);

// ─────────────────────────────────────────────────────────
// TODAY GRID — sessions due
// ─────────────────────────────────────────────────────────
const TodayGrid = () => (
  <section style={{ padding: '24px 28px', maxWidth: 1320, margin: '0 auto', width: '100%' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <div className="pk-label">DUE TODAY</div>
      <a href="#" className="pk-link pk-mono" style={{
        fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        ALL SESSIONS <ArrowUpRight size={12} strokeWidth={2} />
      </a>
    </div>

    <div style={{
      display: 'grid', gap: 14,
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    }}>
      {SESSIONS_DUE.map((s) => (
        <SessionCard key={s.id} s={s} />
      ))}
    </div>
  </section>
);

const SessionCard = ({ s }) => {
  const [hover, setHover] = useState(false);
  return (
    <div
      className="pk-glass"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: 20, cursor: 'pointer',
        borderColor: hover ? 'rgba(201,169,97,0.30)' : TK.hairline,
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 240ms cubic-bezier(0.2,0.7,0.2,1)',
        background: hover ? 'rgba(250,250,250,0.05)' : 'rgba(250,250,250,0.035)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span className={`pk-dot pk-dot-${s.status}`} />
        <span className="pk-mono" style={{ fontSize: 11, color: TK.textMute, letterSpacing: '0.10em' }}>
          {s.due}
        </span>
      </div>
      <div style={{
        fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: TK.text, marginBottom: 6,
      }}>
        {s.client}
      </div>
      <div className="pk-mono" style={{
        fontSize: 11, color: TK.textDim, letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>
        {s.tag}
      </div>
      <div style={{
        marginTop: 18, paddingTop: 14, borderTop: `1px solid ${TK.hairline}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, color: TK.textMute }}>{s.delta}</span>
        <ArrowRight size={14} strokeWidth={2} color={hover ? TK.gold : TK.textMute} />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// CLIENTS TABLE
// ─────────────────────────────────────────────────────────
const ClientsPanel = ({ q, setQ }) => {
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return CLIENTS;
    return CLIENTS.filter(c => c.name.toLowerCase().includes(needle) || c.tag.toLowerCase().includes(needle));
  }, [q]);

  return (
    <section style={{ padding: '24px 28px', maxWidth: 1320, margin: '0 auto', width: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16, flexWrap: 'wrap', gap: 12,
      }}>
        <div className="pk-label">CLIENTS · {CLIENTS.length}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="pk-glass" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 12px', minWidth: 240,
          }}>
            <Search size={13} color={TK.textMute} strokeWidth={2} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search clients, tags…"
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: TK.text, fontSize: 13, fontFamily: 'inherit',
                width: '100%',
              }}
            />
          </div>
          <button className="pk-cta-ghost" style={{ padding: '7px 14px' }}>
            <Filter size={12} strokeWidth={2} /> FILTER
          </button>
          <button className="pk-cta" style={{ padding: '7px 14px' }}>
            <Plus size={13} strokeWidth={2.4} /> NEW CLIENT
          </button>
        </div>
      </div>

      <div className="pk-glass" style={{ padding: 0, overflow: 'hidden' }}>
        {/* table head */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '24px 1.6fr 1fr 0.9fr 1fr 24px',
          gap: 16, padding: '14px 20px',
          borderBottom: `1px solid ${TK.hairline}`,
          fontFamily: 'Geist Mono, monospace',
          fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
          color: TK.textMute, fontWeight: 500,
        }}>
          <span></span>
          <span>Client</span>
          <span>Block</span>
          <span>Last seen</span>
          <span>Next due</span>
          <span></span>
        </div>
        {filtered.map((c, i) => (
          <ClientRow key={c.id} c={c} last={i === filtered.length - 1} />
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: TK.textMute, fontSize: 13 }}>
            No matches.
          </div>
        )}
      </div>
    </section>
  );
};

const ClientRow = ({ c, last }) => {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="pk-row-hover"
      style={{
        display: 'grid',
        gridTemplateColumns: '24px 1.6fr 1fr 0.9fr 1fr 24px',
        gap: 16, padding: '16px 20px',
        borderBottom: last ? 'none' : `1px solid ${TK.hairline}`,
        alignItems: 'center', cursor: 'pointer',
        background: hover ? 'rgba(250,250,250,0.04)' : 'transparent',
      }}
    >
      <span className={`pk-dot pk-dot-${c.status}`} />
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: TK.text, letterSpacing: '-0.01em' }}>{c.name}</div>
        <div style={{ fontSize: 12, color: TK.textMute, marginTop: 2 }}>{c.notes}</div>
      </div>
      <span className="pk-mono" style={{ fontSize: 11, color: TK.textDim, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {c.tag}
      </span>
      <span className="pk-mono" style={{ fontSize: 12, color: TK.textMute }}>
        {c.last}
      </span>
      <span className="pk-mono" style={{ fontSize: 12, color: TK.text, letterSpacing: '0.04em' }}>
        {c.next}
      </span>
      <ChevronRight size={14} color={hover ? TK.gold : TK.textGhost} strokeWidth={2} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// LIBRARY
// ─────────────────────────────────────────────────────────
const LibraryPanel = () => (
  <section style={{ padding: '24px 28px', maxWidth: 1320, margin: '0 auto', width: '100%' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div className="pk-label">LIBRARY · TEMPLATES</div>
      <button className="pk-cta-ghost" style={{ padding: '7px 14px' }}>
        <Plus size={12} strokeWidth={2.4} /> NEW TEMPLATE
      </button>
    </div>
    <div style={{
      display: 'grid', gap: 12,
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    }}>
      {LIBRARY_TEMPLATES.map((t) => <TemplateCard key={t.id} t={t} />)}
    </div>
  </section>
);

const TemplateCard = ({ t }) => {
  const [hover, setHover] = useState(false);
  return (
    <div
      className="pk-glass"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: 18, cursor: 'pointer',
        borderColor: hover ? 'rgba(201,169,97,0.28)' : TK.hairline,
        transition: 'all 220ms ease',
      }}
    >
      <div className="pk-mono" style={{
        fontSize: 13, fontWeight: 600, color: TK.text,
        letterSpacing: '0.06em', marginBottom: 14,
      }}>
        {t.name}
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontFamily: 'Geist Mono, monospace', fontSize: 11, color: TK.textMute,
        letterSpacing: '0.10em', textTransform: 'uppercase',
      }}>
        <span>{t.sets} sets</span>
        <span>{t.time}</span>
        <span>{t.uses}× used</span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// AI PANEL
// ─────────────────────────────────────────────────────────
const AIPanel = () => {
  const [q, setQ] = useState('');
  const prompts = [
    'Generate a 4-week pull block for J. Kim',
    'Why did M. Rivera plateau on bench?',
    'Build a deload week for D. Santos',
    'Suggest a meal plan for 180g protein, dairy-free',
  ];
  return (
    <section style={{ padding: '24px 28px 56px', maxWidth: 1320, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <Sparkles size={13} color={TK.gold} strokeWidth={2.4} />
        <div className="pk-label" style={{ color: TK.gold }}>AI · COACH SYSTEM</div>
      </div>
      <div className="pk-glass pk-glass-elev" style={{ padding: 22 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 16px', borderRadius: 12,
          background: 'rgba(0,0,0,0.4)', border: `1px solid ${TK.hairline}`,
          marginBottom: 16,
        }}>
          <Zap size={14} color={TK.gold} strokeWidth={2.2} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ask the system. Generate. Decide."
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: TK.text, fontSize: 14, fontFamily: 'inherit', flex: 1,
            }}
          />
          <CornerDownLeft size={13} color={TK.textMute} strokeWidth={2} />
        </div>
        <div className="pk-label" style={{ marginBottom: 10 }}>SUGGESTED</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {prompts.map((p) => (
            <button
              key={p}
              onClick={() => setQ(p)}
              className="pk-row-hover"
              style={{
                padding: '8px 12px', borderRadius: 8,
                background: 'rgba(250,250,250,0.03)',
                border: `1px solid ${TK.hairline}`,
                color: TK.textDim, fontSize: 12, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────
// COMMAND PALETTE
// ─────────────────────────────────────────────────────────
const Palette = ({ open, onClose }) => {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) { setQ(''); setActive(0); setTimeout(() => inputRef.current?.focus(), 30); }
  }, [open]);

  const items = useMemo(() => {
    const cmds = COMMANDS.map(c => ({ kind: 'cmd', ...c }));
    const cls = CLIENTS.slice(0, 5).map(c => ({ kind: 'client', id: c.id, label: c.name, sub: c.tag, icon: Users }));
    const all = [...cmds, ...cls];
    if (!q.trim()) return all;
    const n = q.trim().toLowerCase();
    return all.filter(i => i.label.toLowerCase().includes(n) || (i.sub || '').toLowerCase().includes(n));
  }, [q]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
      else if (e.key === 'Enter') { e.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, items.length, onClose]);

  if (!open) return null;
  return (
    <div className="pk-pal-overlay" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="pk-glass pk-glass-elev"
        style={{
          width: 'min(640px, 92vw)', padding: 0,
          animation: 'pk-rise 220ms cubic-bezier(0.2,0.7,0.2,1) both',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 20px', borderBottom: `1px solid ${TK.hairline}`,
        }}>
          <Search size={14} color={TK.textDim} strokeWidth={2} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0); }}
            placeholder="Type a command or search…"
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: TK.text, fontSize: 15, fontFamily: 'inherit',
              flex: 1, letterSpacing: '-0.01em',
            }}
          />
          <span className="pk-kbd">ESC</span>
        </div>
        <div style={{ maxHeight: 360, overflow: 'auto', padding: '8px 0' }}>
          {items.length === 0 && (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: TK.textMute, fontSize: 13 }}>
              No matches.
            </div>
          )}
          {items.map((it, i) => {
            const Icon = it.icon || Command;
            const isActive = i === active;
            return (
              <div
                key={`${it.kind}-${it.id}`}
                onMouseEnter={() => setActive(i)}
                onClick={onClose}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '11px 20px', cursor: 'pointer',
                  background: isActive ? 'rgba(201,169,97,0.10)' : 'transparent',
                  borderLeft: `2px solid ${isActive ? TK.gold : 'transparent'}`,
                }}
              >
                <Icon size={14} color={isActive ? TK.gold : TK.textDim} strokeWidth={2} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: TK.text }}>{it.label}</div>
                  {it.sub && (
                    <div className="pk-mono" style={{
                      fontSize: 11, color: TK.textMute, marginTop: 2,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}>{it.sub}</div>
                  )}
                </div>
                <span className="pk-mono" style={{
                  fontSize: 10, color: TK.textMute,
                  letterSpacing: '0.10em', textTransform: 'uppercase',
                }}>
                  {it.hint || (it.kind === 'client' ? 'Open' : '')}
                </span>
                {isActive && <CornerDownLeft size={11} color={TK.gold} strokeWidth={2} />}
              </div>
            );
          })}
        </div>
        <div style={{
          display: 'flex', gap: 16, padding: '10px 20px',
          borderTop: `1px solid ${TK.hairline}`,
          fontFamily: 'Geist Mono, monospace', fontSize: 10,
          color: TK.textMute, letterSpacing: '0.10em', textTransform: 'uppercase',
        }}>
          <span><span className="pk-kbd">↑↓</span> navigate</span>
          <span><span className="pk-kbd">↵</span> select</span>
          <span><span className="pk-kbd">esc</span> close</span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────
const Footer = () => (
  <footer style={{
    padding: '40px 28px 28px',
    maxWidth: 1320, margin: '0 auto', width: '100%',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderTop: `1px solid ${TK.hairline}`,
    flexWrap: 'wrap', gap: 12,
  }}>
    <div className="pk-mono" style={{
      fontSize: 10, letterSpacing: '0.20em', textTransform: 'uppercase',
      color: TK.textMute,
    }}>
      PKFIT · IDENTITY ARCHITECT · PERCY KEITH
    </div>
    <div className="pk-mono" style={{
      fontSize: 10, letterSpacing: '0.18em', textTransform: 'lowercase',
      color: TK.textGhost,
    }}>
      powered by claude
    </div>
  </footer>
);

// ─────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────
export default function Hub() {
  const [palette, setPalette] = useState(false);
  const [q, setQ] = useState('');

  // Cursor spotlight
  useEffect(() => {
    const onMove = (e) => {
      document.documentElement.style.setProperty('--mx', `${e.clientX}px`);
      document.documentElement.style.setProperty('--my', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // ⌘K
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="pk-hub pk-grain">
      <style>{STYLES}</style>
      <div className="pk-spot" />
      <Header onCmd={() => setPalette(true)} />
      <Hero />
      <TodayGrid />
      <ClientsPanel q={q} setQ={setQ} />
      <LibraryPanel />
      <AIPanel />
      <Footer />
      <Palette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}
