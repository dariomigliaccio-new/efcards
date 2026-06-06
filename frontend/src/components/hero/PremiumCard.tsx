'use client';

import { useRef, useEffect, useCallback } from 'react';
import { gsap } from '@/lib/gsap';

// ─── Types ────────────────────────────────────────────────────────────────────

export type CardVariant = 'baseball' | 'soccer';

interface PremiumCardProps {
  variant: CardVariant;
  rating: number;
  cardType: string;
  firstName: string;
  lastName: string;
  team: string;
  position: string;
  number: string;
  className?: string;
}

// ─── Per-variant config ───────────────────────────────────────────────────────

const VARIANTS = {
  baseball: {
    accentHex:   '#c9a96e',
    accentHex2:  '#f5c842',
    accentRGB:   '201, 169, 110',
    accentRGB2:  '245, 200, 66',
    bgGradient:  'linear-gradient(170deg, #120800 0%, #1e1200 25%, #0f0800 55%, #050300 100%)',
    spotGrad:    'radial-gradient(ellipse 55% 65% at 50% 25%, rgba(255,190,60,0.18) 0%, transparent 70%)',
    groundGrad:  'radial-gradient(ellipse 90% 35% at 50% 100%, rgba(180,110,0,0.28) 0%, transparent 55%)',
    borderGlow:  'rgba(201,169,110,0.7)',
    shadowGlow:  '0 0 60px rgba(201,169,110,0.35), 0 0 120px rgba(201,169,110,0.15)',
    typeColor:   '#f5c842',
    typeLabel:   'LEGEND',
    holoColors:  ['255,180,0', '255,100,0', '200,50,0'],
    teamInitial: 'NY',
    teamSymbol:  '⚾',
    energyLines: [
      { x1: '8%',  y1: '88%', x2: '38%', y2: '22%' },
      { x1: '65%', y1: '82%', x2: '88%', y2: '35%' },
      { x1: '20%', y1: '70%', x2: '45%', y2: '40%' },
      { x1: '75%', y1: '75%', x2: '55%', y2: '45%' },
    ],
    particles: [
      { x: '15%', y: '30%', size: 3, delay: 0    },
      { x: '82%', y: '25%', size: 2, delay: 0.4  },
      { x: '10%', y: '55%', size: 2, delay: 0.8  },
      { x: '88%', y: '50%', size: 3, delay: 1.2  },
      { x: '30%', y: '20%', size: 1.5, delay: 0.6 },
      { x: '70%', y: '18%', size: 2, delay: 1.0  },
      { x: '50%', y: '12%', size: 1, delay: 0.2  },
      { x: '22%', y: '42%', size: 1.5, delay: 1.4 },
      { x: '78%', y: '60%', size: 2, delay: 0.9  },
    ],
  },
  soccer: {
    accentHex:   '#4ab8ff',
    accentHex2:  '#00e5ff',
    accentRGB:   '74, 184, 255',
    accentRGB2:  '0, 229, 255',
    bgGradient:  'linear-gradient(170deg, #000510 0%, #000d20 25%, #000518 55%, #000208 100%)',
    spotGrad:    'radial-gradient(ellipse 55% 65% at 50% 25%, rgba(0,140,255,0.22) 0%, transparent 70%)',
    groundGrad:  'radial-gradient(ellipse 90% 35% at 50% 100%, rgba(0,80,220,0.3) 0%, transparent 55%)',
    borderGlow:  'rgba(74,184,255,0.75)',
    shadowGlow:  '0 0 60px rgba(74,184,255,0.4), 0 0 120px rgba(0,100,255,0.2)',
    typeColor:   '#00e5ff',
    typeLabel:   'ICON',
    holoColors:  ['0,200,255', '0,100,255', '100,0,255'],
    teamInitial: 'FCB',
    teamSymbol:  '⚽',
    energyLines: [
      { x1: '5%',  y1: '85%', x2: '35%', y2: '18%' },
      { x1: '68%', y1: '80%', x2: '92%', y2: '28%' },
      { x1: '15%', y1: '65%', x2: '42%', y2: '38%' },
      { x1: '78%', y1: '70%', x2: '58%', y2: '42%' },
    ],
    particles: [
      { x: '12%', y: '28%', size: 3,   delay: 0    },
      { x: '85%', y: '22%', size: 2.5, delay: 0.3  },
      { x: '8%',  y: '52%', size: 2,   delay: 0.7  },
      { x: '90%', y: '48%', size: 3,   delay: 1.1  },
      { x: '28%', y: '18%', size: 1.5, delay: 0.5  },
      { x: '72%', y: '15%', size: 2,   delay: 0.9  },
      { x: '50%', y: '10%', size: 1.5, delay: 0.15 },
      { x: '20%', y: '40%', size: 1,   delay: 1.3  },
      { x: '80%', y: '58%', size: 2,   delay: 0.8  },
      { x: '60%', y: '32%', size: 1.5, delay: 1.6  },
    ],
  },
} as const;

