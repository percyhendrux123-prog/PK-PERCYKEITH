import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, Trophy, ChevronDown, Calendar, Copy, Check, ExternalLink,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────
// ATLAS TOKENS
// ─────────────────────────────────────────────────────────
const T = {
  bg: '#0A0A0B',
  surface: '#141418',
  surfaceElev: '#1C1C22',
  border: '#28282F',
  borderSoft: '#1F1F25',
  text: '#FAFAFA',
  textDim: '#A8A8B3',
  textMute: '#6B6B76',
  moon: '#C9A876',
  moonBright: '#E0C293',
  moonDim: '#8A7350',
  success: '#7BC97B',
  danger: '#E26B6B',
};

const FONTS = `
  @keyframes pkfit-fade-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes pkfit-fade-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes pkfit-bounce-cue { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(8px); } }

  .pkfit-grain::before {
    content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 1;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.04 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    opacity: 0.5; mix-blend-mode: overlay;
  }

  .pkfit-share { font-family: 'Space Grotesk', -apple-system, sans-serif; }

  html { scroll-behavior: smooth; }
`;

// ─────────────────────────────────────────────────────────
// MOCK PAYLOAD — what would be decoded from /share/:id
// ─────────────────────────────────────────────────────────
const SHARE = {
  user: 'Percy King',
  initials: 'PK',
  weekLabel: 'Week of May 2 · 2026',
  weekISO: '2026-W18',
  workouts: 4,
  minutes: 209,
  volume: 36570,
  calories: 1420,
  perDay: [
    { day: 'Mon', short: 'M', minutes: 0, label: 'Rest' },
    { day: 'Tue', short: 'T', minutes: 48, label: 'Pull · Volume' },
    { day: 'Wed', short: 'W', minutes: 0, label: 'Rest' },
    { day: 'Thu', short: 'T', minutes: 65, label: 'Legs · Heavy' },
    { day: 'Fri', short: 'F', minutes: 72, label: 'Push · Hypertrophy' },
    { day: 'Sat', short: 'S', minutes: 24, label: 'Mobility' },
    { day: 'Sun', short: 'S', minutes: 0, label: 'Rest' },
  ],
  pr: { lift: 'Overhead Press', delta: 5, current: 145, prev: 140, day: 'Friday', time: '6:42pm' },
  note: 'Bench is moving. Don\'t chase the PR today — earn the volume, then we test next Friday.',
  coach: 'PK',
};

// ─────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smoothstep = (t) => t * t * (3 - 2 * t);

const useReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);
  return reduced;
};

const useSectionProgress = (ref) => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh;
      const end = -rect.height;
      const raw = (start - rect.top) / (start - end);
      setProgress(clamp(raw));
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; measure(); });
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref]);
  return progress;
};

const useEntered = (ref, threshold = 0.3) => {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setEntered(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return entered;
};

const useScrollY = () => {
  const [y, setY] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; setY(window.scrollY); });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return y;
};

