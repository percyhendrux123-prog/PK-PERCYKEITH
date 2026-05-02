import React, { useEffect, useState } from 'react';
import { Loader2, ArrowRight, Lock } from 'lucide-react';
import { supabase } from './supabase.js';

// ─────────────────────────────────────────────────────────
// Auth: Supabase anonymous sign-in (real session) with
// localStorage fallback so the UX never breaks if the
// project hasn't enabled anonymous sign-ins yet.
// ─────────────────────────────────────────────────────────
const STORAGE_KEY = 'pk-hub-fallback-session';

const readLocal = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};
const writeLocal = (s) => {
  try {
    if (s) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pk-hub-session-change'));
  }
};

const sessionFromSupabase = (s) => s ? ({
  displayName: s.user?.user_metadata?.display_name || 'Coach',
  source: 'supabase',
  uid: s.user?.id,
}) : null;

export const useAuth = () => {
  const [state, setState] = useState({ loading: true, session: null });

  useEffect(() => {
    let mounted = true;

    const apply = (sbSession) => {
      if (!mounted) return;
      if (sbSession) {
        setState({ loading: false, session: sessionFromSupabase(sbSession) });
      } else {
        setState({ loading: false, session: readLocal() });
      }
    };

    supabase.auth.getSession().then(({ data }) => apply(data.session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => apply(session));

    const onLocalChange = () => {
      if (!mounted) return;
      // Recheck Supabase first so signing out from supabase doesn't get masked by stale localStorage
      supabase.auth.getSession().then(({ data }) => apply(data.session));
    };
    window.addEventListener('storage', onLocalChange);
    window.addEventListener('pk-hub-session-change', onLocalChange);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('storage', onLocalChange);
      window.removeEventListener('pk-hub-session-change', onLocalChange);
    };
  }, []);

  return state;
};

export const signIn = async ({ displayName }) => {
  const name = (displayName || 'Coach').trim();
  try {
    const { data, error } = await supabase.auth.signInAnonymously({
      options: { data: { display_name: name } },
    });
    if (error) throw error;
    return { source: 'supabase', session: data.session };
  } catch (e) {
    writeLocal({ displayName: name, source: 'local', signedInAt: new Date().toISOString() });
    return { source: 'local', error: e?.message };
  }
};

export const signOut = async () => {
  await supabase.auth.signOut().catch(() => {});
  writeLocal(null);
};

// ─────────────────────────────────────────────────────────
// SignIn screen
// ─────────────────────────────────────────────────────────
const TK = {
  text: '#FAFAFA',
  textDim: 'rgba(250,250,250,0.62)',
  textMute: 'rgba(250,250,250,0.40)',
  textGhost: 'rgba(250,250,250,0.22)',
  hairline: 'rgba(250,250,250,0.08)',
  gold: '#C9A961',
  warn: '#E0B97A',
  danger: '#E07A6C',
};

export const SignIn = () => {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');

  const enter = async (e) => {
    e?.preventDefault?.();
    if (busy) return;
    setBusy(true); setWarn('');
    const result = await signIn({ displayName: name });
    // useAuth subscriber will pick up the session and unmount this screen.
    if (result.source === 'local') {
      setWarn('Real auth provider unavailable — running in fallback mode.');
      // stay on the screen briefly to show the message? No — proceed.
    }
    setBusy(false);
  };

  return (
    <div style={{
      minHeight: '100vh', position: 'relative',
      background: '#000', color: TK.text,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 28, overflow: 'hidden',
      fontFamily: "'Geist', -apple-system, sans-serif",
    }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 40% at 50% 40%, rgba(201,169,97,0.12), transparent 60%)',
      }} />

      <form onSubmit={enter} style={{
        position: 'relative', zIndex: 1,
        width: 'min(420px, 100%)',
        background: 'rgba(250,250,250,0.04)',
        border: `1px solid ${TK.hairline}`,
        borderRadius: 18, padding: 32,
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 28, color: TK.gold,
        }}>
          <Lock size={13} strokeWidth={2.4} />
          <div style={{
            fontFamily: 'Geist Mono, monospace',
            fontSize: 11, letterSpacing: '0.20em', textTransform: 'uppercase',
            fontWeight: 600,
          }}>
            OPERATOR ACCESS
          </div>
        </div>

        <div style={{
          fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em',
          lineHeight: 1.0, marginBottom: 8,
        }}>
          Enter the<br/><span style={{ color: TK.gold }}>console.</span>
        </div>

        <div style={{
          fontSize: 13, color: TK.textDim, marginBottom: 26,
          lineHeight: 1.5,
        }}>
          Coaches only. Your name appears on every action and message you send.
        </div>

        <label style={{ display: 'block', marginBottom: 18 }}>
          <div style={{
            fontFamily: 'Geist Mono, monospace',
            fontSize: 10, letterSpacing: '0.20em', textTransform: 'uppercase',
            color: TK.textMute, fontWeight: 500, marginBottom: 6,
          }}>
            DISPLAY NAME
          </div>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Percy Keith"
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 10,
              background: 'rgba(0,0,0,0.4)', color: TK.text,
              border: `1px solid ${TK.hairline}`, outline: 'none',
              fontSize: 15, fontFamily: 'inherit',
            }}
          />
        </label>

        {warn && (
          <div style={{
            color: TK.warn, fontSize: 11, marginBottom: 14,
            fontFamily: 'Geist Mono, monospace',
            letterSpacing: '0.04em',
          }}>
            {warn}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          style={{
            width: '100%', padding: '14px 20px', borderRadius: 12,
            background: TK.gold, color: '#000', border: 'none', cursor: 'pointer',
            fontFamily: 'Geist Mono, monospace',
            fontSize: 12, fontWeight: 700,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'transform 180ms cubic-bezier(0.2,0.7,0.2,1)',
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {busy
            ? <><Loader2 size={13} style={{ animation: 'pk-spin 1s linear infinite' }} /> ENTERING</>
            : <>ENTER <ArrowRight size={13} strokeWidth={2.6} /></>}
        </button>

        <div style={{
          marginTop: 22, paddingTop: 18, borderTop: `1px solid ${TK.hairline}`,
          fontFamily: 'Geist Mono, monospace',
          fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase',
          color: TK.textGhost, textAlign: 'center',
        }}>
          PKFIT · IDENTITY ARCHITECT · PERCY KEITH
        </div>
      </form>
      <style>{`@keyframes pk-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
