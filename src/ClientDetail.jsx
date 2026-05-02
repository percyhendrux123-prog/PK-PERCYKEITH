import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Send, Loader2, Trophy, Activity, MessageSquare,
  Calendar, Edit3, Check, ClipboardCheck, ExternalLink,
} from 'lucide-react';
import { supabase } from './lib/supabase.js';
import { useAuth, signOut, SignIn } from './lib/auth.jsx';

const TK = {
  field: '#000000',
  text: '#FAFAFA',
  textDim: 'rgba(250,250,250,0.62)',
  textMute: 'rgba(250,250,250,0.40)',
  textGhost: 'rgba(250,250,250,0.22)',
  hairline: 'rgba(250,250,250,0.08)',
  gold: '#C9A961',
};

const CHECKIN_URL = 'https://pkfit-checkin.netlify.app/';

const STYLES = `
  .pk-cd { font-family: 'Geist', -apple-system, sans-serif; background: #000; color: #FAFAFA; min-height: 100vh; }
  .pk-cd-mono { font-family: 'Geist Mono', ui-monospace, monospace; font-feature-settings: "tnum"; }
  .pk-cd-glass {
    background: rgba(250,250,250,0.04);
    -webkit-backdrop-filter: blur(28px) saturate(180%);
    backdrop-filter: blur(28px) saturate(180%);
    border: 1px solid rgba(250,250,250,0.08);
    border-radius: 18px;
    position: relative;
  }
  .pk-cd-label {
    font-family: 'Geist Mono', monospace;
    letter-spacing: 0.20em; text-transform: uppercase;
    font-size: 10px; color: rgba(250,250,250,0.40); font-weight: 500;
  }
  .pk-cd-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
  .pk-cd-dot-gold { background: #C9A961; box-shadow: 0 0 10px rgba(201,169,97,0.6); }
  .pk-cd-dot-green { background: #6CC59A; }
  .pk-cd-dot-warn { background: #E0B97A; }
  .pk-cd-dot-mute { background: rgba(250,250,250,0.25); }
  @keyframes pk-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pk-spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
  }
`;

const formatTime = (date) => {
  const d = new Date(date);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = ((h + 11) % 12) + 1;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
};
const formatDate = (date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const formatRelativeShort = (date) => {
  const ms = Date.now() - new Date(date).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
};

// Derive PRs from workout_sessions.exercises jsonb (newest-first scan)
const extractPRs = (sessions) => {
  const seen = {};
  const prs = [];
  for (const s of [...sessions].reverse()) {
    const list = Array.isArray(s.exercises) ? s.exercises : (s.exercises?.items || []);
    for (const ex of list) {
      const name = ex.name || ex.exercise || ex.lift;
      if (!name) continue;
      const sets = Array.isArray(ex.sets) ? ex.sets : [];
      const max = sets.reduce((m, set) => Math.max(m, Number(set.weight || set.lb || set.kg) || 0), 0);
      if (max > 0 && (!seen[name] || max > seen[name])) {
        if (seen[name]) {
          prs.push({
            id: `${s.id}-${name}`, lift: name,
            prev_lb: seen[name], current_lb: max,
            delta_lb: max - seen[name],
            logged_at: s.performed_at,
          });
        }
        seen[name] = max;
      }
    }
  }
  return prs.sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));
};

// Derive a status dot from last activity
const deriveStatus = (lastActiveAt) => {
  if (!lastActiveAt) return 'mute';
  const days = (Date.now() - new Date(lastActiveAt).getTime()) / (1000 * 60 * 60 * 24);
  if (days < 7) return 'green';
  if (days < 14) return 'warn';
  return 'mute';
};

