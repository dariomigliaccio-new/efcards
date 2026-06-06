'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap, ScrollTrigger, fadeInUp } from '@/lib/gsap';
import { FeaturedCards } from '@/components/home/FeaturedCards';
import { Stats } from '@/components/home/Stats';

// ─── Baseball Batter SVG ──────────────────────────────────────────────────────

function BaseballBatter({ className = '' }: { className?: string }) {
  const wrapRef  = useRef<SVGSVGElement>(null);
  const armsRef  = useRef<SVGGElement>(null);
  const batRef   = useRef<SVGLineElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    // Entrance: rise from below + un-blur
    gsap.fromTo(el,
      { opacity: 0, y: 60, filter: 'blur(10px)' },
      { opacity: 1, y: 0,  filter: 'blur(0px)', duration: 2, delay: 0.6, ease: 'power3.out' }
    );

    // Arms follow-through oscillation
    gsap.to(armsRef.current, {
      rotate: 4,
      transformOrigin: '120px 88px',
      duration: 1.8,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    // Bat slight angle shift
    gsap.to(batRef.current, {
      rotate: -3,
      transformOrigin: '135px 82px',
      duration: 2.2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    // Subtle whole-body weight shift
    gsap.to(el, {
      y: '-=8',
      duration: 3.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 2,
    });
  }, []);

  const C = '#c9a96e'; // gold

  return (
    <svg
      ref={wrapRef}
      viewBox="0 0 240 385"
      fill="none"
      stroke={C}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ opacity: 0 }}
    >
      {/* Head */}
      <circle cx="118" cy="37" r="23" fill={C} stroke="none" />
      {/* Helmet brim (back, batter faces right) */}
      <path d="M97 30 Q78 22 70 34 Q67 44 78 48 L96 44" fill={C} stroke="none" />

      {/* Neck */}
      <line x1="118" y1="60" x2="116" y2="74" strokeWidth="14" />

      {/* ── Arms + bat group (animated) ── */}
      <g ref={armsRef}>
        {/* Right upper arm */}
        <line x1="130" y1="88" x2="168" y2="68" strokeWidth="16" />
        {/* Right forearm */}
        <line x1="168" y1="68" x2="200" y2="56" strokeWidth="13" />
        {/* Left upper arm */}
        <line x1="106" y1="90" x2="74"  y2="96" strokeWidth="16" />
        {/* Left forearm */}
        <line x1="74"  y1="96" x2="52"  y2="106" strokeWidth="13" />
        {/* Bat (left hand → right hand diagonal) */}
        <line ref={batRef} x1="50" y1="108" x2="204" y2="54" strokeWidth="9" />
      </g>

      {/* Torso */}
      <line x1="116" y1="74" x2="126" y2="160" strokeWidth="32" />

      {/* Left thigh (front leg, stride toward pitcher) */}
      <line x1="112" y1="160" x2="88"  y2="248" strokeWidth="24" />
      {/* Left shin */}
      <line x1="88"  y1="248" x2="74"  y2="328" strokeWidth="22" />
      {/* Left foot */}
      <line x1="74"  y1="328" x2="36"  y2="334" strokeWidth="16" />

      {/* Right thigh (back leg, weight shifting) */}
      <line x1="138" y1="158" x2="164" y2="248" strokeWidth="24" />
      {/* Right shin */}
      <line x1="164" y1="248" x2="174" y2="328" strokeWidth="22" />
      {/* Right foot */}
      <line x1="174" y1="328" x2="214" y2="336" strokeWidth="16" />
    </svg>
  );
}

// ─── Soccer Player SVG ────────────────────────────────────────────────────────

