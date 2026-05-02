import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowUpRight, Send, Loader2, Trophy, Activity, MessageSquare,
  Calendar, Edit3, Check, X,
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
  goldGlow: 'rgba(201,169,97,0.35)',
};

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

// ─────────────────────────────────────────────────────────
// Client data hook
// ─────────────────────────────────────────────────────────
const useClient = (id) => {
  const [state, setState] = useState({
    loading: true, error: null,
    client: null, prs: [], sessions: [], messages: [],
  });

  const fetchAll = async () => {
    if (!id) return;
    const [clientRes, prsRes, sessionsRes, messagesRes] = await Promise.all([
      supabase.from('pk_hub_clients').select('*').eq('id', id).single(),
      supabase.from('pk_hub_prs').select('*').eq('client_id', id).order('logged_at', { ascending: false }),
      supabase.from('pk_hub_sessions')
        .select('*, template:pk_hub_templates(name)')
        .eq('client_id', id)
        .order('due_at', { ascending: false }),
      supabase.from('pk_hub_messages').select('*').eq('client_id', id).order('created_at'),
    ]);
    if (clientRes.error) {
      setState((s) => ({ ...s, loading: false, error: clientRes.error.message }));
      return;
    }
    setState({
      loading: false, error: null,
      client: clientRes.data,
      prs: prsRes.data || [],
      sessions: sessionsRes.data || [],
      messages: messagesRes.data || [],
    });
  };

  useEffect(() => {
    fetchAll();
    if (!id) return;
    const channel = supabase
      .channel(`pk-cd-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pk_hub_clients', filter: `id=eq.${id}` }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pk_hub_prs', filter: `client_id=eq.${id}` }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pk_hub_sessions', filter: `client_id=eq.${id}` }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pk_hub_messages', filter: `client_id=eq.${id}` }, fetchAll)
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
const Hero = ({ client, prs, sessions }) => {
  const completed = sessions.filter((s) => s.status === 'complete').length;
  const totalPRs = prs.length;
  return (
    <section style={{ padding: '64px 28px 32px', maxWidth: 1080, margin: '0 auto', width: '100%' }}>
      <div className="pk-cd-label" style={{ marginBottom: 18 }}>
        <span className={`pk-cd-dot pk-cd-dot-${client.status}`} style={{ marginRight: 10 }} />
        {client.tag}
      </div>
      <h1 style={{
        fontSize: 'clamp(48px, 9vw, 120px)',
        fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.04em',
        margin: 0, color: TK.text,
      }}>
        {client.name}
      </h1>
      {client.notes && (
        <div style={{ fontSize: 16, color: TK.textDim, marginTop: 18, maxWidth: 600, lineHeight: 1.5 }}>
          {client.notes}
        </div>
      )}
      <div style={{
        marginTop: 36, display: 'flex', gap: 36, flexWrap: 'wrap',
        borderTop: `1px solid ${TK.hairline}`, paddingTop: 24,
      }}>
        <Stat n={String(totalPRs).padStart(2, '0')} label="PRs logged" accent />
        <Stat n={String(completed).padStart(2, '0')} label="sessions complete" />
        <Stat n={String(sessions.length).padStart(2, '0')} label="total sessions" />
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
  { id: 'history',  label: 'HISTORY',  icon: Activity },
  { id: 'messages', label: 'MESSAGES', icon: MessageSquare },
  { id: 'notes',    label: 'NOTES',    icon: Edit3 },
];

const TabBar = ({ active, onChange, badges }) => (
  <div style={{
    padding: '0 28px', maxWidth: 1080, margin: '0 auto', width: '100%',
  }}>
    <div className="pk-cd-glass" style={{
      display: 'inline-flex', padding: 4, borderRadius: 12, gap: 4,
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
              cursor: 'pointer',
              transition: 'all 200ms ease',
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
      ...sessions.map((s) => ({ kind: 'session', at: s.due_at, data: s })),
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
        ) : (
          items.map((it, i) => (
            <TimelineRow key={`${it.kind}-${it.data.id}`} item={it} last={i === items.length - 1} />
          ))
        )}
      </div>
    </section>
  );
};

const TimelineRow = ({ item, last }) => {
  const isPR = item.kind === 'pr';
  const isFuture = !isPR && new Date(item.at) > new Date();
  const d = item.data;
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '24px 90px 1fr auto',
      gap: 16, padding: '16px 20px',
      borderBottom: last ? 'none' : `1px solid ${TK.hairline}`,
      alignItems: 'center',
    }}>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isPR
          ? <Trophy size={13} color={TK.gold} strokeWidth={2.2} />
          : <Calendar size={13} color={isFuture ? TK.textDim : TK.textMute} strokeWidth={2} />}
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
              {d.tag || d.template?.name || 'Session'}
            </div>
            <div className="pk-cd-mono" style={{
              fontSize: 11, color: d.status === 'complete' ? 'rgba(108,197,154,0.85)' : TK.textMute,
              marginTop: 2, letterSpacing: '0.10em', textTransform: 'uppercase',
            }}>
              {d.status} · {formatTime(d.due_at)}
            </div>
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
// MESSAGES tab
// ─────────────────────────────────────────────────────────
const Messages = ({ clientId, clientName, messages, onSend }) => {
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [asClient, setAsClient] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const send = async (e) => {
    e?.preventDefault?.();
    if (!draft.trim() || busy) return;
    setBusy(true);
    try {
      await onSend({ body: draft.trim(), sender: asClient ? 'client' : 'coach' });
      setDraft('');
    } finally { setBusy(false); }
  };

  return (
    <section style={{ padding: '24px 28px', maxWidth: 1080, margin: '0 auto', width: '100%' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
      }}>
        <div className="pk-cd-label">THREAD WITH {clientName?.toUpperCase()}</div>
        <button
          onClick={() => setAsClient((v) => !v)}
          className="pk-cd-mono"
          title="Toggle who sends the next message (demo affordance)"
          style={{
            padding: '5px 10px', borderRadius: 6,
            background: asClient ? 'rgba(201,169,97,0.10)' : 'rgba(250,250,250,0.04)',
            border: `1px solid ${asClient ? 'rgba(201,169,97,0.25)' : TK.hairline}`,
            color: asClient ? TK.gold : TK.textMute,
            fontSize: 9, fontWeight: 700,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          SEND AS · {asClient ? 'CLIENT' : 'COACH'}
        </button>
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
            <MessageBubble key={m.id} m={m} />
          ))}
        </div>

        <form onSubmit={send} style={{
          display: 'flex', gap: 10, padding: '14px 16px',
          borderTop: `1px solid ${TK.hairline}`,
        }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={asClient ? `Message as ${clientName}…` : 'Reply…'}
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

const MessageBubble = ({ m }) => {
  const isCoach = m.sender === 'coach';
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
        <div style={{ fontSize: 14, lineHeight: 1.45, letterSpacing: '-0.005em' }}>
          {m.body}
        </div>
        <div className="pk-cd-mono" style={{
          fontSize: 9, color: TK.textGhost, marginTop: 6,
          letterSpacing: '0.10em', textTransform: 'uppercase',
        }}>
          {m.sender} · {formatRelativeShort(m.created_at)}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// NOTES tab
// ─────────────────────────────────────────────────────────
const Notes = ({ client, onSave }) => {
  const [notes, setNotes] = useState(client.notes || '');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => { setNotes(client.notes || ''); }, [client.notes]);

  const dirty = notes !== (client.notes || '');

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

  const sendMessage = async ({ body, sender }) => {
    const { error } = await supabase.from('pk_hub_messages').insert({
      client_id: clientId, sender, body,
    });
    if (error) throw error;
  };
  const saveNotes = async (notes) => {
    const { error } = await supabase.from('pk_hub_clients').update({ notes }).eq('id', clientId);
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
          <Hero client={data.client} prs={data.prs} sessions={data.sessions} />
          <TabBar
            active={tab}
            onChange={setTab}
            badges={{
              history: data.prs.length + data.sessions.length,
              messages: data.messages.length,
            }}
          />
          {tab === 'history'  && <History prs={data.prs} sessions={data.sessions} />}
          {tab === 'messages' && (
            <Messages
              clientId={clientId}
              clientName={data.client.name}
              messages={data.messages}
              onSend={sendMessage}
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