// ─────────────────────────────────────────────────────────
// Data hook
// ─────────────────────────────────────────────────────────
const useClient = (id) => {
  const [state, setState] = useState({
    loading: true, error: null,
    client: null, prs: [], sessions: [], messages: [], thread: null, checkIns: [],
  });

  const fetchAll = async () => {
    if (!id) return;
    const [clientRes, sessionsRes, threadRes, checkInsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).single(),
      supabase
        .from('workout_sessions')
        .select('*')
        .eq('client_id', id)
        .order('performed_at', { ascending: false }),
      supabase
        .from('dm_threads')
        .select('id, last_activity_at')
        .eq('client_id', id)
        .maybeSingle(),
      supabase
        .from('check_ins')
        .select('*')
        .eq('client_id', id)
        .order('date', { ascending: false }),
    ]);

    if (clientRes.error) {
      setState((s) => ({ ...s, loading: false, error: clientRes.error.message }));
      return;
    }

    let messages = [];
    if (threadRes.data?.id) {
      const msgRes = await supabase
        .from('dm_messages')
        .select('*')
        .eq('thread_id', threadRes.data.id)
        .order('created_at');
      messages = msgRes.data || [];
    }

    const sessions = sessionsRes.data || [];
    const prs = extractPRs(sessions);

    setState({
      loading: false, error: null,
      client: clientRes.data,
      prs, sessions,
      messages,
      thread: threadRes.data,
      checkIns: checkInsRes.data || [],
    });
  };

  useEffect(() => {
    fetchAll();
    if (!id) return;
    const channel = supabase
      .channel(`pk-client-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${id}` }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workout_sessions', filter: `client_id=eq.${id}` }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dm_threads', filter: `client_id=eq.${id}` }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dm_messages' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'check_ins', filter: `client_id=eq.${id}` }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  return { ...state, refetch: fetchAll };
};

// ─────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────
const Header = ({ name }) => (
  <header style={{
    position: 'sticky', top: 0, zIndex: 50,
    padding: '14px 28px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(20px) saturate(160%)',
    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
    borderBottom: `1px solid ${TK.hairline}`,
  }}>
    <Link to="/console" style={{
      display: 'flex', alignItems: 'center', gap: 10,
      color: TK.textDim, textDecoration: 'none',
      fontFamily: 'Geist Mono, monospace', fontSize: 11,
      letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600,
    }}>
      <ArrowLeft size={13} strokeWidth={2} /> BACK TO CONSOLE
    </Link>
    <div className="pk-cd-mono" style={{
      fontSize: 10, letterSpacing: '0.20em', textTransform: 'uppercase',
      color: TK.textMute, fontWeight: 500,
    }}>
      CLIENT · {name?.toUpperCase()}
    </div>
    <button
      onClick={() => signOut()}
      style={{
        background: 'transparent', border: `1px solid ${TK.hairline}`,
        padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
        color: TK.textMute, fontFamily: 'Geist Mono, monospace',
        fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
        fontWeight: 600,
      }}
    >
      SIGN OUT
    </button>
  </header>
);

// ─────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────
const Hero = ({ client, prs, sessions, checkIns }) => {
  const lastActivity = useMemo(() => {
    const all = [
      ...sessions.map((s) => s.performed_at),
      ...checkIns.map((c) => c.created_at),
    ].filter(Boolean).map((d) => new Date(d).getTime());
    return all.length ? new Date(Math.max(...all)).toISOString() : null;
  }, [sessions, checkIns]);
  const status = deriveStatus(lastActivity);

  return (
    <section style={{ padding: '64px 28px 32px', maxWidth: 1080, margin: '0 auto', width: '100%' }}>
      <div className="pk-cd-label" style={{ marginBottom: 18 }}>
        <span className={`pk-cd-dot pk-cd-dot-${status}`} style={{ marginRight: 10 }} />
        {client.plan || client.loop_stage || 'CLIENT'}
      </div>
      <h1 style={{
        fontSize: 'clamp(48px, 9vw, 120px)',
        fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.04em',
        margin: 0, color: TK.text,
      }}>
        {client.name || '—'}
      </h1>
      {client.email && (
        <div style={{ fontSize: 14, color: TK.textMute, marginTop: 14, fontFamily: 'Geist Mono, monospace', letterSpacing: '0.04em' }}>
          {client.email}
        </div>
      )}
      <div style={{
        marginTop: 36, display: 'flex', gap: 36, flexWrap: 'wrap',
        borderTop: `1px solid ${TK.hairline}`, paddingTop: 24,
      }}>
        <Stat n={String(prs.length).padStart(2, '0')} label="PRs logged" accent />
        <Stat n={String(sessions.length).padStart(2, '0')} label="sessions" />
        <Stat n={String(checkIns.length).padStart(2, '0')} label="check-ins" />
      </div>
    </section>
  );
};

const Stat = ({ n, label, accent }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
    <span className="pk-cd-mono" style={{
      fontSize: 38, fontWeight: 600, letterSpacing: '-0.04em',
      color: accent ? TK.gold : TK.text,
    }}>{n}</span>
    <span className="pk-cd-label">{label}</span>
  </div>
);