function SoccerPlayer({ className = '' }: { className?: string }) {
  const wrapRef = useRef<SVGSVGElement>(null);
  const kickRef = useRef<SVGGElement>(null);
  const bodyRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    // Entrance
    gsap.fromTo(el,
      { opacity: 0, y: 60, filter: 'blur(10px)' },
      { opacity: 1, y: 0,  filter: 'blur(0px)', duration: 2, delay: 0.9, ease: 'power3.out' }
    );

    // Kicking leg oscillation
    gsap.to(kickRef.current, {
      rotate: -14,
      transformOrigin: '100px 152px',
      duration: 0.85,
      repeat: -1,
      yoyo: true,
      ease: 'power2.inOut',
    });

    // Body lean (slight arch from kick)
    gsap.to(bodyRef.current, {
      rotate: 3,
      transformOrigin: '96px 108px',
      duration: 0.85,
      repeat: -1,
      yoyo: true,
      ease: 'power2.inOut',
    });

    // Float
    gsap.to(el, {
      y: '-=8',
      duration: 3.8,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 2.2,
    });
  }, []);

  const C = '#a8c8e0'; // cool silver-blue

  return (
    <svg
      ref={wrapRef}
      viewBox="0 0 250 390"
      fill="none"
      stroke={C}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ opacity: 0 }}
    >
      {/* Head */}
      <circle cx="95" cy="32" r="21" fill={C} stroke="none" />

      {/* Neck */}
      <line x1="95" y1="53" x2="93" y2="67" strokeWidth="13" />

      {/* Body group (slight lean-back animated) */}
      <g ref={bodyRef}>
        {/* Torso */}
        <line x1="93" y1="67" x2="96" y2="152" strokeWidth="30" />

        {/* Left arm (raised for balance) */}
        <line x1="78" y1="90" x2="46" y2="73" strokeWidth="14" />
        <line x1="46" y1="73" x2="30" y2="84" strokeWidth="12" />

        {/* Right arm (back) */}
        <line x1="116" y1="88" x2="150" y2="74" strokeWidth="14" />
        <line x1="150" y1="74" x2="166" y2="84" strokeWidth="12" />
      </g>

      {/* Standing left leg */}
      <line x1="80"  y1="152" x2="66"  y2="242" strokeWidth="23" />
      <line x1="66"  y1="242" x2="58"  y2="326" strokeWidth="21" />
      <line x1="58"  y1="326" x2="20"  y2="332" strokeWidth="15" />

      {/* Kicking right leg group (animated) */}
      <g ref={kickRef}>
        {/* Thigh (raises up-right) */}
        <line x1="100" y1="152" x2="154" y2="112" strokeWidth="23" />
        {/* Shin (knee bends, extends right) */}
        <line x1="154" y1="112" x2="205" y2="128" strokeWidth="21" />
        {/* Boot */}
        <line x1="205" y1="128" x2="226" y2="137" strokeWidth="15" />
      </g>

      {/* Ball (near kicking foot) */}
      <circle cx="238" cy="150" r="18" strokeWidth="5" />
      {/* Ball pentagon lines */}
      <path d="M224 141 Q238 150 224 159" strokeWidth="2.5" />
      <path d="M252 141 Q238 150 252 159" strokeWidth="2.5" />
      <line x1="238" y1="132" x2="238" y2="138" strokeWidth="2.5" />
    </svg>
  );
}

// ─── Floating card (hero background) ─────────────────────────────────────────

const FLOAT_CARDS = [
  { rarity: 'legendary' as const, name: 'Lionel Messi',     sub: 'Panini WC 2022',   pos: { top: '24%', left: '18%' },  rotate: '-7deg',  delay: 0.5 },
  { rarity: 'ultra_rare' as const, name: 'LeBron James',   sub: 'Topps Chrome RC',   pos: { top: '20%', right: '18%' }, rotate: '8deg',   delay: 0.9 },
];

