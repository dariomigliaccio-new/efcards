'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap, ScrollTrigger, fadeInUp } from '@/lib/gsap';
import { CinematicHero, MatchSection } from '@/components/hero/CinematicHero';
import { FeaturedCards } from '@/components/home/FeaturedCards';
import { Stats } from '@/components/home/Stats';

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
        className="inline-flex items-center gap-2 px-10 py-4 text-sm font-medium rounded-lg transition-all duration-300"
        style={{ background: '#1c1814', color: '#f5f1ea', letterSpacing: '0.04em' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#9a7030')}
        onMouseLeave={e => (e.currentTarget.style.background = '#1c1814')}
      >
        Create Free Account
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <>
      {/* Cinematic hero — dark, full screen, Three.js particles + premium cards */}
      <CinematicHero />

      {/* Match animation section — dark continuation */}
      <div style={{ background: '#04040a' }}>
        <MatchSection />
      </div>

      {/* Featured cards — cream section */}
      <div className="section-light">
        <FeaturedCards />
      </div>

      {/* How it works — cream */}
      <div className="section-light border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
        <section className="py-32 px-6 max-w-6xl mx-auto">
          <HowItWorks />
        </section>
      </div>

      {/* Stats — dark */}
      <Stats />

      {/* CTA — cream */}
      <div className="section-light border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
        <section className="py-40 px-6 flex flex-col items-center text-center">
          <CTASection />
        </section>
      </div>
    </>
  );
}