// ─────────────────────────────────────────────────────────
// TABS
// ─────────────────────────────────────────────────────────
const TABS = [
  { id: 'history',  label: 'HISTORY',   icon: Activity },
  { id: 'checkins', label: 'CHECK-INS', icon: ClipboardCheck },
  { id: 'messages', label: 'MESSAGES',  icon: MessageSquare },
  { id: 'notes',    label: 'NOTES',     icon: Edit3 },
];

const TabBar = ({ active, onChange, badges }) => (
  <div style={{
    padding: '0 28px', maxWidth: 1080, margin: '0 auto', width: '100%',
  }}>
    <div className="pk-cd-glass" style={{
      display: 'inline-flex', padding: 4, borderRadius: 12, gap: 4, flexWrap: 'wrap',
    }}>
      {TABS.map((t) => {
        const Icon = t.icon;
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className="pk-cd-mono"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 14px', borderRadius: 8,
              background: isActive ? 'rgba(201,169,97,0.18)' : 'transparent',
              border: `1px solid ${isActive ? 'rgba(201,169,97,0.30)' : 'transparent'}`,
              color: isActive ? TK.gold : TK.textDim,
              fontSize: 11, fontWeight: 600,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              cursor: 'pointer', transition: 'all 200ms ease',
            }}
          >
            <Icon size={11} strokeWidth={2.4} />
            {t.label}
            {badges?.[t.id] != null && (
              <span style={{
                fontSize: 9, padding: '1px 6px', borderRadius: 4,
                background: 'rgba(0,0,0,0.4)',
                color: isActive ? TK.gold : TK.textMute,
              }}>
                {badges[t.id]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────
// HISTORY tab
// ─────────────────────────────────────────────────────────
const History = ({ prs, sessions }) => {
  const items = useMemo(() => {
    const all = [
      ...prs.map((p) => ({ kind: 'pr', at: p.logged_at, data: p })),
      ...sessions.map((s) => ({ kind: 'session', at: s.performed_at, data: s })),
    ];
    return all.sort((a, b) => new Date(b.at) - new Date(a.at));
  }, [prs, sessions]);

  return (
    <section style={{ padding: '24px 28px', maxWidth: 1080, margin: '0 auto', width: '100%' }}>
      <div className="pk-cd-label" style={{ marginBottom: 16 }}>TIMELINE</div>
      <div className="pk-cd-glass" style={{ overflow: 'hidden' }}>
        {items.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: TK.textMute }}>
            Nothing here yet.
          </div>
        ) : items.map((it, i) => (
          <TimelineRow key={`${it.kind}-${it.data.id}`} item={it} last={i === items.length - 1} />
        ))}
      </div>
    </section>
  );
};

const TimelineRow = ({ item, last }) => {
  const isPR = item.kind === 'pr';
  const d = item.data;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '24px 90px 1fr auto',
      gap: 16, padding: '16px 20px',
      borderBottom: last ? 'none' : `1px solid ${TK.hairline}`,
      alignItems: 'center',
    }}>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isPR
          ? <Trophy size={13} color={TK.gold} strokeWidth={2.2} />
          : <Calendar size={13} color={TK.textMute} strokeWidth={2} />}
      </span>
      <span className="pk-cd-mono" style={{ fontSize: 11, color: TK.textMute, letterSpacing: '0.08em' }}>
        {formatDate(item.at)}
      </span>
      <div>
        {isPR ? (
          <>
            <div style={{ fontSize: 14, fontWeight: 600, color: TK.text, letterSpacing: '-0.01em' }}>
              {d.lift} <span style={{ color: TK.gold, marginLeft: 6 }}>+{d.delta_lb} lb</span>
            </div>
            <div className="pk-cd-mono" style={{ fontSize: 11, color: TK.textMute, marginTop: 2, letterSpacing: '0.06em' }}>
              {d.prev_lb} → {d.current_lb} LB
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 14, fontWeight: 600, color: TK.text, letterSpacing: '-0.01em' }}>
              Workout · {d.duration_min ? `${d.duration_min} min` : 'logged'}
              {d.rpe_avg ? <span style={{ color: TK.textMute, fontWeight: 400 }}> · RPE {d.rpe_avg}</span> : null}
            </div>
            {d.notes && (
              <div style={{ fontSize: 12, color: TK.textMute, marginTop: 2 }}>
                {d.notes}
              </div>
            )}
          </>
        )}
      </div>
      <span className="pk-cd-mono" style={{
        fontSize: 10, color: TK.textGhost,
        letterSpacing: '0.16em', textTransform: 'uppercase',
      }}>
        {isPR ? 'PR' : 'SESSION'}
      </span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// CHECK-INS tab