function FloatingCard({ card }: { card: (typeof FLOAT_CARDS)[number] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.fromTo(el,
      { opacity: 0, scale: 0.8, filter: 'blur(20px)', y: 20 },
      { opacity: 0.55, scale: 1, filter: 'blur(0px)', y: 0, duration: 2.4, delay: card.delay, ease: 'power3.out' }
    );

    gsap.to(el, {
      y: '-=12',
      rotation: `+=${Math.random() > 0.5 ? 2 : -2}`,
      duration: 5 + Math.random() * 2,
      repeat: -1, yoyo: true,
      ease: 'sine.inOut',
      delay: card.delay + 2.5,
    });
  }, [card.delay]);

  const glowColor = card.rarity === 'legendary' ? 'rgba(201,169,110,0.15)' : 'rgba(139,92,246,0.12)';

  return (
    <div
      ref={ref}
      className="absolute w-[110px] md:w-[140px] lg:w-[160px] pointer-events-none select-none"
      style={{ ...card.pos, transform: `rotate(${card.rotate})` }}
    >
      <div
        className={`sport-card rarity-${card.rarity} aspect-[2.5/3.5] w-full`}
        style={{ boxShadow: `0 20px 60px rgba(0,0,0,0.7), 0 0 30px ${glowColor}` }}
      >
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(38,28,18,1) 0%, rgba(14,11,8,1) 65%)' }} />
        <div className="absolute inset-0 opacity-25" style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,215,100,0.15) 50%, transparent 60%)', backgroundSize: '200% 200%', animation: 'holographic 6s linear infinite' }} />
        <div className="card-info">
          <p className="text-[0.5rem] uppercase tracking-widest text-gold/50 mb-0.5">{card.sub}</p>
          <p className="font-display text-xs font-medium text-white/90">{card.name}</p>
        </div>
        <div className="absolute top-2 right-2">
          <span className={`badge badge-${card.rarity}`}>{card.rarity === 'legendary' ? 'Legend' : 'Ultra'}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const titleRef    = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const btnsRef     = useRef<HTMLDivElement>(null);
  const scrollRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.3 });

    const words = titleRef.current?.querySelectorAll('.hero-word');
    if (words?.length) {
      tl.fromTo(words,
        { opacity: 0, y: 50, filter: 'blur(14px)' },
        { opacity: 1, y: 0,  filter: 'blur(0px)', stagger: 0.2, duration: 1.5, ease: 'power3.out' },
        1.5
      );
    }
    if (subtitleRef.current) {
      tl.fromTo(subtitleRef.current,
        { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }, '-=0.4'
      );
    }
    if (btnsRef.current) {
      tl.fromTo(btnsRef.current,
        { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' }, '-=0.5'
      );
    }
    if (scrollRef.current) {
      tl.fromTo(scrollRef.current, { opacity: 0 }, { opacity: 1, duration: 0.8 }, '-=0.3');
    }
  }, []);

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="relative h-screen flex flex-col items-center justify-center overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse 100% 80% at 50% 110%, #161c30 0%, #08090f 55%)',
        }}
      >
        {/* Star-field dots */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          opacity: 0.4,
        }} />

        {/* Left atmospheric glow (gold) */}
        <div className="absolute left-0 top-0 bottom-0 w-1/3 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 80% 60% at 0% 70%, rgba(201,169,110,0.07) 0%, transparent 70%)',
        }} />

        {/* Right atmospheric glow (blue) */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 80% 60% at 100% 70%, rgba(100,160,220,0.07) 0%, transparent 70%)',
        }} />

        {/* ── BASEBALL BATTER (left) ── */}
        <BaseballBatter
          className="absolute bottom-0 left-[2%] md:left-[4%] w-[18vw] max-w-[260px] min-w-[120px]"
        />

        {/* ── SOCCER PLAYER (right, kick mirrored toward center) ── */}
        <div
          className="absolute bottom-0 right-[2%] md:right-[4%] w-[20vw] max-w-[280px] min-w-[130px]"
          style={{ transform: 'scaleX(-1)' }}
        >
          <SoccerPlayer className="w-full h-full" />
        </div>

        {/* Floating historic cards */}
        {FLOAT_CARDS.map((card, i) => (
          <FloatingCard key={i} card={card} />
        ))}

        {/* Hero text */}
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <div ref={titleRef} className="hero-title mb-6 leading-none tracking-tight">
            <span className="hero-word inline-block mr-4 italic" style={{ color: '#f0ede8' }}>Trade.</span>
            <span className="hero-word inline-block mr-4" style={{ color: '#c9a96e' }}>Bid.</span>
            <span className="hero-word inline-block" style={{ color: '#f0ede8' }}>Collect.</span>
          </div>

          <p
            ref={subtitleRef}
            className="text-sm md:text-base mb-10 font-light tracking-wide max-w-sm mx-auto"
            style={{ color: 'rgba(240,237,232,0.45)' }}
          >
            The modern marketplace for stickers and sports cards.
          </p>

          <div ref={btnsRef} className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/marketplace" className="btn btn-primary text-sm px-8 py-3.5">
              Explore Marketplace
            </Link>
            <Link href="/auctions" className="btn btn-ghost text-sm px-8 py-3.5">
              Live Auctions
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          ref={scrollRef}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-0"
        >
          <span className="label text-[0.6rem]" style={{ color: 'rgba(240,237,232,0.25)' }}>Scroll</span>
          <div className="w-px h-8" style={{ background: 'linear-gradient(to bottom, rgba(201,169,110,0.3), transparent)' }} />
        </div>
      </section>

      {/* ── FEATURED CARDS — light cream ────────────────────────────────── */}
      <div className="section-light">
        <FeaturedCards />
      </div>

      {/* ── HOW IT WORKS — light cream ──────────────────────────────────── */}
      <div className="section-light border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
        <section className="py-32 px-6 max-w-6xl mx-auto">
          <HowItWorks />
        </section>
      </div>

      {/* ── STATS — back to dark ─────────────────────────────────────────── */}
      <Stats />

      {/* ── CTA — light cream ────────────────────────────────────────────── */}
      <div className="section-light border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
        <section className="py-40 px-6 flex flex-col items-center text-center">
          <CTASection />
        </section>
      </div>
    </>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    ScrollTrigger.create({
      trigger: el, start: 'top 75%', once: true,
      onEnter: () => {
        gsap.fromTo(el.querySelectorAll('.how-item'),
          { opacity: 0, y: 40, filter: 'blur(8px)' },
          { opacity: 1, y: 0,  filter: 'blur(0px)', stagger: 0.15, duration: 1, ease: 'power3.out' }
        );
      },
    });
  }, []);

  const steps = [
    { n: '01', title: 'Build your collection',  body: 'Add cards you have, need, or have as duplicates. Build your digital stash in seconds.' },
    { n: '02', title: 'Discover your matches',  body: 'Our algorithm finds collectors with perfect compatibility — trade without friction.' },
    { n: '03', title: 'Buy, sell & bid',         body: 'List for a fixed price, accept offers, or run auctions for your rarest pieces.' },
  ];

  return (
    <div ref={ref}>
      <div className="mb-20 max-w-lg">
        <p className="label mb-4">How it works</p>
        <h2 className="section-title">Built for serious collectors.</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-16">
        {steps.map((s) => (
          <div key={s.n} className="how-item">
            <span className="font-display text-5xl mb-5 block" style={{ color: 'rgba(154,112,48,0.25)' }}>{s.n}</span>
            <h3 className="font-display text-xl mb-3 font-medium">{s.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(28,24,20,0.55)' }}>{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CTA ──────────────────────────────────────────────────────────────────────

function CTASection() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    ScrollTrigger.create({
      trigger: el, start: 'top 80%', once: true,
      onEnter: () => fadeInUp(el, 0, 1.2),
    });
  }, []);

  return (
    <div ref={ref} className="max-w-xl opacity-0">
      <p className="label mb-6">Join CardMatch</p>
      <h2 className="section-title mb-8">
        Your collection<br />
        <em className="not-italic" style={{ color: '#9a7030' }}>deserves more.</em>
      </h2>
      <p className="text-sm mb-10 leading-relaxed" style={{ color: 'rgba(28,24,20,0.55)' }}>
        Thousands of collectors are already trading, bidding, and building their dream collections.
      </p>
      <Link
        href="/register"
        className="inline-flex items-center gap-2 px-10 py-4 text-sm font-medium rounded-lg transition-all"
        style={{ background: '#1c1814', color: '#f5f1ea', letterSpacing: '0.04em' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#9a7030')}
        onMouseLeave={e => (e.currentTarget.style.background = '#1c1814')}
      >
        Create Free Account
      </Link>
    </div>
  );
}
