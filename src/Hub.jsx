import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, ArrowUpRight, ArrowRight, Plus, Sparkles,
  Users, ChevronRight, Filter, Send, X, CornerDownLeft,
  Zap, Loader2, Trophy, Activity, Calendar, LogOut,
  ExternalLink, MessageSquare, ClipboardCheck,
} from 'lucide-react';
import { supabase } from './lib/supabase.js';
import { useAuth, signOut, SignIn } from './lib/auth.jsx';

// ─────────────────────────────────────────────────────────
// PKFIT · IDENTITY ARCHITECT · PERCY KEITH
// Operator console — pointing at real coaching schema
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
  .pk-hub { font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #000; color: #FAFAFA; min-height: 100vh; }
  .pk-mono { font-family: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace; font-feature-settings: "tnum"; }
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
  .pk-cta-gold {
    background: #C9A961; color: #000;
  }
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
  .pk-spot {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background: radial-gradient(600px circle at var(--mx, 50%) var(--my, 50%), rgba(201,169,97,0.06), transparent 50%);
    transition: background 80ms linear;
  }
  .pk-grain::after {
    content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 1;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.025 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    opacity: 0.6; mix-blend-mode: overlay;
  }
  .pk-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
  .pk-dot-gold { background: #C9A961; box-shadow: 0 0 8px rgba(201,169,97,0.6); }
  .pk-dot-green { background: #6CC59A; box-shadow: 0 0 6px rgba(108,197,154,0.4); }
  .pk-dot-warn { background: #E0B97A; }
  .pk-dot-mute { background: rgba(250,250,250,0.25); }
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
  @keyframes pk-spin { to { transform: rotate(360deg); } }
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
  .pk-hub *::-webkit-scrollbar { width: 6px; height: 6px; }
  .pk-hub *::-webkit-scrollbar-thumb { background: rgba(250,250,250,0.10); border-radius: 3px; }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
  }
`;

const INTAKE_URL = 'https://pkfit-intake.netlify.app/';
const CHECKIN_URL = 'https://pkfit-checkin.netlify.app/';

// ─────────────────────────────────────────────────────────
// Formatters
// ─────────────────────────────────────────────────────────
const formatRelative = (date) => {
  if (!date) return '—';
  const ms = Date.now() - new Date(date).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  return `${mo}mo ago`;
};
const formatNow = () => {
  const d = new Date();
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    date: d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }).toUpperCase(),
    time: d.toTimeString().slice(0, 5),
  };
};

// Derive a status dot from recent activity
const deriveStatus = (lastActiveAt, hasRecentPR) => {
  if (hasRecentPR) return 'gold';
  if (!lastActiveAt) return 'mute';
  const days = (Date.now() - new Date(lastActiveAt).getTime()) / (1000 * 60 * 60 * 24);
  if (days < 3) return 'green';
  if (days < 7) return 'green';
  if (days < 14) return 'warn';
  return 'mute';
};

// Detect a "PR" by scanning workout_sessions.exercises jsonb for new max weights
const extractTopLifts = (sessions) => {
  // sessions is sorted desc by performed_at
  // exercises jsonb shape varies; try to be tolerant
  const maxByLift = {}; // name -> { weight, sessionId }
  for (const s of [...sessions].reverse()) {
    const list = Array.isArray(s.exercises) ? s.exercises : (s.exercises?.items || []);
    for (const ex of list) {
      const name = ex.name || ex.exercise || ex.lift;
      if (!name) continue;
      const sets = Array.isArray(ex.sets) ? ex.sets : [];
      const max = sets.reduce((m, set) => Math.max(m, Number(set.weight || set.lb || set.kg) || 0), 0);
      if (max > 0 && (!maxByLift[name] || max > maxByLift[name].weight)) {
        maxByLift[name] = { weight: max, sessionId: s.id, performed_at: s.performed_at };
      }
    }
  }
  return maxByLift;
};

// ─────────────────────────────────────────────────────────
// Data hook — real tables
// ─────────────────────────────────────────────────────────
const useHub = (coachId) => {
  const [state, setState] = useState({
    loading: true, error: null,
    clients: [], recent: [],
    activeClients: 0, sessionsThisWeek: 0, checkInsThisWeek: 0, newThisMonth: 0,
  });

  const fetchAll = async () => {
    if (!coachId) return;
    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [clientsRes, sessionsRes, checkInsRes, paymentsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, name, email, plan, start_date, loop_stage, created_at, avatar_path, coach_notes')
          .eq('role', 'client')
          .order('name'),
        supabase
          .from('workout_sessions')
          .select('id, client_id, performed_at, duration_min, rpe_avg, notes')
          .gte('performed_at', weekAgo)
          .order('performed_at', { ascending: false }),
        supabase
          .from('check_ins')
          .select('id, client_id, date, weight, body_fat, notes, photo_path, created_at')
          .gte('date', weekAgo.split('T')[0])
          .order('date', { ascending: false }),
        supabase
          .from('payments')
          .select('client_id, status, plan, current_period_end'),
      ]);

      const err = clientsRes.error || sessionsRes.error || checkInsRes.error;
      if (err) { setState((s) => ({ ...s, loading: false, error: err.message })); return; }

      // Build a map of last activity per client (max of session + check-in)
      const lastByClient = {};
      for (const s of sessionsRes.data || []) {
        const t = new Date(s.performed_at).getTime();
        if (!lastByClient[s.client_id] || t > lastByClient[s.client_id]) lastByClient[s.client_id] = t;
      }
      for (const c of checkInsRes.data || []) {
        const t = new Date(c.created_at).getTime();
        if (!lastByClient[c.client_id] || t > lastByClient[c.client_id]) lastByClient[c.client_id] = t;
      }

      const paymentByClient = {};
      for (const p of paymentsRes.data || []) {
        if (!paymentByClient[p.client_id]) paymentByClient[p.client_id] = p;
      }

      const clients = (clientsRes.data || []).map((c) => {
        const lastAt = lastByClient[c.id] ? new Date(lastByClient[c.id]).toISOString() : null;
        const status = deriveStatus(lastAt, false);
        return {
          id: c.id, name: c.name || '—',
          email: c.email,
          plan: c.plan || paymentByClient[c.id]?.plan || '—',
          tag: c.loop_stage || c.plan || '',
          notes: c.coach_notes || '',
          last: formatRelative(lastAt),
          last_at: lastAt,
          status,
          paymentStatus: paymentByClient[c.id]?.status || null,
        };
      });

      // Build recent activity feed (last 8 events)
      const events = [
        ...(sessionsRes.data || []).map((s) => ({
          kind: 'session', id: `s-${s.id}`, client_id: s.client_id,
          at: s.performed_at, label: 'logged a session',
          detail: s.duration_min ? `${s.duration_min}m` : '',
        })),
        ...(checkInsRes.data || []).map((c) => ({
          kind: 'check_in', id: `c-${c.id}`, client_id: c.client_id,
          at: c.created_at, label: 'checked in',
          detail: c.weight ? `${c.weight}kg` : '',
        })),
      ]
        .sort((a, b) => new Date(b.at) - new Date(a.at))
        .slice(0, 8);

      const newThisMonth = (clientsRes.data || [])
        .filter((c) => new Date(c.created_at).getTime() > new Date(monthAgo).getTime()).length;

      setState({
        loading: false, error: null,
        clients,
        recent: events,
        activeClients: clients.length,
        sessionsThisWeek: (sessionsRes.data || []).length,
        checkInsThisWeek: (checkInsRes.data || []).length,
        newThisMonth,
      });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: String(e) }));
    }
  };

  useEffect(() => {
    fetchAll();
    if (!coachId) return;
    const channel = supabase
      .channel('pk-console-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workout_sessions' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'check_ins' }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [coachId]);

  return state;
};

const COMMANDS = [
  { id: 'invite-client', label: 'Invite a new client...',         icon: Plus,             hint: 'Action' },
  { id: 'request-checkin', label: 'Request a check-in...',        icon: ClipboardCheck,   hint: 'Action' },
  { id: 'gen-workout',  label: 'Ask AI to generate a workout',    icon: Sparkles,         hint: 'AI' },
];

// ─────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────
const Header = ({ onCmd, displayName }) => {
  const initials = (displayName || 'PK').split(/\s+/).map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'PK';
  const [menuOpen, setMenuOpen] = useState(false);
  return (
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
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
        <button
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'rgba(250,250,250,0.06)',
            border: `1px solid ${TK.hairline}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Geist Mono, monospace', fontSize: 11, fontWeight: 600,
            letterSpacing: '0.05em', color: TK.text, cursor: 'pointer',
          }}
        >
          {initials}
        </button>
        {menuOpen && (
          <>
            <div onClick={() => setMenuOpen(false)} style={{
              position: 'fixed', inset: 0, zIndex: 40,
            }} />
            <div className="pk-glass pk-glass-elev" style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              minWidth: 220, padding: 8, zIndex: 60,
              animation: 'pk-rise 180ms ease both',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}>
              <div style={{
                padding: '10px 12px', borderBottom: `1px solid ${TK.hairline}`,
                marginBottom: 4,
              }}>
                <div style={{ fontSize: 13, color: TK.text, fontWeight: 600 }}>
                  {displayName || 'Coach'}
                </div>
                <div className="pk-mono" style={{
                  fontSize: 10, color: TK.textMute, marginTop: 2,
                  letterSpacing: '0.10em', textTransform: 'uppercase',
                }}>
                  SIGNED IN
                </div>
              </div>
              <button
                onClick={() => { setMenuOpen(false); signOut(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: TK.textDim, fontSize: 13, fontFamily: 'inherit',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(250,250,250,0.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <LogOut size={13} strokeWidth={2} />
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

// ─────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────
const Hero = ({ stats }) => {
  const NOW = useMemo(() => formatNow(), []);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    <section style={{ padding: '64px 28px 32px', maxWidth: 1320, margin: '0 auto', width: '100%' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        marginBottom: 28, flexWrap: 'wrap', gap: 12,
      }}>
        <div className="pk-label">TODAY · OPERATOR'S CONSOLE</div>
        <div className="pk-mono" style={{ fontSize: 12, color: TK.textDim, letterSpacing: '0.10em' }}>
          {NOW.weekday} · {NOW.date} · {NOW.time}
        </div>
      </div>

      <h1 className="pk-display" style={{
        fontSize: 'clamp(64px, 11vw, 168px)', margin: 0, color: TK.text,
      }}>
        what's<br />
        <span style={{ color: TK.gold }}>next?</span>
      </h1>

      <div style={{
        marginTop: 36, display: 'flex', gap: 36, flexWrap: 'wrap',
        borderTop: `1px solid ${TK.hairline}`, paddingTop: 24,
      }}>
        <Stat n={pad(stats.activeClients)} label="active clients" />
        <Stat n={pad(stats.sessionsThisWeek)} label="sessions this week" accent />
        <Stat n={pad(stats.checkInsThisWeek)} label="check-ins this week" />
        <Stat n={pad(stats.newThisMonth)} label="new this month" />
      </div>
    </section>
  );
};

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
// RECENT ACTIVITY (replaces "Due today")
// ─────────────────────────────────────────────────────────
const RecentActivity = ({ events, clients, onOpenClient }) => {
  const clientName = (id) => clients.find((c) => c.id === id)?.name || 'Client';
  return (
    <section style={{ padding: '24px 28px', maxWidth: 1320, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div className="pk-label">RECENT ACTIVITY</div>
        <span className="pk-mono" style={{ fontSize: 10, color: TK.textGhost, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          LAST 7 DAYS
        </span>
      </div>

      {events.length === 0 ? (
        <div className="pk-glass" style={{
          padding: '40px 24px', textAlign: 'center',
          color: TK.textDim, fontSize: 14,
        }}>
          <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.6 }}>—</div>
          Quiet week. Nothing logged yet.
        </div>
      ) : (
        <div className="pk-glass" style={{ overflow: 'hidden' }}>
          {events.map((e, i) => (
            <ActivityRow
              key={e.id}
              event={e}
              clientName={clientName(e.client_id)}
              last={i === events.length - 1}
              onClick={() => onOpenClient(e.client_id)}
            />
          ))}
        </div>
      )}
    </section>
  );
};

const ActivityRow = ({ event, clientName, last, onClick }) => {
  const [hover, setHover] = useState(false);
  const Icon = event.kind === 'check_in' ? ClipboardCheck : Activity;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'grid', gridTemplateColumns: '32px 1fr auto auto', gap: 14,
        padding: '14px 20px', alignItems: 'center', cursor: 'pointer',
        borderBottom: last ? 'none' : `1px solid ${TK.hairline}`,
        background: hover ? 'rgba(250,250,250,0.04)' : 'transparent',
        transition: 'background 180ms ease',
      }}
    >
      <Icon size={14} color={hover ? TK.gold : TK.textMute} strokeWidth={2} />
      <div>
        <div style={{ fontSize: 14, color: TK.text, letterSpacing: '-0.005em' }}>
          <span style={{ fontWeight: 600 }}>{clientName}</span>
          <span style={{ color: TK.textMute }}> {event.label}</span>
        </div>
        {event.detail && (
          <div className="pk-mono" style={{ fontSize: 11, color: TK.textMute, marginTop: 2, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {event.detail}
          </div>
        )}
      </div>
      <span className="pk-mono" style={{ fontSize: 11, color: TK.textMute, letterSpacing: '0.06em' }}>
        {formatRelative(event.at)}
      </span>
      <ChevronRight size={14} color={hover ? TK.gold : TK.textGhost} strokeWidth={2} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// CLIENTS TABLE
// ─────────────────────────────────────────────────────────
const ClientsPanel = ({ q, setQ, clients, onOpenClient, onInvite }) => {
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return clients;
    return clients.filter(c =>
      c.name.toLowerCase().includes(needle) ||
      (c.tag || '').toLowerCase().includes(needle) ||
      (c.email || '').toLowerCase().includes(needle)
    );
  }, [q, clients]);

  return (
    <section style={{ padding: '24px 28px', maxWidth: 1320, margin: '0 auto', width: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16, flexWrap: 'wrap', gap: 12,
      }}>
        <div className="pk-label">CLIENTS · {clients.length}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="pk-glass" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 12px', minWidth: 240,
          }}>
            <Search size={13} color={TK.textMute} strokeWidth={2} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search clients, plans, emails…"
              style={{
                background: 'transparent', border: 'none', outline: 'none',
                color: TK.text, fontSize: 13, fontFamily: 'inherit', width: '100%',
              }}
            />
          </div>
          <button onClick={onInvite} className="pk-cta pk-cta-gold" style={{ padding: '7px 14px' }}>
            <Plus size={13} strokeWidth={2.4} /> INVITE CLIENT
            <ExternalLink size={11} strokeWidth={2.4} style={{ opacity: 0.7 }} />
          </button>
        </div>
      </div>

      <div className="pk-glass" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '24px 1.6fr 1fr 1fr 1fr 24px',
          gap: 16, padding: '14px 20px',
          borderBottom: `1px solid ${TK.hairline}`,
          fontFamily: 'Geist Mono, monospace',
          fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase',
          color: TK.textMute, fontWeight: 500,
        }}>
          <span></span>
          <span>Client</span>
          <span>Plan</span>
          <span>Status</span>
          <span>Last seen</span>
          <span></span>
        </div>
        {filtered.length === 0 && clients.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div className="pk-mono" style={{
              fontSize: 11, letterSpacing: '0.20em', textTransform: 'uppercase',
              color: TK.textMute, marginBottom: 12,
            }}>
              NO CLIENTS YET
            </div>
            <div style={{ fontSize: 13, color: TK.textDim, marginBottom: 18, maxWidth: 360, margin: '0 auto 18px' }}>
              Send a client through the intake flow to get started.
            </div>
            <button onClick={onInvite} className="pk-cta pk-cta-gold" style={{ padding: '10px 18px' }}>
              <Plus size={13} strokeWidth={2.4} /> INVITE FIRST CLIENT
              <ExternalLink size={11} strokeWidth={2.4} style={{ opacity: 0.7 }} />
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: TK.textMute, fontSize: 13 }}>
            No matches.
          </div>
        ) : filtered.map((c, i) => (
          <ClientRow key={c.id} c={c} last={i === filtered.length - 1} onOpen={onOpenClient} />
        ))}
      </div>
    </section>
  );
};

