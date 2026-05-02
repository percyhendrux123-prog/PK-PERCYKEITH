import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Command, ArrowUpRight, ArrowRight, Plus, Sparkles,
  Users, Library, Settings, Activity, ChevronRight, Filter,
  MoreHorizontal, Clock, Send, X, CornerDownLeft, Zap, Loader2,
  Check, Trophy, Calendar, LogOut,
} from 'lucide-react';
import { supabase } from './lib/supabase.js';
import { useAuth, signOut, SignIn } from './lib/auth.jsx';

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
const COACH = { initials: 'PK', name: 'Percy Keith' };

// ─────────────────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────────────────
const formatTime = (date) => {
  const d = new Date(date);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = ((h + 11) % 12) + 1;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
};
const formatRelative = (date) => {
  if (!date) return '—';
  const ms = Date.now() - new Date(date).getTime();
  const h = Math.floor(ms / (1000 * 60 * 60));
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
};
const formatNextDue = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return formatTime(d);
  const day = d.toLocaleDateString('en-US', { weekday: 'short' });
  return `${day} ${formatTime(d)}`;
};
const formatNow = () => {
  const d = new Date();
  return {
    weekday: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    date: d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }).toUpperCase(),
    time: d.toTimeString().slice(0, 5),
  };
};

// ─────────────────────────────────────────────────────────
// DATA HOOK — live Supabase + mutations + realtime
// ─────────────────────────────────────────────────────────
const useHub = () => {
  const [state, setState] = useState({
    loading: true, error: null,
    clients: [], templates: [], sessions: [],
    prCount: 0, weekDue: 0,
  });

  const fetchAll = async () => {
    try {
      const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();   endOfDay.setHours(23, 59, 59, 999);
      const endOfWeek = new Date();  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay())); endOfWeek.setHours(23, 59, 59, 999);

      const [clientsRes, templatesRes, sessionsRes, prsRes, weekRes, futureRes] = await Promise.all([
        supabase.from('pk_hub_clients').select('*').order('name'),
        supabase.from('pk_hub_templates').select('*').order('uses', { ascending: false }),
        supabase.from('pk_hub_sessions')
          .select('id, due_at, status, tag, delta_note, client:pk_hub_clients(id, name, status), template:pk_hub_templates(id, name)')
          .eq('status', 'due')
          .gte('due_at', startOfDay.toISOString())
          .lte('due_at', endOfDay.toISOString())
          .order('due_at'),
        supabase.from('pk_hub_prs').select('id', { count: 'exact', head: true })
          .gte('logged_at', startOfDay.toISOString()),
        supabase.from('pk_hub_sessions').select('id', { count: 'exact', head: true })
          .eq('status', 'due')
          .gte('due_at', startOfDay.toISOString())
          .lte('due_at', endOfWeek.toISOString()),
        supabase.from('pk_hub_sessions')
          .select('client_id, due_at, status')
          .eq('status', 'due')
          .gte('due_at', new Date().toISOString())
          .order('due_at'),
      ]);

      const err = clientsRes.error || templatesRes.error || sessionsRes.error || prsRes.error;
      if (err) { setState((s) => ({ ...s, loading: false, error: err.message })); return; }

      const nextDueByClient = {};
      for (const r of (futureRes.data || [])) {
        if (!nextDueByClient[r.client_id]) nextDueByClient[r.client_id] = r.due_at;
      }

      const clients = (clientsRes.data || []).map((c) => ({
        id: c.id, name: c.name, status: c.status,
        tag: c.tag, notes: c.notes,
        last: formatRelative(c.last_seen),
        next: formatNextDue(nextDueByClient[c.id]),
      }));

      const templates = (templatesRes.data || []).map((t) => ({
        id: t.id, name: t.name, sets: t.sets,
        time: `${t.duration_min}m`, uses: t.uses,
      }));

      const sessions = (sessionsRes.data || []).map((s) => ({
        id: s.id,
        client: s.client?.name?.replace(/^(\w)\w+\s/, '$1. ') || 'Client',
        client_id: s.client?.id,
        template_id: s.template?.id,
        tag: s.tag || s.template?.name || '',
        due: formatTime(s.due_at),
        status: s.client?.status || 'mute',
        delta: s.delta_note || '',
      }));

      setState({
        loading: false, error: null,
        clients, templates, sessions,
        prCount: prsRes.count || 0,
        weekDue: weekRes.count || 0,
      });
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: String(e) }));
    }
  };

  // Initial fetch + realtime subscription
  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel('pk-hub-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pk_hub_clients' },  fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pk_hub_sessions' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pk_hub_prs' },      fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pk_hub_templates' },fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // ── Mutations ────────────────────────────────────────────
  const markSessionComplete = async (id) => {
    // Optimistic
    setState((s) => ({ ...s, sessions: s.sessions.filter((x) => x.id !== id) }));
    const { error } = await supabase.from('pk_hub_sessions').update({ status: 'complete' }).eq('id', id);
    if (error) await fetchAll();
  };

  const addClient = async ({ name, tag, status, notes }) => {
    const { error } = await supabase.from('pk_hub_clients').insert({
      name, tag, status: status || 'mute', notes,
      last_seen: new Date().toISOString(),
    });
    if (error) throw error;
    await fetchAll();
  };

  const logPR = async ({ client_id, lift, prev_lb, current_lb }) => {
    const delta = Number(current_lb) - Number(prev_lb);
    const { error } = await supabase.from('pk_hub_prs').insert({
      client_id, lift, prev_lb: Number(prev_lb), current_lb: Number(current_lb), delta_lb: delta,
    });
    if (error) throw error;
    await fetchAll();
  };

  const assignTemplate = async ({ client_id, template_id, due_at }) => {
    const tpl = state.templates.find((t) => t.id === template_id);
    const tag = (tpl?.name || '').split(' · ').slice(0, 2).join(' · ');
    const { error } = await supabase.from('pk_hub_sessions').insert({
      client_id, template_id,
      due_at: new Date(due_at).toISOString(),
      tag, status: 'due',
    });
    if (error) throw error;
    await fetchAll();
  };

  return { ...state, mutations: { markSessionComplete, addClient, logPR, assignTemplate }, refetch: fetchAll };
};

