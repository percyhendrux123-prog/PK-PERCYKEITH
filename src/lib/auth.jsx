import React, { useEffect, useState } from 'react';
import { Loader2, ArrowRight, Lock, Mail, CheckCircle2 } from 'lucide-react';
import { supabase } from './supabase.js';

// ─────────────────────────────────────────────────────────
// Real Supabase auth via magic link (passwordless OTP).
// ─────────────────────────────────────────────────────────

const sessionFromSupabase = (s) => s ? ({
  uid: s.user?.id,
  email: s.user?.email,
  displayName: s.user?.user_metadata?.display_name || s.user?.email?.split('@')[0] || 'Coach',
}) : null;

export const useAuth = () => {
  const [state, setState] = useState({ loading: true, session: null });

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setState({ loading: false, session: sessionFromSupabase(data.session) });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (mounted) setState({ loading: false, session: sessionFromSupabase(session) });
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  return state;
};

export const signOut = () => supabase.auth.signOut();

const sendMagicLink = async (email) => {
  const redirectTo = `${window.location.origin}/console`;
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
  });
  if (error) throw error;
};

// ─────────────────────────────────────────────────────────
// SignIn — magic-link form
// ─────────────────────────────────────────────────────────
const TK = {
  text: '#FAFAFA',
  textDim: 'rgba(250,250,250,0.62)',
  textMute: 'rgba(250,250,250,0.40)',
  textGhost: 'rgba(250,250,250,0.22)',
  hairline: 'rgba(250,250,250,0.08)',
  gold: '#C9A961',
  success: '#6CC59A',
  danger: '#E07A6C',
};

export const SignIn = () => {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e?.preventDefault?.();
    if (busy || !email.trim()) return;
    setBusy(true); setErr('');
    try {
      await sendMagicLink(email);
      setSent(true);
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
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

      <form onSubmit={submit} style={{
        position: 'relative', zIndex: 1,
        width: 'min(440px, 100%)',
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

        {!sent ? (
          <>
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
              Send yourself a one-time link. No password to remember.
            </div>

            <label style={{ display: 'block', marginBottom: 18 }}>
              <div style={{
                fontFamily: 'Geist Mono, monospace',
                fontSize: 10, letterSpacing: '0.20em', textTransform: 'uppercase',
                color: TK.textMute, fontWeight: 500, marginBottom: 6,
              }}>
                EMAIL
              </div>
              <input
                autoFocus
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 10,
                  background: 'rgba(0,0,0,0.4)', color: TK.text,
                  border: `1px solid ${TK.hairline}`, outline: 'none',
                  fontSize: 15, fontFamily: 'inherit',
                }}
              />
            </label>

            {err && (
              <div style={{
                color: TK.danger, fontSize: 12, marginBottom: 14,
                fontFamily: 'Geist Mono, monospace',
                letterSpacing: '0.04em',
              }}>
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={busy || !email.trim()}
              style={{
                width: '100%', padding: '14px 20px', borderRadius: 12,
                background: TK.gold, color: '#000', border: 'none',
                cursor: busy ? 'default' : 'pointer',
                fontFamily: 'Geist Mono, monospace',
                fontSize: 12, fontWeight: 700,
                letterSpacing: '0.16em', textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: !email.trim() ? 0.5 : 1,
                transition: 'transform 180ms cubic-bezier(0.2,0.7,0.2,1)',
              }}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {busy
                ? <><Loader2 size={13} style={{ animation: 'pk-spin 1s linear infinite' }} /> SENDING</>
                : <>SEND MAGIC LINK <ArrowRight size={13} strokeWidth={2.6} /></>}
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'rgba(108,197,154,0.12)',
              border: `1px solid rgba(108,197,154,0.30)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <Mail size={22} color={TK.success} strokeWidth={2} />
            </div>
            <div style={{
              fontSize: 28, fontWeight: 800, letterSpacing: '-0.025em',
              lineHeight: 1.05, marginBottom: 12,
            }}>
              Check your<br/><span style={{ color: TK.gold }}>inbox.</span>
            </div>
            <div style={{
              fontSize: 13, color: TK.textDim, lineHeight: 1.55, marginBottom: 18,
            }}>
              Sent to <span style={{ color: TK.text, fontWeight: 600 }}>{email}</span>.<br/>
              Click the link in the email to enter the console.
            </div>
            <button
              type="button"
              onClick={() => { setSent(false); setEmail(''); }}
              className="pk-mono"
              style={{
                background: 'transparent', border: `1px solid ${TK.hairline}`,
                padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                color: TK.textDim, fontFamily: 'Geist Mono, monospace',
                fontSize: 10, fontWeight: 600,
                letterSpacing: '0.16em', textTransform: 'uppercase',
              }}
            >
              USE A DIFFERENT EMAIL
            </button>
          </div>
        )}

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