const ClientRow = ({ c, last, onOpen }) => {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onOpen?.(c.id)}
      className="pk-row-hover"
      style={{
        display: 'grid',
        gridTemplateColumns: '24px 1.6fr 1fr 1fr 1fr 24px',
        gap: 16, padding: '16px 20px',
        borderBottom: last ? 'none' : `1px solid ${TK.hairline}`,
        alignItems: 'center', cursor: 'pointer',
        background: hover ? 'rgba(250,250,250,0.04)' : 'transparent',
      }}
    >
      <span className={`pk-dot pk-dot-${c.status}`} />
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: TK.text, letterSpacing: '-0.01em' }}>{c.name}</div>
        {c.email && (
          <div style={{ fontSize: 12, color: TK.textMute, marginTop: 2 }}>{c.email}</div>
        )}
      </div>
      <span className="pk-mono" style={{ fontSize: 11, color: TK.textDim, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {c.plan || '—'}
      </span>
      <span className="pk-mono" style={{ fontSize: 11, color: TK.textDim, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {c.paymentStatus || c.status}
      </span>
      <span className="pk-mono" style={{ fontSize: 12, color: TK.textMute }}>
        {c.last}
      </span>
      <ChevronRight size={14} color={hover ? TK.gold : TK.textGhost} strokeWidth={2} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// AI PANEL — demo mode
// ─────────────────────────────────────────────────────────
const aiDemoResponse = async (prompt) => {
  await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));
  const p = prompt.toLowerCase();
  if (p.includes('pull') && p.includes('block')) {
    return [
      'PULL · 4-WEEK PROGRESSION',
      '',
      'Wk 1 · Volume   — 5×8 @ RPE 7   · accessory super-sets',
      'Wk 2 · Volume   — 5×8 @ RPE 8   · add 1 set of rows',
      'Wk 3 · Intensity— 5×5 @ RPE 8.5 · drop accessories 20%',
      'Wk 4 · Test     — 3×3 @ RPE 9.5 · then deload Sat',
      '',
      'Anchor lifts: weighted pull-up, pendlay row, RDL.',
    ].join('\n');
  }
  if (p.includes('plateau') || p.includes('bench')) {
    return [
      'BENCH PLATEAU · 3 LIKELY CAUSES',
      '',
      '1. Top-end weakness — last 3" lockout failing.',
      '2. Tricep underload — bench drives shoulder-heavy.',
      '3. Recovery debt — sleep <7h, training 5×.',
    ].join('\n');
  }
  if (p.includes('deload')) {
    return [
      'DELOAD WEEK · MAINTENANCE',
      '',
      'Mon · Push  — 50% top set, 3× across',
      'Tue · OFF',
      'Wed · Pull  — 50% top set, 3× across',
      'Thu · Mobility 24m',
      'Fri · Legs  — 50% top set, 3× across',
    ].join('\n');
  }
  return [
    'I read the brief. Live LLM wiring is one Edge Function away.',
    'Drop your Anthropic or Gemini key into Settings → AI to switch on.',
  ].join('\n');
};

const AIPanel = ({ initialPrompt }) => {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState('');
  const prompts = [
    'Generate a 4-week pull block',
    'Why might a client plateau on bench?',
    'Build a deload week template',
    'Suggest a meal plan for 180g protein, dairy-free',
  ];

  useEffect(() => { if (initialPrompt) setQ(initialPrompt); }, [initialPrompt]);

  const submit = async () => {
    if (!q.trim() || busy) return;
    setBusy(true); setOut('');
    const result = await aiDemoResponse(q);
    setOut(result); setBusy(false);
  };

  return (
    <section id="ai-panel" style={{ padding: '24px 28px 56px', maxWidth: 1320, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <Sparkles size={13} color={TK.gold} strokeWidth={2.4} />
        <div className="pk-label" style={{ color: TK.gold }}>AI · COACH SYSTEM</div>
        <span className="pk-mono" style={{
          fontSize: 9, color: TK.textGhost, marginLeft: 4,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          padding: '2px 6px', borderRadius: 4,
          border: `1px solid ${TK.hairline}`,
        }}>
          DEMO MODE
        </span>
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
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder="Ask the system. Generate. Decide."
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: TK.text, fontSize: 14, fontFamily: 'inherit', flex: 1,
            }}
          />
          <button
            onClick={submit}
            disabled={!q.trim() || busy}
            className="pk-mono"
            style={{
              padding: '6px 12px', borderRadius: 8,
              background: q.trim() ? TK.gold : 'transparent',
              color: q.trim() ? '#000' : TK.textMute,
              border: `1px solid ${q.trim() ? TK.gold : TK.hairline}`,
              cursor: q.trim() ? 'pointer' : 'default',
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              transition: 'all 200ms ease',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {busy ? <Loader2 size={11} style={{ animation: 'pk-spin 1s linear infinite' }} /> : <CornerDownLeft size={11} />}
            RUN
          </button>
        </div>

        {out && (
          <pre style={{
            margin: 0, padding: '16px 18px', borderRadius: 12,
            background: 'rgba(0,0,0,0.5)', border: `1px solid ${TK.hairline}`,
            fontFamily: 'Geist Mono, monospace', fontSize: 12, lineHeight: 1.65,
            color: TK.textDim, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            marginBottom: 16,
            animation: 'pk-rise 320ms cubic-bezier(0.2,0.7,0.2,1) both',
          }}>
            {out}
          </pre>
        )}

        <div className="pk-label" style={{ marginBottom: 10 }}>SUGGESTED</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {prompts.map((p) => (
            <button
              key={p}
              onClick={() => { setQ(p); }}
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
const Palette = ({ open, onClose, clients, onAction }) => {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) { setQ(''); setActive(0); setTimeout(() => inputRef.current?.focus(), 30); }
  }, [open]);

  const items = useMemo(() => {
    const cmds = COMMANDS.map(c => ({ kind: 'cmd', ...c }));
    const cls = clients.slice(0, 8).map(c => ({ kind: 'client', id: c.id, label: c.name, sub: c.email || c.tag, icon: Users }));
    const all = [...cmds, ...cls];
    if (!q.trim()) return all;
    const n = q.trim().toLowerCase();
    return all.filter(i => i.label.toLowerCase().includes(n) || (i.sub || '').toLowerCase().includes(n));
  }, [q, clients]);

  const choose = (item) => { onAction?.(item); onClose(); };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
      else if (e.key === 'Enter') { e.preventDefault(); if (items[active]) choose(items[active]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, items, active, onClose]);

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
            const Icon = it.icon || Users;
            const isActive = i === active;
            return (
              <div
                key={`${it.kind}-${it.id}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(it)}
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
                      letterSpacing: '0.06em',
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
const LoadingState = () => (
  <div style={{
    minHeight: '60vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 18,
    color: 'rgba(250,250,250,0.40)',
  }}>
    <Loader2 size={20} style={{ animation: 'pk-spin 1s linear infinite' }} strokeWidth={2} />
    <div className="pk-mono" style={{
      fontSize: 11, letterSpacing: '0.20em', textTransform: 'uppercase',
    }}>
      LOADING · OPERATOR'S CONSOLE
    </div>
  </div>
);

const ErrorState = ({ message }) => (
  <div style={{
    minHeight: '60vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 14,
    padding: 28, textAlign: 'center',
  }}>
    <div className="pk-mono" style={{
      fontSize: 11, letterSpacing: '0.20em', textTransform: 'uppercase',
      color: 'rgba(224,122,108,0.85)',
    }}>
      CONNECTION ERROR
    </div>
    <div style={{ fontSize: 13, color: 'rgba(250,250,250,0.62)', maxWidth: 480 }}>
      {message}
    </div>
  </div>
);

export default function Hub() {
  const [palette, setPalette] = useState(false);
  const [q, setQ] = useState('');
  const [aiSeed, setAiSeed] = useState('');
  const auth = useAuth();
  const navigate = useNavigate();
  const data = useHub(auth.session?.uid);

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

  // Auth gate
  if (auth.loading) {
    return (
      <div style={{
        background: '#000', color: TK.textMute, minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Geist Mono, monospace', fontSize: 11,
        letterSpacing: '0.20em', textTransform: 'uppercase',
      }}>
        <Loader2 size={16} style={{ animation: 'pk-spin 1s linear infinite', marginRight: 12 }} />
        LOADING SESSION
      </div>
    );
  }
  if (!auth.session) return <SignIn />;

  const openClient = (id) => navigate(`/c/${id}`);
  const openIntake = () => window.open(INTAKE_URL, '_blank');

  const handleCommand = (item) => {
    if (item.kind === 'cmd') {
      if (item.id === 'invite-client') openIntake();
      else if (item.id === 'request-checkin') window.open(CHECKIN_URL, '_blank');
      else if (item.id === 'gen-workout') {
        setAiSeed('Generate a 4-week pull block');
        setTimeout(() => document.getElementById('ai-panel')?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } else if (item.kind === 'client') {
      navigate(`/c/${item.id}`);
    }
  };

  const stats = {
    activeClients: data.activeClients,
    sessionsThisWeek: data.sessionsThisWeek,
    checkInsThisWeek: data.checkInsThisWeek,
    newThisMonth: data.newThisMonth,
  };

  return (
    <div className="pk-hub pk-grain">
      <style>{STYLES}</style>
      <div className="pk-spot" />
      <Header onCmd={() => setPalette(true)} displayName={auth.session.displayName} />

      {data.loading && <LoadingState />}
      {data.error && <ErrorState message={data.error} />}

      {!data.loading && !data.error && (
        <>
          <Hero stats={stats} />
          <RecentActivity events={data.recent} clients={data.clients} onOpenClient={openClient} />
          <ClientsPanel
            q={q} setQ={setQ}
            clients={data.clients}
            onOpenClient={openClient}
            onInvite={openIntake}
          />
          <AIPanel initialPrompt={aiSeed} />
        </>
      )}

      <Footer />

      <Palette
        open={palette}
        onClose={() => setPalette(false)}
        clients={data.clients}
        onAction={handleCommand}
      />
    </div>
  );
}