// ─── Athlete silhouettes ──────────────────────────────────────────────────────

function BatterSilhouette({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 240 385" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round"
      style={{ filter: `drop-shadow(0 0 18px ${color}) drop-shadow(0 0 40px ${color}88)` }}>
      <circle cx="118" cy="37" r="23" fill={color} stroke="none" />
      <path d="M97 30 Q78 22 70 34 Q67 44 78 48 L96 44" fill={color} stroke="none" />
      <line x1="118" y1="60" x2="116" y2="74" strokeWidth="14" />
      <line x1="130" y1="88" x2="168" y2="68" strokeWidth="16" />
      <line x1="168" y1="68" x2="200" y2="56" strokeWidth="13" />
      <line x1="106" y1="90" x2="74"  y2="96" strokeWidth="16" />
      <line x1="74"  y1="96" x2="52"  y2="106" strokeWidth="13" />
      <line x1="50"  y1="108" x2="204" y2="54" strokeWidth="9" />
      <line x1="116" y1="74" x2="126" y2="160" strokeWidth="32" />
      <line x1="112" y1="160" x2="88"  y2="248" strokeWidth="24" />
      <line x1="88"  y1="248" x2="74"  y2="328" strokeWidth="22" />
      <line x1="74"  y1="328" x2="36"  y2="334" strokeWidth="16" />
      <line x1="138" y1="158" x2="164" y2="248" strokeWidth="24" />
      <line x1="164" y1="248" x2="174" y2="328" strokeWidth="22" />
      <line x1="174" y1="328" x2="214" y2="336" strokeWidth="16" />
    </svg>
  );
}

