'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap, ScrollTrigger, fadeInUp } from '@/lib/gsap';
import { FeaturedCards } from '@/components/home/FeaturedCards';
import { Stats } from '@/components/home/Stats';

const HERO_CARDS = [
  {
    id: 1,
    name:     'Lionel Messi',
    subtitle: '2022 Panini WC Rookie',
    rarity:   'legendary',
    image:    '/cards/messi.jpg',
    style:    { top: '18%', left: '8%',  rotate: '-8deg' },
    delay:    0.4,
  },
  {
    id: 2,
    name:     'Michael Jordan',
    subtitle: '1986 Fleer RC #57',
    rarity:   'legendary',
    image:    '/cards/jordan.jpg',
    style:    { top: '12%', right: '6%', rotate: '7deg' },
    delay:    0.7,
  },
  {
    id: 3,
    name:     'Kobe Bryant',
    subtitle: '1996 Topps Chrome RC',
    rarity:   'ultra_rare',
    image:    '/cards/kobe.jpg',
    style:    { bottom: '22%', left: '4%', rotate: '5deg' },
    delay:    1.0,
  },
  {
    id: 4,
    name:     'Babe Ruth',
    subtitle: '1933 Goudey #53',
    rarity:   'legendary',
    image:    '/cards/ruth.jpg',
    style:    { bottom: '18%', right: '5%', rotate: '-6deg' },
    delay:    1.2,
  },
];

