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
// The source image (1448×1086) has Judge on the left half and Messi on the right.
// backgroundSize:'200% auto' renders the image at 2× card width.
// backgroundPosition '0% top' = left half (Judge), '100% top' = right half (Messi).

const VARIANTS = {
  baseball: {
    accentHex:   '#c9a96e',
    accentHex2:  '#f5c842',
    accentRGB:   '201, 169, 110',
    accentRGB2:  '245, 200, 66',
    // Image crop: left half = Aaron Judge
    imgPosition: '0% top',
    // Dark tint layers to keep text readable while showing photo underneath
    topOverlay:  'linear-gradient(to bottom, rgba(8,4,0,0.72) 0%, rgba(8,4,0,0.2) 35%, transparent 60%)',
    botOverlay:  'linear-gradient(to top, rgba(8,4,0,0.95) 0%, rgba(8,4,0,0.6) 35%, transparent 65%)',
    // Accent color overlays
    spotGrad:    'radial-gradient(ellipse 60% 50% at 50% 20%, rgba(255,190,60,0.14) 0%, transparent 70%)',
    borderGlow:  'rgba(201,169,110,0.8)',
    shadowGlow:  '0 0 50px rgba(201,169,110,0.45), 0 0 100px rgba(201,169,110,0.2), 0 30px 80px rgba(0,0,0,0.8)',
    typeColor:   '#f5c842',
    holoColors:  ['255,180,0', '255,120,0', '200,80,0'],
    teamSymbol:  '⚾',
    teamInitial: 'NY',
    energyLines: [
      { x1: '8%',  y1: '90%', x2: '32%', y2: '20%' },
      { x1: '70%', y1: '85%', x2: '90%', y2: '30%' },
      { x1: '18%', y1: '72%', x2: '42%', y2: '42%' },
      { x1: '78%', y1: '68%', x2: '58%', y2: '48%' },
    ],
    particles: [
      { x: '12%', y: '28%', size: 3,   delay: 0    },
      { x: '85%', y: '24%', size: 2.5, delay: 0.4  },
      { x: '8%',  y: '52%', size: 2,   delay: 0.8  },
      { x: '90%', y: '48%', size: 3,   delay: 1.2  },
      { x: '28%', y: '16%', size: 1.5, delay: 0.6  },
      { x: '72%', y: '14%', size: 2,   delay: 1.0  },
      { x: '50%', y: '10%', size: 1,   delay: 0.2  },
      { x: '20%', y: '40%', size: 1.5, delay: 1.4  },
      { x: '80%', y: '60%', size: 2,   delay: 0.9  },
    ],
  },
  soccer: {
    accentHex:   '#4ab8ff',
    accentHex2:  '#00e5ff',
    accentRGB:   '74, 184, 255',
    accentRGB2:  '0, 229, 255',
    // Image crop: right half = Lionel Messi
    imgPosition: '100% top',
    topOverlay:  'linear-gradient(to bottom, rgba(0,4,14,0.72) 0%, rgba(0,4,14,0.2) 35%, transparent 60%)',
    botOverlay:  'linear-gradient(to top, rgba(0,4,14,0.95) 0%, rgba(0,4,14,0.6) 35%, transparent 65%)',
    spotGrad:    'radial-gradient(ellipse 60% 50% at 50% 20%, rgba(0,140,255,0.18) 0%, transparent 70%)',
    borderGlow:  'rgba(74,184,255,0.85)',
    shadowGlow:  '0 0 50px rgba(74,184,255,0.5), 0 0 100px rgba(0,100,255,0.25), 0 30px 80px rgba(0,0,0,0.8)',
    typeColor:   '#00e5ff',
    holoColors:  ['0,200,255', '0,100,255', '80,0,255'],
    teamSymbol:  '⚽',
    teamInitial: 'FCB',
    energyLines: [
      { x1: '5%',  y1: '88%', x2: '30%', y2: '18%' },
      { x1: '72%', y1: '83%', x2: '94%', y2: '26%' },
      { x1: '15%', y1: '68%', x2: '40%', y2: '40%' },
      { x1: '80%', y1: '72%', x2: '60%', y2: '44%' },
    ],
    particles: [
      { x: '10%', y: '26%', size: 3,   delay: 0    },
      { x: '88%', y: '22%', size: 2.5, delay: 0.3  },
      { x: '6%',  y: '50%', size: 2,   delay: 0.7  },
      { x: '92%', y: '46%', size: 3,   delay: 1.1  },
      { x: '26%', y: '14%', size: 1.5, delay: 0.5  },
      { x: '74%', y: '12%', size: 2,   delay: 0.9  },
      { x: '50%', y: '8%',  size: 1.5, delay: 0.15 },
      { x: '22%', y: '38%', size: 1,   delay: 1.3  },
      { x: '82%', y: '56%', size: 2,   delay: 0.8  },
      { x: '62%', y: '30%', size: 1.5, delay: 1.6  },
    ],
  },
} as const;

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

  // Breathing glow
  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;
    gsap.to(glow, { opacity: 0.75, duration: 2.2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  }, []);

  // Mouse tracking: 3D tilt + holographic shine
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const wrap  = wrapRef.current;
    const card  = cardRef.current;
    const holo  = holoRef.current;
    const shine = shineRef.current;
    if (!wrap || !card || !holo || !shine) return;

    const rect = wrap.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;

    gsap.to(card, { rotateY: x * 28, rotateX: -y * 22, duration: 0.3, ease: 'power2.out' });

    const angle = Math.round((Math.atan2(y, x) * 180) / Math.PI) + 180;
    const px = ((x + 0.5) * 100).toFixed(1);
    const py = ((y + 0.5) * 100).toFixed(1);
    holo.style.background = `
      radial-gradient(circle at ${px}% ${py}%,
        rgba(${cfg.holoColors[0]}, 0.22) 0%,
        rgba(${cfg.holoColors[1]}, 0.14) 30%,
        rgba(${cfg.holoColors[2]}, 0.08) 60%,
        transparent 100%),
      linear-gradient(${angle}deg,
        rgba(${cfg.accentRGB}, 0.12) 0%,
        transparent 35%,
        rgba(${cfg.accentRGB2}, 0.10) 65%,
        transparent 100%)
    `;
    holo.style.opacity = '1';

    gsap.to(shine, {
      left: `${(x + 0.5) * 120 - 10}%`,
      top:  `${(y + 0.5) * 120 - 10}%`,
      opacity: 0.65,
      duration: 0.2,
    });
  }, [cfg]);

  const onMouseLeave = useCallback(() => {
    const card  = cardRef.current;
    const holo  = holoRef.current;
    const shine = shineRef.current;
    if (!card || !holo || !shine) return;
    gsap.to(card,  { rotateY: 0, rotateX: 0, scale: 1, duration: 0.9, ease: 'elastic.out(1,0.4)' });
    gsap.to(holo,  { opacity: 0, duration: 0.5 });
    gsap.to(shine, { opacity: 0, duration: 0.4 });
  }, []);

  const onMouseEnter = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    gsap.to(card, { scale: 1.04, duration: 0.3, ease: 'power2.out' });
  }, []);

  return (
    <div
      ref={wrapRef}
      className={`relative select-none ${className}`}
      style={{ perspective: '1000px', perspectiveOrigin: '50% 50%' }}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Outer breathing glow halo */}
      <div
        ref={glowRef}
        className="absolute -inset-6 rounded-[24px] pointer-events-none opacity-35"
        style={{
          background: `radial-gradient(ellipse 85% 85% at 50% 50%, rgba(${cfg.accentRGB}, 0.3) 0%, transparent 65%)`,
          filter: 'blur(22px)',
        }}
      />

      {/* Card body */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-[16px]"
        style={{
          width: '100%',
          aspectRatio: '2.5 / 3.5',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          boxShadow: cfg.shadowGlow,
          // ── Player photo as card background ──────────────────────────────
          backgroundImage: 'url(/players.png)',
          backgroundSize: '200% auto',
          backgroundPosition: cfg.imgPosition,
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Top text-readability gradient */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: cfg.topOverlay, zIndex: 2 }} />

        {/* Bottom text-readability gradient */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: cfg.botOverlay, zIndex: 2 }} />

        {/* Accent color spotlight */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: cfg.spotGrad, zIndex: 3 }} />

        {/* Energy lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 4, opacity: 0.22 }}>
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
              boxShadow: `0 0 ${p.size * 5}px ${p.size * 2}px ${cfg.accentHex2}88`,
              animation: `particlePulse ${1.4 + i * 0.2}s ease-in-out ${p.delay}s infinite`,
              transform: 'translate(-50%, -50%)',
              zIndex: 5,
            }}
          />
        ))}

        {/* Glowing border frame */}
        <div
          className="absolute inset-0 rounded-[16px] pointer-events-none"
          style={{
            border: `2px solid ${cfg.borderGlow}`,
            boxShadow: `inset 0 0 40px rgba(${cfg.accentRGB}, 0.15)`,
            zIndex: 6,
          }}
        />

        {/* Corner accent lights */}
        {[
          { cls: 'top-0 left-0',     origin: '0% 0%' },
          { cls: 'top-0 right-0',    origin: '100% 0%' },
          { cls: 'bottom-0 left-0',  origin: '0% 100%' },
          { cls: 'bottom-0 right-0', origin: '100% 100%' },
        ].map((c, i) => (
          <div key={i} className={`absolute ${c.cls} w-10 h-10 pointer-events-none`} style={{
            background: `radial-gradient(circle at ${c.origin}, rgba(${cfg.accentRGB}, 0.6) 0%, transparent 70%)`,
            zIndex: 7,
          }} />
        ))}

        {/* ── TOP ROW: Rating + Badge + Team ── */}
        <div className="absolute top-0 left-0 right-0 flex items-start justify-between px-3 pt-3" style={{ zIndex: 10 }}>
          <div>
            <div
              className="font-display leading-none"
              style={{
                fontSize: '3rem',
                fontWeight: 700,
                background: `linear-gradient(170deg, #ffffff 20%, ${cfg.accentHex2} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none',
                lineHeight: 1,
                filter: `drop-shadow(0 0 8px rgba(${cfg.accentRGB},0.9))`,
              }}
            >
              {rating}
            </div>
            <div className="text-[0.48rem] font-bold tracking-[0.22em] mt-0.5"
              style={{ color: cfg.typeColor, textShadow: `0 0 10px ${cfg.typeColor}` }}>
              {cardType}
            </div>
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-base"
              style={{
                background: `rgba(${cfg.accentRGB}, 0.18)`,
                border: `1px solid rgba(${cfg.accentRGB}, 0.5)`,
                backdropFilter: 'blur(4px)',
              }}
            >
              {cfg.teamSymbol}
            </div>
            <span className="text-[0.42rem] font-bold tracking-wider" style={{ color: cfg.accentHex }}>
              {cfg.teamInitial}
            </span>
          </div>
        </div>

        {/* ── BOTTOM INFO ── */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3" style={{ zIndex: 10 }}>
          {/* Glowing divider */}
          <div className="w-full h-px mb-2" style={{
            background: `linear-gradient(90deg, transparent, rgba(${cfg.accentRGB}, 0.8), transparent)`,
          }} />

          <div className="flex items-end justify-between">
            <div>
              <p className="text-[0.52rem] font-semibold tracking-[0.14em] uppercase"
                style={{ color: `rgba(${cfg.accentRGB}, 0.8)` }}>
                {firstName}
              </p>
              <p className="font-display font-bold leading-none"
                style={{
                  fontSize: '1.5rem',
                  background: `linear-gradient(170deg, #ffffff 30%, ${cfg.accentHex} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: `drop-shadow(0 0 6px rgba(${cfg.accentRGB},0.7))`,
                }}>
                {lastName}
              </p>
              <p className="text-[0.48rem] mt-0.5 font-medium tracking-wider"
                style={{ color: `rgba(${cfg.accentRGB}, 0.6)` }}>
                {team}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[0.46rem] font-semibold tracking-widest"
                style={{ color: `rgba(${cfg.accentRGB}, 0.55)` }}>
                {position}
              </p>
              <p className="font-display text-xl font-bold" style={{ color: cfg.accentHex }}>
                {number}
              </p>
            </div>
          </div>

          {/* Signature SVG */}
          <svg className="w-full mt-1 opacity-50" height="14" viewBox="0 0 200 14">
            <path
              d={variant === 'baseball'
                ? 'M8 10 Q42 2 82 9 Q112 14 142 7 Q162 2 192 9'
                : 'M8 11 Q50 3 90 10 Q120 14 152 7 Q172 2 192 11'}
              stroke={cfg.accentHex}
              strokeWidth="1.5" fill="none" strokeLinecap="round"
            />
          </svg>
        </div>

        {/* ── Holographic overlay (mouse-driven) ── */}
        <div
          ref={holoRef}
          className="absolute inset-0 rounded-[16px] pointer-events-none opacity-0"
          style={{ mixBlendMode: 'screen', zIndex: 8 }}
        />

        {/* ── Moving shine streak ── */}
        <div
          ref={shineRef}
          className="absolute pointer-events-none rounded-full opacity-0"
          style={{
            width: '45%', height: '45%',
            background: `radial-gradient(circle, rgba(${cfg.accentRGB2}, 0.3) 0%, transparent 70%)`,
            filter: 'blur(16px)',
            transform: 'translate(-50%, -50%)',
            zIndex: 9,
          }}
        />
      </div>

      {/* Injected keyframes */}
      <style>{`
        @keyframes particlePulse {
          0%,100% { transform:translate(-50%,-50%) scale(1);   opacity:0.45; }
          50%      { transform:translate(-50%,-50%) scale(2.5); opacity:1; }
        }
        @keyframes energyLine {
          0%   { opacity:0.04; }
          100% { opacity:0.4; }
        }
      `}</style>
    </div>
  );
}