const COMMANDS = [
  { id: 'add-client',   label: 'Add new client...',              icon: Plus,     hint: 'Action' },
  { id: 'log-pr',       label: 'Log a PR...',                    icon: Activity, hint: 'Action' },
  { id: 'assign-tmpl',  label: 'Assign template...',             icon: Library,  hint: 'Action' },
  { id: 'gen-workout',  label: 'Ask AI to generate a workout',   icon: Sparkles, hint: 'AI' },
  { id: 'settings',     label: 'Open settings',                  icon: Settings, hint: 'Nav' },
];

// ─────────────────────────────────────────────────────────
// MODAL — Liquid Glass overlay primitive
// ─────────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, children, width = 520 }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="pk-pal-overlay" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="pk-glass pk-glass-elev"
        style={{
          width: `min(${width}px, 92vw)`, padding: 0,
          animation: 'pk-rise 220ms cubic-bezier(0.2,0.7,0.2,1) both',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px', borderBottom: `1px solid ${TK.hairline}`,
        }}>
          <div className="pk-mono" style={{
            fontSize: 11, letterSpacing: '0.20em', textTransform: 'uppercase',
            color: TK.gold, fontWeight: 600,
          }}>
            {title}
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', color: TK.textMute,
            cursor: 'pointer', padding: 4, borderRadius: 6,
            display: 'flex', alignItems: 'center',
          }}>
            <X size={14} strokeWidth={2} />
          </button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// FORM PRIMITIVES
// ─────────────────────────────────────────────────────────
const Field = ({ label, children }) => (
  <label style={{ display: 'block', marginBottom: 14 }}>
    <div className="pk-label" style={{ marginBottom: 6 }}>{label}</div>
    {children}
  </label>
);
const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 10,
  background: 'rgba(0,0,0,0.4)', color: TK.text,
  border: `1px solid ${TK.hairline}`, outline: 'none',
  fontSize: 14, fontFamily: 'inherit',
};
const Input = (props) => <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
const Select = ({ children, ...props }) => (
  <select {...props} style={{ ...inputStyle, ...(props.style || {}) }}>{children}</select>
);
const TextArea = (props) => (
  <textarea {...props} rows={props.rows || 2} style={{ ...inputStyle, resize: 'vertical', ...(props.style || {}) }} />
);