// ─────────────────────────────────────────────────────────
const CheckIns = ({ checkIns }) => (
  <section style={{ padding: '24px 28px', maxWidth: 1080, margin: '0 auto', width: '100%' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <div className="pk-cd-label">CHECK-IN HISTORY</div>
      <button
        onClick={() => window.open(CHECKIN_URL, '_blank')}
        className="pk-cd-mono"
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 12px', borderRadius: 8,
          background: 'rgba(250,250,250,0.04)', color: TK.textDim,
          border: `1px solid ${TK.hairline}`, cursor: 'pointer',
          fontSize: 10, fontWeight: 700,
          letterSpacing: '0.16em', textTransform: 'uppercase',
        }}
      >
        REQUEST CHECK-IN
        <ExternalLink size={11} strokeWidth={2.4} style={{ opacity: 0.7 }} />
      </button>
    </div>
    {checkIns.length === 0 ? (
      <div className="pk-cd-glass" style={{
        padding: '48px 24px', textAlign: 'center', color: TK.textMute,
      }}>
        No check-ins logged yet.
      </div>
    ) : (
      <div style={{
        display: 'grid', gap: 12,
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      }}>
        {checkIns.map((c) => <CheckInCard key={c.id} c={c} />)}
      </div>
    )}
  </section>
);