function SoccerSilhouette({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 250 390" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: 'scaleX(-1)', filter: `drop-shadow(0 0 18px ${color}) drop-shadow(0 0 40px ${color}88)` }}>
      <circle cx="95" cy="32" r="21" fill={color} stroke="none" />
      <line x1="95" y1="53" x2="93" y2="67" strokeWidth="13" />
      <line x1="93" y1="67" x2="96" y2="152" strokeWidth="30" />
      <line x1="78" y1="90" x2="46" y2="73" strokeWidth="14" />
      <line x1="46" y1="73" x2="30" y2="84" strokeWidth="12" />
      <line x1="116" y1="88" x2="150" y2="74" strokeWidth="14" />
      <line x1="150" y1="74" x2="166" y2="84" strokeWidth="12" />
      <line x1="80"  y1="152" x2="66"  y2="242" strokeWidth="23" />
      <line x1="66"  y1="242" x2="58"  y2="326" strokeWidth="21" />
      <line x1="58"  y1="326" x2="20"  y2="332" strokeWidth="15" />
      <line x1="100" y1="152" x2="154" y2="112" strokeWidth="23" />
      <line x1="154" y1="112" x2="205" y2="128" strokeWidth="21" />
      <line x1="205" y1="128" x2="226" y2="137" strokeWidth="15" />
      <circle cx="238" cy="150" r="18" strokeWidth="5" />
      <path d="M224 141 Q238 150 224 159" strokeWidth="2.5" />
      <path d="M252 141 Q238 150 252 159" strokeWidth="2.5" />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PremiumCard({
  variant, rating, cardType, firstName, lastName, team, position, number, className = '',
}: PremiumCardProps) {
  const cfg = VARIANTS[variant];

  const wrapRef  = useRef<HTMLDivElement>(null);
  const cardRef  = useRef<HTMLDivElement>(null);
  const holoRef  = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);
  const glowRef  = useRef<HTMLDivElement>(null);

  // ── Breathing glow ──────────────────────────────────────────────────────────
  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;

    gsap.to(glow, {
      opacity: 0.7,
      duration: 2.2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }, []);

  // ── Mouse tracking: 3D tilt + holographic shine ─────────────────────────────
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const wrap = wrapRef.current;
    const card = cardRef.current;
    const holo = holoRef.current;
    const shine = shineRef.current;
    if (!wrap || !card || !holo || !shine) return;

    const rect = wrap.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;   // -0.5 → 0.5
    const y = (e.clientY - rect.top)  / rect.height - 0.5;

    // 3D tilt
    gsap.to(card, {
      rotateY:  x * 28,
      rotateX: -y * 22,
      duration: 0.3,
      ease: 'power2.out',
    });

    // Holographic gradient angle
    const angle = Math.round((Math.atan2(y, x) * 180) / Math.PI) + 180;
    const px = ((x + 0.5) * 100).toFixed(1);
    const py = ((y + 0.5) * 100).toFixed(1);
    holo.style.background = `
      radial-gradient(circle at ${px}% ${py}%,
        rgba(${cfg.holoColors[0]}, 0.18) 0%,
        rgba(${cfg.holoColors[1]}, 0.12) 25%,
        rgba(${cfg.holoColors[2]}, 0.08) 50%,
        rgba(255,255,255,0.04) 75%,
        transparent 100%),
      linear-gradient(${angle}deg,
        rgba(${cfg.accentRGB}, 0.1) 0%,
        transparent 30%,
        rgba(${cfg.accentRGB2}, 0.08) 60%,
        transparent 100%)
    `;
    holo.style.opacity = '1';

    // Moving shine streak
    gsap.to(shine, {
      left: `${(x + 0.5) * 120 - 10}%`,
      top:  `${(y + 0.5) * 120 - 10}%`,
      opacity: 0.6,
      duration: 0.2,
    });
  }, [cfg]);

  const onMouseLeave = useCallback(() => {
    const card  = cardRef.current;
    const holo  = holoRef.current;
    const shine = shineRef.current;
    if (!card || !holo || !shine) return;

    gsap.to(card, { rotateY: 0, rotateX: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' });
    gsap.to(holo,  { opacity: 0, duration: 0.5 });
    gsap.to(shine, { opacity: 0, duration: 0.4 });
  }, []);

  const onMouseEnter = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    gsap.to(card, { scale: 1.03, duration: 0.3, ease: 'power2.out' });
  }, []);

  const onMouseLeaveOuter = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    gsap.to(card, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    onMouseLeave();
  }, [onMouseLeave]);

  return (
    <div
      ref={wrapRef}
      className={`relative select-none ${className}`}
      style={{ perspective: '1000px', perspectiveOrigin: '50% 50%' }}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeaveOuter}
    >
      {/* Outer breathing glow halo */}
      <div
        ref={glowRef}
        className="absolute -inset-6 rounded-[24px] pointer-events-none opacity-40"
        style={{
          background: `radial-gradient(ellipse 80% 80% at 50% 50%, rgba(${cfg.accentRGB}, 0.25) 0%, transparent 70%)`,
          filter: 'blur(20px)',
        }}
      />

      {/* Card body */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-[14px]"
        style={{
          width: '100%',
          aspectRatio: '2.5 / 3.5',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          background: cfg.bgGradient,
          boxShadow: cfg.shadowGlow,
        }}
      >
        {/* Spotlight from above */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: cfg.spotGrad }} />

        {/* Ground reflection */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: cfg.groundGrad }} />

        {/* Energy lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.18 }}>
          {cfg.energyLines.map((l, i) => (
            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke={cfg.accentHex} strokeWidth="1"
              style={{ animation: `energyLine ${1.8 + i * 0.4}s ease-in-out infinite alternate` }}
            />
          ))}
        </svg>

        {/* Particle dots */}
        {cfg.particles.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: p.x, top: p.y,
              width: p.size * 2, height: p.size * 2,
              background: cfg.accentHex2,
              boxShadow: `0 0 ${p.size * 4}px ${cfg.accentHex2}`,
              animation: `particlePulse ${1.4 + i * 0.2}s ease-in-out ${p.delay}s infinite`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}

        {/* Glowing border */}
        <div
          className="absolute inset-0 rounded-[14px] pointer-events-none"
          style={{
            border: `2px solid ${cfg.borderGlow}`,
            boxShadow: `inset 0 0 30px rgba(${cfg.accentRGB}, 0.12)`,
          }}
        />

        {/* Inner corner lights */}
        {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
          <div
            key={i}
            className={`absolute ${pos} w-8 h-8 pointer-events-none`}
            style={{
              background: `radial-gradient(circle at ${i % 2 === 0 ? '0% 0%' : '100% 0%'} , rgba(${cfg.accentRGB}, 0.5) 0%, transparent 70%)`,
              transform: i >= 2 ? 'scaleY(-1)' : undefined,
            }}
          />
        ))}

        {/* ── Top row: Rating + Type + Team ── */}
        <div className="absolute top-0 left-0 right-0 flex items-start justify-between px-3 pt-3 z-20">
          {/* Rating block */}
          <div>
            <div
              className="font-display leading-none"
              style={{
                fontSize: '3.2rem',
                fontWeight: 700,
                background: `linear-gradient(180deg, #fff 20%, ${cfg.accentHex2} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1,
                textShadow: 'none',
              }}
            >
              {rating}
            </div>
            <div
              className="text-[0.5rem] font-semibold tracking-[0.2em] mt-0.5"
              style={{ color: cfg.typeColor }}
            >
              {cardType}
            </div>
          </div>

          {/* Team symbol */}
          <div className="flex flex-col items-center gap-1">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
              style={{
                background: `rgba(${cfg.accentRGB}, 0.15)`,
                border: `1px solid rgba(${cfg.accentRGB}, 0.4)`,
                color: cfg.accentHex2,
                fontSize: '1.2rem',
              }}
            >
              {cfg.teamSymbol}
            </div>
            <span className="text-[0.45rem] font-bold tracking-wider" style={{ color: cfg.accentHex }}>
              {cfg.teamInitial}
            </span>
          </div>
        </div>

        {/* ── Player silhouette ── */}
        <div className="absolute inset-0 flex items-end justify-center pb-24 pointer-events-none z-10">
          <div className="w-[78%] h-[68%]">
            {variant === 'baseball'
              ? <BatterSilhouette color={cfg.accentHex2} />
              : <SoccerSilhouette color={cfg.accentHex2} />
            }
          </div>
        </div>

        {/* ── Bottom divider + info ── */}
        <div className="absolute bottom-0 left-0 right-0 z-20 px-3 pb-3">
          {/* Glowing divider */}
          <div className="w-full h-px mb-2" style={{
            background: `linear-gradient(90deg, transparent, rgba(${cfg.accentRGB}, 0.7), transparent)`,
          }} />

          <div className="flex items-end justify-between">
            <div>
              <p className="text-[0.55rem] font-medium tracking-[0.12em] uppercase" style={{ color: `rgba(${cfg.accentRGB}, 0.7)` }}>
                {firstName}
              </p>
              <p
                className="font-display font-bold leading-none"
                style={{
                  fontSize: '1.4rem',
                  background: `linear-gradient(180deg, #fff 30%, ${cfg.accentHex} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {lastName}
              </p>
              <p className="text-[0.5rem] mt-0.5 font-medium tracking-wider" style={{ color: `rgba(${cfg.accentRGB}, 0.55)` }}>
                {team}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[0.5rem] font-semibold tracking-widest" style={{ color: `rgba(${cfg.accentRGB}, 0.5)` }}>
                {position}
              </p>
              <p className="font-display text-lg font-bold" style={{ color: cfg.accentHex }}>
                {number}
              </p>
            </div>
          </div>

          {/* Signature line */}
          <svg className="w-full mt-1 opacity-40" height="16" viewBox="0 0 200 16">
            <path
              d={variant === 'baseball'
                ? 'M10 10 Q40 2 80 10 Q110 16 140 8 Q160 3 190 10'
                : 'M10 12 Q50 4 90 11 Q120 16 150 8 Q170 3 190 12'}
              stroke={cfg.accentHex}
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* ── Holographic overlay (mouse-driven) ── */}
        <div
          ref={holoRef}
          className="absolute inset-0 rounded-[14px] pointer-events-none opacity-0 transition-opacity duration-300"
          style={{ mixBlendMode: 'screen' }}
        />

        {/* ── Shine streak ── */}
        <div
          ref={shineRef}
          className="absolute pointer-events-none rounded-full opacity-0"
          style={{
            width: '40%',
            height: '40%',
            background: `radial-gradient(circle, rgba(${cfg.accentRGB2}, 0.25) 0%, transparent 70%)`,
            filter: 'blur(12px)',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </div>

      {/* Particle CSS keyframes - injected once */}
      <style>{`
        @keyframes particlePulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1);   opacity: 0.5; }
          50%       { transform: translate(-50%, -50%) scale(2.2); opacity: 1; }
        }
        @keyframes energyLine {
          0%   { opacity: 0.05; }
          100% { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}