function FloatingCard({
  card,
}: {
  card: (typeof HERO_CARDS)[number];
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Entrance from darkness
    gsap.fromTo(el,
      { opacity: 0, scale: 0.8, filter: 'blur(24px)', y: 30 },
      {
        opacity:  0.85,
        scale:    1,
        filter:   'blur(0px)',
        y:        0,
        duration: 2.2,
        delay:    card.delay,
        ease:     'power3.out',
      }
    );

    // Infinite float loop
    gsap.to(el, {
      y:        '-=14',
      rotation: `+=${Math.random() > 0.5 ? 2 : -2}`,
      duration: 5 + Math.random() * 2,
      repeat:   -1,
      yoyo:     true,
      ease:     'sine.inOut',
      delay:    card.delay + 2,
    });

    // Parallax on scroll
    ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const depth = card.id % 2 === 0 ? -60 : 60;
        gsap.to(el, {
          y:        self.progress * depth,
          duration: 0.5,
          ease:     'none',
          overwrite: 'auto',
        });
      },
    });
  }, [card.delay, card.id]);

  return (
    <div
      ref={ref}
      className="absolute w-[140px] md:w-[180px] lg:w-[200px] pointer-events-none select-none"
      style={{ ...card.style, transform: `rotate(${card.style.rotate})` }}
    >
      {/* Card body */}
      <div
        className={`sport-card rarity-${card.rarity} aspect-[2.5/3.5] w-full shadow-2xl`}
        style={{ boxShadow: card.rarity === 'legendary' ? '0 20px 80px rgba(0,0,0,0.8), 0 0 40px rgba(201,169,110,0.15)' : '0 20px 60px rgba(0,0,0,0.7)' }}
      >
        {/* Placeholder gradient when no image */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(160deg,
              rgba(40,30,20,1) 0%,
              rgba(15,12,8,1) 60%,
              rgba(30,22,12,1) 100%)`
          }}
        />

        {/* Holographic sheen */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,215,100,0.15) 50%, transparent 60%)',
            backgroundSize: '200% 200%',
            animation: 'holographic 6s linear infinite',
          }}
        />

        {/* Glow ring for legendary */}
        {card.rarity === 'legendary' && (
          <div className="card-glow absolute inset-[-1px] rounded-[12px] opacity-60" />
        )}

        {/* Card info */}
        <div className="card-info">
          <p className="text-[0.55rem] uppercase tracking-widest text-gold/60 mb-0.5">{card.subtitle}</p>
          <p className="font-display text-sm font-medium text-white/90">{card.name}</p>
        </div>

        {/* Rarity pip */}
        <div className="absolute top-2.5 right-2.5">
          <span className={`badge badge-${card.rarity}`}>
            {card.rarity === 'legendary' ? 'Legend' : card.rarity === 'ultra_rare' ? 'Ultra' : card.rarity}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const heroRef       = useRef<HTMLElement>(null);
  const titleRef      = useRef<HTMLDivElement>(null);
  const subtitleRef   = useRef<HTMLParagraphElement>(null);
  const buttonsRef    = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.2 });

    // Background vignette
    if (heroRef.current) {
      gsap.fromTo(heroRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 1.5, ease: 'power2.out' }
      );
    }

    // Title words appear one by one
    const words = titleRef.current?.querySelectorAll('.hero-word');
    if (words?.length) {
      tl.fromTo(words,
        { opacity: 0, y: 40, filter: 'blur(12px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', stagger: 0.18, duration: 1.4, ease: 'power3.out' },
        1.8
      );
    }

    // Subtitle
    if (subtitleRef.current) {
      tl.fromTo(subtitleRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, ease: 'power2.out' },
        '-=0.3'
      );
    }

    // Buttons
    if (buttonsRef.current) {
      tl.fromTo(buttonsRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
        '-=0.4'
      );
    }

    // Scroll hint
    if (scrollHintRef.current) {
      tl.fromTo(scrollHintRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.8 },
        '-=0.2'
      );
    }
  }, []);

  return (
    <>
      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative h-screen flex flex-col items-center justify-center overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 60%, rgba(30,20,10,0.6) 0%, #080808 70%)',
        }}
      >
        {/* Ambient radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(201,169,110,0.04) 0%, transparent 70%)',
          }}
        />

        {/* Floating historic cards */}
        {HERO_CARDS.map((card) => (
          <FloatingCard key={card.id} card={card} />
        ))}

        {/* Hero text */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div ref={titleRef} className="hero-title mb-6 leading-none tracking-tight">
            <span className="hero-word inline-block mr-4 italic text-[#f0ede8]">Trade.</span>
            <span className="hero-word inline-block mr-4 text-gold">Bid.</span>
            <span className="hero-word inline-block text-[#f0ede8]">Collect.</span>
          </div>

          <p
            ref={subtitleRef}
            className="text-sm md:text-base text-[rgba(240,237,232,0.45)] mb-10 font-light tracking-wide max-w-md mx-auto"
          >
            The modern marketplace for stickers and sports cards.
          </p>

          <div ref={buttonsRef} className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/collection" className="btn btn-primary text-sm px-8 py-3.5">
              Start Collecting
            </Link>
            <Link href="/marketplace" className="btn btn-ghost text-sm px-8 py-3.5">
              Explore Marketplace
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          ref={scrollHintRef}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-0"
        >
          <span className="label text-[0.6rem]">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-[rgba(240,237,232,0.3)] to-transparent" />
        </div>
      </section>

      {/* ── FEATURED CARDS ──────────────────────────────────────────────── */}
      <FeaturedCards />

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section className="py-32 px-6 max-w-6xl mx-auto">
        <HowItWorks />
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <Stats />

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-40 px-6 flex flex-col items-center text-center">
        <CTASection />
      </section>
    </>
  );
}

function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    ScrollTrigger.create({
      trigger: el,
      start: 'top 75%',
      once: true,
      onEnter: () => {
        const items = el.querySelectorAll('.how-item');
        gsap.fromTo(items,
          { opacity: 0, y: 40, filter: 'blur(8px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', stagger: 0.15, duration: 1, ease: 'power3.out' }
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
        {steps.map((s) => (
          <div key={s.n} className="how-item">
            <span className="font-display text-5xl text-gold/20 mb-4 block">{s.n}</span>
            <h3 className="font-display text-xl mb-3 font-medium">{s.title}</h3>
            <p className="text-sm text-dim leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CTASection() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 80%',
      once: true,
      onEnter: () => fadeInUp(el, 0, 1.2),
    });
  }, []);

  return (
    <div ref={ref} className="max-w-xl opacity-0">
      <p className="label mb-6">Join CardMatch</p>
      <h2 className="section-title mb-8">
        Your collection<br />
        <em className="text-gold not-italic">deserves more.</em>
      </h2>
      <p className="text-sm text-dim mb-10 leading-relaxed">
        Thousands of collectors are already trading, bidding, and building their dream collections.
      </p>
      <Link href="/register" className="btn btn-primary px-10 py-4 text-sm">
        Create Free Account
      </Link>
    </div>
  );
}