// ─────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────
const Header = ({ onCmd, displayName }) => {
  const initials = (displayName || 'PK').split(' ').map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'PK';
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
              minWidth: 200, padding: 8, zIndex: 60,
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
// HERO — "WHAT'S NEXT?"
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
        <Stat n={pad(stats.sessions)} label="due today" />
        <Stat n={pad(stats.weekDue)} label="this week" accent />
        <Stat n={pad(stats.prCount)} label="PR today" />
        <Stat n={pad(stats.clients)} label="active clients" />
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
// TODAY GRID — sessions due
// ─────────────────────────────────────────────────────────
const TodayGrid = ({ sessions, onComplete }) => (
  <section style={{ padding: '24px 28px', maxWidth: 1320, margin: '0 auto', width: '100%' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <div className="pk-label">DUE TODAY · {sessions.length}</div>
      <a href="#" className="pk-link pk-mono" style={{
        fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        ALL SESSIONS <ArrowUpRight size={12} strokeWidth={2} />
      </a>
    </div>

    {sessions.length === 0 ? (
      <div className="pk-glass" style={{
        padding: '40px 24px', textAlign: 'center',
        color: TK.textDim, fontSize: 14,
      }}>
        <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.6 }}>—</div>
        Day's clear. Good work.
      </div>
    ) : (
      <div style={{
        display: 'grid', gap: 14,
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      }}>
        {sessions.map((s) => <SessionCard key={s.id} s={s} onComplete={onComplete} />)}
      </div>
    )}
  </section>
);

const SessionCard = ({ s, onComplete }) => {
  const [hover, setHover] = useState(false);
  const [completing, setCompleting] = useState(false);
  const handleComplete = async (e) => {
    e.stopPropagation();
    setCompleting(true);
    setTimeout(() => onComplete?.(s.id), 380);
  };
  return (
    <div
      className="pk-glass"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: 20, cursor: 'pointer',
        borderColor: hover ? 'rgba(201,169,97,0.30)' : TK.hairline,
        transform: completing ? 'scale(0.96)' : (hover ? 'translateY(-2px)' : 'translateY(0)'),
        opacity: completing ? 0 : 1,
        transition: 'all 380ms cubic-bezier(0.2,0.7,0.2,1)',
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
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 12, color: TK.textMute, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {s.delta}
        </span>
        <button
          onClick={handleComplete}
          className="pk-mono"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 10px', borderRadius: 8,
            background: hover ? TK.gold : 'rgba(201,169,97,0.10)',
            color: hover ? '#000' : TK.gold,
            border: `1px solid ${hover ? TK.gold : 'rgba(201,169,97,0.25)'}`,
            cursor: 'pointer',
            fontSize: 10, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            fontFamily: 'Geist Mono, monospace',
            transition: 'all 200ms ease',
          }}
        >
          <Check size={11} strokeWidth={3} /> COMPLETE
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// CLIENTS TABLE
// ─────────────────────────────────────────────────────────
const ClientsPanel = ({ q, setQ, clients, onAddClient, onOpenClient }) => {
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return clients;
    return clients.filter(c => c.name.toLowerCase().includes(needle) || (c.tag || '').toLowerCase().includes(needle));
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
          <button onClick={onAddClient} className="pk-cta" style={{ padding: '7px 14px' }}>
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
          <ClientRow key={c.id} c={c} last={i === filtered.length - 1} onOpen={onOpenClient} />
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
const LibraryPanel = ({ templates, onAssign }) => (
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
      {templates.map((t) => <TemplateCard key={t.id} t={t} onAssign={onAssign} />)}
    </div>
  </section>
);

const TemplateCard = ({ t, onAssign }) => {
  const [hover, setHover] = useState(false);
  return (
    <div
      className="pk-glass"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: 18, position: 'relative',
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
      <button
        onClick={() => onAssign?.(t.id)}
        className="pk-mono"
        style={{
          position: 'absolute', top: 12, right: 12,
          padding: '5px 9px', borderRadius: 7,
          background: hover ? TK.gold : 'transparent',
          color: hover ? '#000' : TK.textMute,
          border: `1px solid ${hover ? TK.gold : 'transparent'}`,
          cursor: 'pointer',
          fontSize: 9, fontWeight: 700,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          fontFamily: 'Geist Mono, monospace',
          transition: 'all 200ms ease',
          opacity: hover ? 1 : 0,
        }}
      >
        ASSIGN
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// AI PANEL
// ─────────────────────────────────────────────────────────
// Demo-mode AI: returns a structured response without an API key.
// Replace with a real LLM call (Edge Function → Anthropic/Gemini) when ready.
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
      'Accessory rotation: face pull, hammer curl, rear-delt fly.',
    ].join('\n');
  }
  if (p.includes('plateau') || p.includes('bench')) {
    return [
      'BENCH PLATEAU · 3 LIKELY CAUSES',
      '',
      '1. Top-end weakness — last 3" lockout failing.',
      '   → 2× weekly close-grip + board press 1-board.',
      '',
      '2. Tricep underload — bench drives shoulder-heavy.',
      '   → Add JM press OR overhead tri ext, 4×10 RPE 7.',
      '',
      '3. Recovery debt — sleep <7h, training 5×.',
      '   → Drop 1 day, retest in 14 days.',
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
      'Sat · Walk + sauna',
      '',
      'Goal: 60% volume, full ROM, fresh CNS by Monday.',
    ].join('\n');
  }
  if (p.includes('meal') || p.includes('protein')) {
    return [
      'MEAL PLAN · 180G PROTEIN · DAIRY-FREE',
      '',
      '07:00 · 4 eggs + oats + berries        ─ 38g',
      '11:00 · Chicken thigh + jasmine rice   ─ 42g',
      '14:00 · Beef jerky + apple             ─ 22g',
      '18:00 · Salmon + sweet potato + greens ─ 40g',
      '21:00 · Whey isolate + almond butter   ─ 38g',
      '',
      'Total: 180g. No dairy. ~2,400 kcal.',
    ].join('\n');
  }
  return [
    'I read the brief. To deliver real output I need an LLM key.',
    '',
    'Drop your Anthropic or Gemini key into Settings → AI to',
    'switch from demo mode to live coach generation.',
  ].join('\n');
};

const AIPanel = ({ initialPrompt }) => {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState('');
  const prompts = [
    'Generate a 4-week pull block for J. Kim',
    'Why did M. Rivera plateau on bench?',
    'Build a deload week for D. Santos',
    'Suggest a meal plan for 180g protein, dairy-free',
  ];

  useEffect(() => {
    if (initialPrompt) setQ(initialPrompt);
  }, [initialPrompt]);

  const submit = async () => {
    if (!q.trim() || busy) return;
    setBusy(true); setOut('');
    const result = await aiDemoResponse(q);
    setOut(result);
    setBusy(false);
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
// MUTATION MODALS
// ─────────────────────────────────────────────────────────
const AddClientModal = ({ open, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [status, setStatus] = useState('mute');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open) { setName(''); setTag(''); setStatus('mute'); setNotes(''); setErr(''); }
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setErr('Name is required.'); return; }
    setBusy(true); setErr('');
    try { await onSubmit({ name: name.trim(), tag: tag.trim(), status, notes: notes.trim() }); onClose(); }
    catch (e) { setErr(e.message || String(e)); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="ADD CLIENT">
      <form onSubmit={submit}>
        <Field label="NAME"><Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Eli Schwartz" /></Field>
        <Field label="BLOCK / TAG"><Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Push · Hypertrophy" /></Field>
        <Field label="STATUS">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="mute">Mute · new / quiet</option>
            <option value="green">Green · on track</option>
            <option value="gold">Gold · momentum / PR</option>
            <option value="warn">Warn · needs attention</option>
          </Select>
        </Field>
        <Field label="NOTES"><TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Returning from knee tweak. Light start." /></Field>
        {err && <div style={{ color: TK.danger, fontSize: 12, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" onClick={onClose} className="pk-cta-ghost">CANCEL</button>
          <button type="submit" className="pk-cta" disabled={busy}>
            {busy ? <><Loader2 size={12} className="pk-spin" style={{ animation: 'pk-spin 1s linear infinite' }} /> SAVING</> : <>SAVE CLIENT</>}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const LogPRModal = ({ open, onClose, onSubmit, clients }) => {
  const [clientId, setClientId] = useState('');
  const [lift, setLift] = useState('');
  const [prev, setPrev] = useState('');
  const [curr, setCurr] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open) {
      setClientId(clients[0]?.id || '');
      setLift(''); setPrev(''); setCurr(''); setErr('');
    }
  }, [open, clients]);

  const submit = async (e) => {
    e.preventDefault();
    if (!clientId || !lift.trim() || !prev || !curr) { setErr('All fields are required.'); return; }
    setBusy(true); setErr('');
    try { await onSubmit({ client_id: clientId, lift: lift.trim(), prev_lb: prev, current_lb: curr }); onClose(); }
    catch (e) { setErr(e.message || String(e)); }
    finally { setBusy(false); }
  };

  const delta = (Number(curr) - Number(prev)) || 0;

  return (
    <Modal open={open} onClose={onClose} title="LOG A PR">
      <form onSubmit={submit}>
        <Field label="CLIENT">
          <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="LIFT"><Input autoFocus value={lift} onChange={(e) => setLift(e.target.value)} placeholder="Overhead Press" /></Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="PREVIOUS (LB)"><Input type="number" value={prev} onChange={(e) => setPrev(e.target.value)} placeholder="140" /></Field>
          <Field label="NEW (LB)"><Input type="number" value={curr} onChange={(e) => setCurr(e.target.value)} placeholder="145" /></Field>
        </div>
        {delta !== 0 && (
          <div className="pk-mono" style={{
            padding: '10px 14px', borderRadius: 10,
            background: delta > 0 ? 'rgba(201,169,97,0.10)' : 'rgba(224,122,108,0.10)',
            border: `1px solid ${delta > 0 ? 'rgba(201,169,97,0.25)' : 'rgba(224,122,108,0.25)'}`,
            color: delta > 0 ? TK.gold : TK.danger,
            fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase',
            marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <Trophy size={12} strokeWidth={2.4} />
            {delta > 0 ? '+' : ''}{delta} LB
          </div>
        )}
        {err && <div style={{ color: TK.danger, fontSize: 12, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" onClick={onClose} className="pk-cta-ghost">CANCEL</button>
          <button type="submit" className="pk-cta" disabled={busy}>{busy ? 'LOGGING…' : 'LOG PR'}</button>
        </div>
      </form>
    </Modal>
  );
};

const AssignTemplateModal = ({ open, onClose, onSubmit, clients, templates, prefilledTemplateId }) => {
  const [clientId, setClientId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open) {
      setClientId(clients[0]?.id || '');
      setTemplateId(prefilledTemplateId || templates[0]?.id || '');
      // default to today 6 PM in local-ISO format for datetime-local input
      const d = new Date(); d.setHours(18, 0, 0, 0);
      const pad = (n) => String(n).padStart(2, '0');
      setDueAt(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
      setErr('');
    }
  }, [open, clients, templates, prefilledTemplateId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!clientId || !templateId || !dueAt) { setErr('All fields are required.'); return; }
    setBusy(true); setErr('');
    try { await onSubmit({ client_id: clientId, template_id: templateId, due_at: dueAt }); onClose(); }
    catch (e) { setErr(e.message || String(e)); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="ASSIGN TEMPLATE">
      <form onSubmit={submit}>
        <Field label="CLIENT">
          <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="TEMPLATE">
          <Select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        </Field>
        <Field label="DUE"><Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} /></Field>
        {err && <div style={{ color: TK.danger, fontSize: 12, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
          <button type="button" onClick={onClose} className="pk-cta-ghost">CANCEL</button>
          <button type="submit" className="pk-cta" disabled={busy}>{busy ? 'ASSIGNING…' : 'ASSIGN'}</button>
        </div>
      </form>
    </Modal>
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
    const cls = clients.slice(0, 5).map(c => ({ kind: 'client', id: c.id, label: c.name, sub: c.tag, icon: Users }));
    const all = [...cmds, ...cls];
    if (!q.trim()) return all;
    const n = q.trim().toLowerCase();
    return all.filter(i => i.label.toLowerCase().includes(n) || (i.sub || '').toLowerCase().includes(n));
  }, [q, clients]);

  const choose = (item) => {
    onAction?.(item);
    onClose();
  };

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
            const Icon = it.icon || Command;
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
  const [modal, setModal] = useState(null); // 'add-client' | 'log-pr' | 'assign-tmpl' | { kind: 'assign-tmpl', templateId }
  const [aiSeed, setAiSeed] = useState('');
  const auth = useAuth();
  const navigate = useNavigate();
  const data = useHub();

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

  const handleCommand = (item) => {
    if (item.kind === 'cmd') {
      if (item.id === 'add-client') setModal('add-client');
      else if (item.id === 'log-pr') setModal('log-pr');
      else if (item.id === 'assign-tmpl') setModal({ kind: 'assign-tmpl' });
      else if (item.id === 'gen-workout') {
        setAiSeed('Generate a 4-week pull block for J. Kim');
        setTimeout(() => document.getElementById('ai-panel')?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } else if (item.kind === 'client') {
      navigate(`/c/${item.id}`);
    }
  };

  const openClient = (id) => navigate(`/c/${id}`);
  const displayName = auth.session?.displayName || 'Coach';

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

  const stats = {
    sessions: data.sessions.length,
    weekDue: data.weekDue,
    prCount: data.prCount,
    clients: data.clients.length,
  };

  return (
    <div className="pk-hub pk-grain">
      <style>{STYLES}</style>
      <div className="pk-spot" />
      <Header onCmd={() => setPalette(true)} displayName={displayName} />

      {data.loading && <LoadingState />}
      {data.error && <ErrorState message={data.error} />}

      {!data.loading && !data.error && (
        <>
          <Hero stats={stats} />
          <TodayGrid
            sessions={data.sessions}
            onComplete={data.mutations.markSessionComplete}
          />
          <ClientsPanel
            q={q} setQ={setQ}
            clients={data.clients}
            onAddClient={() => setModal('add-client')}
            onOpenClient={openClient}
          />
          <LibraryPanel
            templates={data.templates}
            onAssign={(templateId) => setModal({ kind: 'assign-tmpl', templateId })}
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
      <AddClientModal
        open={modal === 'add-client'}
        onClose={() => setModal(null)}
        onSubmit={data.mutations.addClient}
      />
      <LogPRModal
        open={modal === 'log-pr'}
        onClose={() => setModal(null)}
        onSubmit={data.mutations.logPR}
        clients={data.clients}
      />
      <AssignTemplateModal
        open={!!modal && typeof modal === 'object' && modal.kind === 'assign-tmpl'}
        onClose={() => setModal(null)}
        onSubmit={data.mutations.assignTemplate}
        clients={data.clients}
        templates={data.templates}
        prefilledTemplateId={typeof modal === 'object' ? modal?.templateId : ''}
      />
    </div>
  );
}

const LoadingState = () => (
  <div style={{
    minHeight: '60vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 18,
    color: 'rgba(250,250,250,0.40)',
  }}>
    <Loader2 size={20} className="pk-spin" style={{ animation: 'pk-spin 1s linear infinite' }} strokeWidth={2} />
    <div className="pk-mono" style={{
      fontSize: 11, letterSpacing: '0.20em', textTransform: 'uppercase',
    }}>
      LOADING · OPERATOR'S CONSOLE
    </div>
    <style>{`@keyframes pk-spin { to { transform: rotate(360deg); } }`}</style>
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