const CheckInCard = ({ c }) => (
  <div className="pk-cd-glass" style={{ padding: 18 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
      <div className="pk-cd-mono" style={{ fontSize: 11, color: TK.gold, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600 }}>
        {formatDate(c.date || c.created_at)}
      </div>
      <div className="pk-cd-mono" style={{ fontSize: 10, color: TK.textGhost, letterSpacing: '0.10em' }}>
        {formatRelativeShort(c.created_at)}
      </div>
    </div>
    <div style={{ display: 'flex', gap: 22, marginBottom: c.notes ? 12 : 0 }}>
      {c.weight != null && (
        <div>
          <div className="pk-cd-mono" style={{ fontSize: 22, fontWeight: 600, color: TK.text, letterSpacing: '-0.02em' }}>
            {c.weight} <span style={{ fontSize: 12, color: TK.textMute, fontWeight: 400 }}>kg</span>
          </div>
          <div className="pk-cd-label">WEIGHT</div>
        </div>
      )}
      {c.body_fat != null && (
        <div>
          <div className="pk-cd-mono" style={{ fontSize: 22, fontWeight: 600, color: TK.text, letterSpacing: '-0.02em' }}>
            {c.body_fat} <span style={{ fontSize: 12, color: TK.textMute, fontWeight: 400 }}>%</span>
          </div>
          <div className="pk-cd-label">BODY FAT</div>
        </div>
      )}
    </div>
    {c.notes && (
      <div style={{
        fontSize: 13, color: TK.textDim, lineHeight: 1.5,
        paddingTop: 12, borderTop: `1px solid ${TK.hairline}`, marginTop: 12,
      }}>
        {c.notes}
      </div>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────
// MESSAGES tab
// ─────────────────────────────────────────────────────────
const Messages = ({ clientId, clientName, messages, thread, currentUid, onRefetch }) => {
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const send = async (e) => {
    e?.preventDefault?.();
    if (!draft.trim() || busy) return;
    setBusy(true);
    try {
      // Ensure thread exists
      let threadId = thread?.id;
      if (!threadId) {
        const { data, error } = await supabase
          .from('dm_threads')
          .insert({ client_id: clientId, last_activity_at: new Date().toISOString() })
          .select('id').single();
        if (error) throw error;
        threadId = data.id;
      }
      const { error: msgError } = await supabase.from('dm_messages').insert({
        thread_id: threadId,
        author_id: currentUid,
        content: draft.trim(),
        read_by_client: false,
        read_by_coach: true,
      });
      if (msgError) throw msgError;
      // Update thread activity
      await supabase.from('dm_threads').update({ last_activity_at: new Date().toISOString() }).eq('id', threadId);
      setDraft('');
      onRefetch?.();
    } catch (e) {
      console.error('Send failed:', e);
    } finally { setBusy(false); }
  };

  return (
    <section style={{ padding: '24px 28px', maxWidth: 1080, margin: '0 auto', width: '100%' }}>
      <div className="pk-cd-label" style={{ marginBottom: 16 }}>
        THREAD WITH {clientName?.toUpperCase()}
      </div>

      <div className="pk-cd-glass" style={{ display: 'flex', flexDirection: 'column', height: 520 }}>
        <div ref={scrollRef} style={{
          flex: 1, overflow: 'auto', padding: '20px 22px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {messages.length === 0 && (
            <div style={{
              margin: 'auto', textAlign: 'center', color: TK.textMute, fontSize: 13,
            }}>
              No messages yet. Start the thread.
            </div>
          )}
          {messages.map((m) => (
            <MessageBubble key={m.id} m={m} currentUid={currentUid} />
          ))}
        </div>

        <form onSubmit={send} style={{
          display: 'flex', gap: 10, padding: '14px 16px',
          borderTop: `1px solid ${TK.hairline}`,
        }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Reply…"
            style={{
              flex: 1, padding: '11px 14px', borderRadius: 10,
              background: 'rgba(0,0,0,0.4)', color: TK.text,
              border: `1px solid ${TK.hairline}`, outline: 'none',
              fontSize: 14, fontFamily: 'inherit',
            }}
          />
          <button
            type="submit"
            disabled={!draft.trim() || busy}
            className="pk-cd-mono"
            style={{
              padding: '11px 16px', borderRadius: 10,
              background: draft.trim() ? TK.gold : 'transparent',
              color: draft.trim() ? '#000' : TK.textMute,
              border: `1px solid ${draft.trim() ? TK.gold : TK.hairline}`,
              cursor: draft.trim() ? 'pointer' : 'default',
              fontSize: 11, fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 200ms ease',
            }}
          >
            {busy
              ? <Loader2 size={11} style={{ animation: 'pk-spin 1s linear infinite' }} />
              : <Send size={11} strokeWidth={2.6} />}
            SEND
          </button>
        </form>
      </div>
    </section>
  );
};

const MessageBubble = ({ m, currentUid }) => {
  const isCoach = m.author_id === currentUid;
  return (
    <div style={{
      display: 'flex',
      justifyContent: isCoach ? 'flex-end' : 'flex-start',
      animation: 'pk-rise 200ms ease both',
    }}>
      <div style={{
        maxWidth: '72%',
        padding: '10px 14px', borderRadius: 14,
        borderBottomRightRadius: isCoach ? 4 : 14,
        borderBottomLeftRadius: isCoach ? 14 : 4,
        background: isCoach ? 'rgba(201,169,97,0.16)' : 'rgba(250,250,250,0.06)',
        border: `1px solid ${isCoach ? 'rgba(201,169,97,0.25)' : TK.hairline}`,
        color: TK.text,
      }}>
        <div style={{ fontSize: 14, lineHeight: 1.45, letterSpacing: '-0.005em', whiteSpace: 'pre-wrap' }}>
          {m.content}
        </div>
        <div className="pk-cd-mono" style={{
          fontSize: 9, color: TK.textGhost, marginTop: 6,
          letterSpacing: '0.10em', textTransform: 'uppercase',
        }}>
          {isCoach ? 'COACH' : 'CLIENT'} · {formatRelativeShort(m.created_at)}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// NOTES tab
// ─────────────────────────────────────────────────────────
const Notes = ({ client, onSave }) => {
  const [notes, setNotes] = useState(client.coach_notes || '');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => { setNotes(client.coach_notes || ''); }, [client.coach_notes]);

  const dirty = notes !== (client.coach_notes || '');

  const save = async () => {
    if (!dirty || busy) return;
    setBusy(true);
    try {
      await onSave(notes);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } finally { setBusy(false); }
  };

  return (
    <section style={{ padding: '24px 28px', maxWidth: 1080, margin: '0 auto', width: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
      }}>
        <div className="pk-cd-label">COACH NOTES</div>
        {saved && (
          <div className="pk-cd-mono" style={{
            fontSize: 10, color: 'rgba(108,197,154,0.85)',
            letterSpacing: '0.16em', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Check size={11} strokeWidth={2.6} /> SAVED
          </div>
        )}
      </div>
      <div className="pk-cd-glass" style={{ padding: 22 }}>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="History, mobility quirks, lifestyle notes, communication style…"
          rows={10}
          style={{
            width: '100%', resize: 'vertical', padding: '14px 16px', borderRadius: 12,
            background: 'rgba(0,0,0,0.4)', color: TK.text,
            border: `1px solid ${TK.hairline}`, outline: 'none',
            fontSize: 14, lineHeight: 1.6, fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
          <button
            onClick={save}
            disabled={!dirty || busy}
            className="pk-cd-mono"
            style={{
              padding: '10px 18px', borderRadius: 10,
              background: dirty ? TK.gold : 'transparent',
              color: dirty ? '#000' : TK.textMute,
              border: `1px solid ${dirty ? TK.gold : TK.hairline}`,
              cursor: dirty ? 'pointer' : 'default',
              fontSize: 11, fontWeight: 700,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 200ms ease',
            }}
          >
            {busy ? <Loader2 size={11} style={{ animation: 'pk-spin 1s linear infinite' }} /> : null}
            SAVE NOTES
          </button>
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────
export default function ClientDetail() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const [tab, setTab] = useState('history');
  const data = useClient(clientId);

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

  const saveNotes = async (notes) => {
    const { error } = await supabase.from('profiles').update({ coach_notes: notes }).eq('id', clientId);
    if (error) throw error;
  };

  return (
    <div className="pk-cd">
      <style>{STYLES}</style>
      <Header name={data.client?.name || ''} />

      {data.loading && (
        <div style={{
          minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: TK.textMute, fontFamily: 'Geist Mono, monospace', fontSize: 11,
          letterSpacing: '0.20em', textTransform: 'uppercase',
        }}>
          <Loader2 size={16} style={{ animation: 'pk-spin 1s linear infinite', marginRight: 12 }} />
          LOADING CLIENT
        </div>
      )}

      {data.error && (
        <div style={{
          minHeight: '60vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 14, padding: 28,
        }}>
          <div className="pk-cd-mono" style={{
            color: 'rgba(224,122,108,0.85)',
            fontSize: 11, letterSpacing: '0.20em', textTransform: 'uppercase',
          }}>
            CLIENT NOT FOUND
          </div>
          <button onClick={() => navigate('/console')} className="pk-cd-mono" style={{
            padding: '10px 16px', borderRadius: 10,
            background: 'transparent', border: `1px solid ${TK.hairline}`,
            color: TK.textDim, cursor: 'pointer',
            fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
          }}>
            ← BACK TO CONSOLE
          </button>
        </div>
      )}

      {!data.loading && !data.error && data.client && (
        <>
          <Hero
            client={data.client}
            prs={data.prs}
            sessions={data.sessions}
            checkIns={data.checkIns}
          />
          <TabBar
            active={tab}
            onChange={setTab}
            badges={{
              history: data.prs.length + data.sessions.length,
              checkins: data.checkIns.length,
              messages: data.messages.length,
            }}
          />
          {tab === 'history'  && <History prs={data.prs} sessions={data.sessions} />}
          {tab === 'checkins' && <CheckIns checkIns={data.checkIns} />}
          {tab === 'messages' && (
            <Messages
              clientId={clientId}
              clientName={data.client.name}
              messages={data.messages}
              thread={data.thread}
              currentUid={auth.session.uid}
              onRefetch={data.refetch}
            />
          )}
          {tab === 'notes' && <Notes client={data.client} onSave={saveNotes} />}
        </>
      )}

      <footer style={{
        padding: '40px 28px 28px',
        maxWidth: 1080, margin: '0 auto', width: '100%',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: `1px solid ${TK.hairline}`, marginTop: 40,
      }}>
        <div className="pk-cd-mono" style={{
          fontSize: 10, letterSpacing: '0.20em', textTransform: 'uppercase',
          color: TK.textMute,
        }}>
          PKFIT · IDENTITY ARCHITECT · PERCY KEITH
        </div>
        <div className="pk-cd-mono" style={{
          fontSize: 10, letterSpacing: '0.18em', textTransform: 'lowercase',
          color: TK.textGhost,
        }}>
          powered by claude
        </div>
      </footer>
    </div>
  );
}