// ─────────────────────────────────────────────────────────
// COUNT-UP — animates to a numeric target when in view
// ─────────────────────────────────────────────────────────
const CountUp = ({ to, duration = 1100, format = (v) => v, prefix = '', suffix = '' }) => {
  const ref = useRef(null);
  const entered = useEntered(ref, 0.4);
  const reduced = useReducedMotion();
  const [v, setV] = useState(reduced ? to : 0);

  useEffect(() => {
    if (!entered) return;
    if (reduced) { setV(to); return; }
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = clamp((now - start) / duration);
      setV(to * smoothstep(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [entered, to, duration, reduced]);

  return (
    <span ref={ref} style={{ fontFeatureSettings: '"tnum"', display: 'inline-block' }}>
      {prefix}{format(v)}{suffix}
    </span>
  );
};

// ─────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────
const Header = ({ scrollY, onCTA }) => {
  const opacity = clamp(scrollY / 200);
  return (
    <header
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '14px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: `rgba(10,10,11,${opacity * 0.85})`,
        backdropFilter: opacity > 0.1 ? 'blur(20px) saturate(140%)' : 'none',
        WebkitBackdropFilter: opacity > 0.1 ? 'blur(20px) saturate(140%)' : 'none',
        borderBottom: `1px solid rgba(40,40,47,${opacity})`,
        transition: 'border-color 280ms ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: T.moon, color: T.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Fraunces, serif', fontSize: 14, fontWeight: 600,
        }}>p</div>
        <span style={{ fontSize: 14, fontWeight: 500, color: T.text, letterSpacing: '-0.01em' }}>
          pkfit
        </span>
        <span style={{ fontSize: 12, color: T.textMute, marginLeft: 4 }}>· share</span>
      </div>
      <button
        onClick={onCTA}
        style={{
          padding: '8px 14px', borderRadius: 100,
          background: T.text, color: T.bg, border: 'none',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit', letterSpacing: '-0.01em',
          display: 'flex', alignItems: 'center', gap: 6,
          opacity: clamp(scrollY / 400),
          transition: 'transform 240ms cubic-bezier(0.2,0.7,0.2,1)',
        }}
      >
        Train with PK <ArrowRight size={13} strokeWidth={2.4} />
      </button>
    </header>
  );
};

// ─────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────
const Hero = ({ scrollY }) => {
  const reduced = useReducedMotion();
  const fade = clamp(1 - scrollY / 600);
  const y = reduced ? 0 : scrollY * 0.4;

  return (
    <section style={{
      minHeight: '100vh', position: 'relative',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      padding: '0 24px', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse 70% 60% at 30% 30%, rgba(201,168,118,0.20), transparent 60%), radial-gradient(ellipse 60% 50% at 80% 70%, rgba(231,107,107,0.08), transparent 60%)`,
        transform: `translateY(${y * 0.5}px)`,
        opacity: fade,
      }} />

      <div style={{
        position: 'relative', zIndex: 2,
        maxWidth: 980, margin: '0 auto', width: '100%',
        transform: `translateY(${y * 0.2}px)`,
        opacity: fade,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '8px 14px', borderRadius: 100,
          background: 'rgba(201,168,118,0.10)',
          border: `1px solid rgba(201,168,118,0.20)`,
          fontSize: 12, color: T.moon, fontWeight: 600,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          marginBottom: 32,
          animation: 'pkfit-fade-up 800ms cubic-bezier(0.2,0.7,0.2,1) both',
        }}>
          <Calendar size={12} strokeWidth={2.4} />
          {SHARE.weekLabel}
        </div>

        <h1 style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 'clamp(56px, 12vw, 180px)',
          fontWeight: 400, lineHeight: 0.92,
          letterSpacing: '-0.045em', color: T.text, margin: 0,
          fontVariationSettings: '"opsz" 144',
          animation: 'pkfit-fade-up 1000ms cubic-bezier(0.2,0.7,0.2,1) 100ms both',
        }}>
          {SHARE.user.split(' ')[0]} had<br />
          <span style={{ fontStyle: 'italic', color: T.moon, fontWeight: 300 }}>a week.</span>
        </h1>

        <p style={{
          fontSize: 'clamp(15px, 2vw, 22px)', color: T.textDim,
          marginTop: 32, lineHeight: 1.5, maxWidth: 600,
          letterSpacing: '-0.01em',
          animation: 'pkfit-fade-up 1200ms cubic-bezier(0.2,0.7,0.2,1) 300ms both',
        }}>
          {SHARE.workouts} sessions. {SHARE.minutes} minutes under tension. One personal record.
          Here it is, hour by hour.
        </p>
      </div>

      <div style={{
        position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        opacity: clamp(1 - scrollY / 200), zIndex: 2,
      }}>
        <div style={{ fontSize: 10, color: T.textMute, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          Scroll
        </div>
        <ChevronDown size={16} color={T.textMute} style={{ animation: reduced ? 'none' : 'pkfit-bounce-cue 2s ease-in-out infinite' }} />
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────
// STAT MORPH — sticky, cross-faded, count-up per stat
// ─────────────────────────────────────────────────────────
const StatMorph = () => {
  const ref = useRef(null);
  const progress = useSectionProgress(ref);

  const stats = [
    { value: SHARE.workouts, format: (v) => Math.round(v), suffix: '', label: 'workouts logged', sub: 'Push, pull, legs, mobility.', tint: T.moon },
    { value: SHARE.minutes, format: (v) => Math.round(v), suffix: ' min', label: 'minutes of work', sub: '3.5 hours under load.', tint: T.moonBright },
    { value: SHARE.volume / 1000, format: (v) => v.toFixed(1), suffix: 'k lb', label: 'total volume moved', sub: 'Equivalent to a small sedan, lifted.', tint: T.moon },
    { value: SHARE.calories, format: (v) => Math.round(v), suffix: ' kcal', label: 'calories spent', sub: 'About six bowls of oatmeal.', tint: T.moonDim },
  ];

  const segs = stats.length;
  const idx = Math.min(segs - 1, Math.floor(progress * segs));
  const localT = (progress * segs) - idx;
  const fadeIn = clamp(localT * 2);
  const fadeOut = clamp((1 - localT) * 2);
  const op = Math.min(fadeIn, fadeOut);
  const s = stats[idx];

  return (
    <section ref={ref} style={{ position: 'relative', height: `${segs * 100}vh` }}>
      <div style={{
        position: 'sticky', top: 0, height: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '0 24px',
      }}>
        <div style={{
          fontSize: 11, color: T.textMute, fontWeight: 600,
          letterSpacing: '0.20em', textTransform: 'uppercase', marginBottom: 32,
          fontFeatureSettings: '"tnum"',
        }}>
          {String(idx + 1).padStart(2, '0')} / {String(segs).padStart(2, '0')}
        </div>

        <div style={{
          textAlign: 'center', maxWidth: 900, width: '100%',
          opacity: op, transform: `scale(${0.96 + op * 0.04})`,
          transition: 'opacity 240ms cubic-bezier(0.2,0.7,0.2,1)',
        }}>
          <div style={{
            fontFamily: 'Fraunces, serif',
            fontSize: 'clamp(72px, 18vw, 280px)',
            fontWeight: 300, lineHeight: 0.85,
            letterSpacing: '-0.05em', color: T.text,
            fontVariationSettings: '"opsz" 144',
          }}>
            <span style={{ color: s.tint }}>
              <CountUp key={idx} to={s.value} format={s.format} duration={1100} />
            </span>
            <span style={{ fontSize: '0.4em', color: T.textDim, fontWeight: 300, marginLeft: 8 }}>
              {s.suffix}
            </span>
          </div>
          <div style={{
            fontFamily: 'Fraunces, serif',
            fontSize: 'clamp(20px, 2.4vw, 28px)',
            color: T.text, marginTop: 16, fontStyle: 'italic',
            fontWeight: 400, letterSpacing: '-0.01em',
          }}>
            {s.label}
          </div>
          <div style={{
            fontSize: 'clamp(13px, 1.4vw, 16px)', color: T.textDim,
            marginTop: 8, letterSpacing: '-0.01em',
          }}>
            {s.sub}
          </div>
        </div>

        <div style={{
          position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 8,
        }}>
          {stats.map((_, i) => (
            <div key={i} style={{
              width: i === idx ? 24 : 6, height: 6, borderRadius: 3,
              background: i === idx ? T.moon : T.surfaceElev,
              transition: 'all 320ms cubic-bezier(0.2,0.7,0.2,1)',
            }} />
          ))}
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────
// CHART SCENE
// ─────────────────────────────────────────────────────────
const ChartScene = () => {
  const ref = useRef(null);
  const progress = useSectionProgress(ref);

  const max = Math.max(...SHARE.perDay.map(d => d.minutes));
  const bestIdx = SHARE.perDay.reduce((best, d, i, arr) => d.minutes > arr[best].minutes ? i : best, 0);

  const barProgress = (i) => {
    const start = 0.15 + i * 0.06;
    const end = start + 0.20;
    return smoothstep(clamp((progress - start) / (end - start)));
  };

  const calloutOp = smoothstep(clamp((progress - 0.65) / 0.20));

  return (
    <section
      ref={ref}
      style={{
        position: 'relative', height: '180vh',
        background: `linear-gradient(180deg, transparent, rgba(201,168,118,0.04), transparent)`,
      }}
    >
      <div style={{
        position: 'sticky', top: 0, height: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '0 24px',
      }}>
        <div style={{ maxWidth: 980, width: '100%', textAlign: 'center' }}>
          <div style={{
            fontSize: 11, color: T.moon, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 16,
            opacity: clamp(progress * 4),
          }}>
            The shape of the week
          </div>
          <h2 style={{
            fontFamily: 'Fraunces, serif',
            fontSize: 'clamp(36px, 6vw, 76px)',
            fontWeight: 400, lineHeight: 1.0,
            letterSpacing: '-0.03em', color: T.text, margin: 0,
            opacity: clamp(progress * 3),
          }}>
            Two big days.<br />
            <span style={{ fontStyle: 'italic', color: T.moon }}>One quiet finish.</span>
          </h2>

          <div style={{
            marginTop: 'clamp(48px, 8vh, 96px)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
            gap: 'clamp(6px, 2vw, 24px)',
            height: 'clamp(160px, 30vh, 280px)',
            position: 'relative',
          }}>
            {SHARE.perDay.map((d, i) => {
              const p = barProgress(i);
              const isBest = i === bestIdx;
              const heightPct = max > 0 ? (d.minutes / max) * 100 : 0;
              return (
                <div key={i} style={{
                  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  height: '100%', justifyContent: 'flex-end', position: 'relative',
                }}>
                  <div style={{
                    fontSize: 11, color: T.textDim, fontWeight: 600,
                    fontFeatureSettings: '"tnum"', marginBottom: 8,
                    opacity: p, transform: `translateY(${(1 - p) * 8}px)`,
                  }}>
                    {d.minutes > 0 ? `${d.minutes}m` : '—'}
                  </div>
                  <div style={{
                    width: '100%',
                    height: `${heightPct * p}%`,
                    background: isBest
                      ? `linear-gradient(180deg, ${T.moonBright}, ${T.moon})`
                      : `linear-gradient(180deg, ${T.moon}, ${T.moonDim})`,
                    borderRadius: '8px 8px 0 0',
                    transformOrigin: 'bottom',
                    boxShadow: isBest ? `0 0 40px rgba(201,168,118,0.4)` : 'none',
                    transition: 'box-shadow 400ms ease',
                    minHeight: d.minutes > 0 ? 4 : 0,
                  }} />
                  <div style={{
                    fontSize: 12, color: T.textMute, marginTop: 12,
                    fontWeight: 500, letterSpacing: '0.04em',
                  }}>
                    {d.short}
                  </div>
                </div>
              );
            })}

            <div style={{
              position: 'absolute', top: -56,
              left: `${(bestIdx + 0.5) / 7 * 100}%`,
              transform: `translateX(-50%) translateY(${(1 - calloutOp) * 16}px)`,
              opacity: calloutOp, pointerEvents: 'none',
            }}>
              <div style={{
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 12, padding: '8px 14px', whiteSpace: 'nowrap',
                boxShadow: '0 12px 28px rgba(0,0,0,0.4)',
              }}>
                <div style={{ fontSize: 10, color: T.moon, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Strongest
                </div>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 16, color: T.text, marginTop: 2 }}>
                  {SHARE.perDay[bestIdx].label}
                </div>
              </div>
              <div style={{
                width: 1, height: 24, background: T.border, margin: '0 auto',
              }} />
            </div>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between',
            gap: 'clamp(6px, 2vw, 24px)', marginTop: 16,
            opacity: clamp((progress - 0.3) * 2),
          }}>
            {SHARE.perDay.map((d, i) => (
              <div key={i} style={{
                flex: 1, fontSize: 10, color: T.textMute, textAlign: 'center',
                opacity: barProgress(i),
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {d.minutes > 0 ? d.label.split(' · ')[0] : ''}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────
// PR MOMENT
// ─────────────────────────────────────────────────────────
const PRMoment = () => {
  const ref = useRef(null);
  const progress = useSectionProgress(ref);
  const reveal = clamp((progress - 0.2) * 2);
  const burstScale = lerp(0.8, 1, smoothstep(reveal));

  return (
    <section
      ref={ref}
      style={{
        minHeight: '90vh', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '120px 24px', overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: `translate(-50%, -50%) scale(${burstScale})`,
        width: 'clamp(400px, 60vw, 900px)', aspectRatio: '1',
        background: `radial-gradient(circle, rgba(201,168,118,0.18), transparent 60%)`,
        opacity: reveal,
      }} />

      <div style={{
        position: 'relative', textAlign: 'center', maxWidth: 900,
        opacity: reveal, transform: `translateY(${(1 - reveal) * 40}px) scale(${burstScale})`,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderRadius: 100,
          background: 'rgba(201,168,118,0.12)',
          border: `1px solid rgba(201,168,118,0.30)`,
          fontSize: 11, color: T.moon, fontWeight: 700,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          marginBottom: 24,
        }}>
          <Trophy size={11} strokeWidth={2.4} /> Personal Record
        </div>

        <div style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 'clamp(22px, 3vw, 36px)',
          color: T.textDim, fontStyle: 'italic',
          letterSpacing: '-0.01em', marginBottom: 16,
        }}>
          And then this happened.
        </div>

        <div style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 'clamp(110px, 24vw, 380px)',
          fontWeight: 300, lineHeight: 0.85,
          letterSpacing: '-0.06em', color: T.moon,
          fontVariationSettings: '"opsz" 144',
        }}>
          <CountUp to={SHARE.pr.delta} prefix="+" format={(v) => Math.round(v)} duration={1400} />
          <span style={{ fontSize: '0.3em', color: T.textDim, marginLeft: 12, fontWeight: 400 }}>lb</span>
        </div>

        <div style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 'clamp(22px, 3.5vw, 44px)',
          color: T.text, marginTop: 16,
          fontWeight: 400, letterSpacing: '-0.02em',
        }}>
          on {SHARE.pr.lift}.
        </div>

        <div style={{
          fontSize: 13, color: T.textMute, marginTop: 14,
          letterSpacing: '0.04em',
        }}>
          {SHARE.pr.day} · {SHARE.pr.time} · {SHARE.pr.prev} → {SHARE.pr.current} lb
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────
// COACH NOTE
// ─────────────────────────────────────────────────────────
const CoachNote = () => {
  const ref = useRef(null);
  const progress = useSectionProgress(ref);
  const reveal = clamp((progress - 0.15) * 2);

  return (
    <section
      ref={ref}
      style={{
        minHeight: '70vh', position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '80px 24px',
        background: `linear-gradient(180deg, transparent, ${T.surface}, transparent)`,
      }}
    >
      <div style={{
        maxWidth: 800, opacity: reveal,
        transform: `translateY(${(1 - reveal) * 24}px)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 28,
            background: `linear-gradient(135deg, ${T.moon}, ${T.moonDim})`,
            color: T.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Fraunces, serif', fontSize: 22, fontWeight: 500,
          }}>
            {SHARE.initials}
          </div>
          <div>
            <div style={{ fontSize: 14, color: T.text, fontWeight: 500 }}>
              Coach {SHARE.coach}
            </div>
            <div style={{ fontSize: 11, color: T.textMute, letterSpacing: '0.04em' }}>
              Posted to your feed · Friday
            </div>
          </div>
        </div>

        <div style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 'clamp(24px, 4vw, 52px)',
          fontWeight: 400, lineHeight: 1.25,
          letterSpacing: '-0.02em', color: T.text,
          fontStyle: 'italic',
        }}>
          <span style={{ color: T.moon, marginRight: 4 }}>"</span>
          {SHARE.note}
          <span style={{ color: T.moon, marginLeft: 4 }}>"</span>
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────
// CTA
// ─────────────────────────────────────────────────────────
const CTA = () => {
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);
  const entered = useEntered(ref, 0.3);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (e) {}
  };

  return (
    <section
      ref={ref}
      style={{
        minHeight: '80vh', position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '120px 24px 80px', overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse 80% 60% at 50% 50%, rgba(201,168,118,0.10), transparent 60%)`,
        opacity: entered ? 1 : 0,
        transition: 'opacity 800ms ease',
      }} />

      <div style={{
        position: 'relative', textAlign: 'center', maxWidth: 800, width: '100%',
        opacity: entered ? 1 : 0,
        transform: entered ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 800ms cubic-bezier(0.2,0.7,0.2,1)',
      }}>
        <h2 style={{
          fontFamily: 'Fraunces, serif',
          fontSize: 'clamp(44px, 7vw, 96px)',
          fontWeight: 400, lineHeight: 1.0,
          letterSpacing: '-0.035em', color: T.text, margin: 0,
        }}>
          Want a week<br />
          <span style={{ fontStyle: 'italic', color: T.moon }}>like this?</span>
        </h2>

        <p style={{
          fontSize: 'clamp(15px, 1.6vw, 18px)', color: T.textDim,
          marginTop: 24, marginBottom: 48, lineHeight: 1.5,
          maxWidth: 480, marginLeft: 'auto', marginRight: 'auto',
        }}>
          PK builds programs for people who want to look the part and lift the part.
          Free week, no commitment.
        </p>

        <div style={{
          display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap',
        }}>
          <button
            onClick={() => window.open('https://pkfit-intake.netlify.app', '_blank')}
            style={{
              padding: '16px 28px', borderRadius: 14,
              background: T.text, color: T.bg, border: 'none',
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', letterSpacing: '-0.01em',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'transform 240ms cubic-bezier(0.2,0.7,0.2,1)',
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Train with PK <ArrowRight size={16} strokeWidth={2.4} />
          </button>

          <button
            onClick={copy}
            style={{
              padding: '16px 28px', borderRadius: 14,
              background: T.surfaceElev, color: T.text,
              border: `1px solid ${T.border}`,
              fontSize: 15, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', letterSpacing: '-0.01em',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 240ms cubic-bezier(0.2,0.7,0.2,1)',
            }}
          >
            {copied ? (
              <><Check size={16} strokeWidth={2.4} color={T.success} /> Copied</>
            ) : (
              <><Copy size={16} /> Copy share link</>
            )}
          </button>
        </div>

        <div style={{
          marginTop: 80, paddingTop: 32,
          borderTop: `1px solid ${T.borderSoft}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: 12, color: T.textMute,
          gap: 16, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 20, height: 20, borderRadius: 6,
              background: T.moon, color: T.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Fraunces, serif', fontSize: 11, fontWeight: 600,
            }}>p</div>
            pkfit · 2026
          </div>
          <a
            href="https://pkfit-intake.netlify.app"
            style={{ color: T.textMute, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            pkfit · intake <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </section>
  );
};

// ─────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────
export default function PKfitShare() {
  const scrollY = useScrollY();

  return (
    <div
      className="pkfit-share pkfit-grain"
      style={{
        minHeight: '100vh', position: 'relative',
        background: T.bg, color: T.text,
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <style>{FONTS}</style>

      <Header
        scrollY={scrollY}
        onCTA={() => window.open('https://pkfit-intake.netlify.app', '_blank')}
      />

      <Hero scrollY={scrollY} />
      <StatMorph />
      <ChartScene />
      <PRMoment />
      <CoachNote />
      <CTA />
    </div>
  );
}
