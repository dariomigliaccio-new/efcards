'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap, SplitText, ScrollTrigger } from '@/lib/gsap';
import { PremiumCard } from './PremiumCard';

// ─── Three.js particle canvas ─────────────────────────────────────────────────

function useParticleCanvas(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number;
    let THREE: typeof import('three') | null = null;
    let renderer: import('three').WebGLRenderer | null = null;
    let scene: import('three').Scene | null = null;
    let camera: import('three').PerspectiveCamera | null = null;
    let goldPts: import('three').Points | null = null;
    let bluePts: import('three').Points | null = null;
    let ambPts:  import('three').Points | null = null;

    async function init() {
      THREE = await import('three');

      scene    = new THREE.Scene();
      camera   = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
      camera.position.z = 6;

      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      renderer.setClearColor(0x000000, 0);

      // ── Particle factory ──────────────────────────────────────────────────
      function makeCloud(
        count: number,
        cx: number, cy: number,
        spread: number,
        color: number,
        size: number,
        sizeAtten: boolean,
      ) {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
          pos[i * 3]     = cx + (Math.random() - 0.5) * spread;
          pos[i * 3 + 1] = cy + (Math.random() - 0.5) * spread * 1.4;
          pos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
        }
        const geo  = new THREE!.BufferGeometry();
        geo.setAttribute('position', new THREE!.BufferAttribute(pos, 3));
        const mat  = new THREE!.PointsMaterial({
          color,
          size,
          sizeAttenuation: sizeAtten,
          transparent: true,
          opacity: 0,
          blending: THREE!.AdditiveBlending,
          depthWrite: false,
        });
        return new THREE!.Points(geo, mat);
      }

      goldPts = makeCloud(280, -2.2, 0, 2.8, 0xc9a96e, 0.025, true);
      bluePts = makeCloud(280,  2.2, 0, 2.8, 0x4ab8ff, 0.025, true);
      ambPts  = makeCloud(600,  0,   0, 9,   0xffffff, 0.012, true);

      scene.add(goldPts, bluePts, ambPts);

      // ── Fade in particles ─────────────────────────────────────────────────
      setTimeout(() => {
        gsap.to((goldPts!.material as import('three').PointsMaterial), { opacity: 0.75, duration: 2, ease: 'power2.out' });
        gsap.to((bluePts!.material as import('three').PointsMaterial), { opacity: 0.75, duration: 2, ease: 'power2.out' });
        gsap.to((ambPts!.material  as import('three').PointsMaterial), { opacity: 0.3,  duration: 2.5, ease: 'power2.out' });
      }, 800);

      // ── Animation loop ────────────────────────────────────────────────────
      let t = 0;
      function animate() {
        animId = requestAnimationFrame(animate);
        t += 0.004;

        if (goldPts) {
          goldPts.rotation.y = t * 0.12;
          goldPts.rotation.x = Math.sin(t * 0.18) * 0.08;
        }
        if (bluePts) {
          bluePts.rotation.y = -t * 0.12;
          bluePts.rotation.x = Math.sin(t * 0.18 + 1) * 0.08;
        }
        if (ambPts) {
          ambPts.rotation.y = t * 0.03;
        }

        renderer!.render(scene!, camera!);
      }
      animate();

      // ── Resize ────────────────────────────────────────────────────────────
      function onResize() {
        if (!canvas || !camera || !renderer) return;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      }
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }

    init();

    return () => {
      cancelAnimationFrame(animId);
      renderer?.dispose();
    };
  }, [canvasRef]);
}

// ─── Match animation section ──────────────────────────────────────────────────

function MatchSection() {
  const ref   = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const lineRef = useRef<SVGLineElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    ScrollTrigger.create({
      trigger: el,
      start: 'top 65%',
      once: true,
      onEnter: () => {
        // Cards fly in
        const cards = el.querySelectorAll('.match-card');
        gsap.fromTo(cards,
          { opacity: 0, x: (i) => (i === 0 ? -120 : 120), scale: 0.8, filter: 'blur(16px)' },
          { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)', duration: 1.2, stagger: 0.15, ease: 'power3.out' }
        );

        // Line drawing
        if (lineRef.current) {
          gsap.fromTo(lineRef.current,
            { strokeDashoffset: 400 },
            { strokeDashoffset: 0, duration: 1.5, delay: 0.8, ease: 'power2.out' }
          );
        }

        // Count up
        if (pctRef.current) {
          gsap.fromTo({ val: 0 }, { val: 94 },
            { duration: 2, delay: 1, ease: 'power2.out',
              onUpdate: function() { if (pctRef.current) pctRef.current.textContent = `${Math.round(this.targets()[0].val)}%`; }
            }
          );
        }
      },
    });
  }, []);

  return (
    <div ref={ref} className="py-32 px-6 max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <p className="label mb-4">Trade Engine</p>
        <h2 className="section-title mb-4">Perfect Match.</h2>
        <p className="text-sm text-dim max-w-sm mx-auto">Our algorithm finds the ideal trade partner in milliseconds.</p>
      </div>

      <div className="relative flex items-center justify-center gap-6 md:gap-16">
        {/* Card A */}
        <div className="match-card w-32 md:w-44" style={{ opacity: 0 }}>
          <div className="aspect-[2.5/3.5] rounded-xl border-2 overflow-hidden relative"
            style={{ borderColor: 'rgba(201,169,110,0.6)', background: 'linear-gradient(160deg, #120a00, #0a0500)', boxShadow: '0 0 30px rgba(201,169,110,0.3)' }}>
            <div className="absolute inset-0 flex items-center justify-center p-3">
              <div className="text-center">
                <div className="font-display text-4xl font-bold" style={{ color: '#c9a96e' }}>99</div>
                <div className="text-[0.5rem] tracking-widest mt-1" style={{ color: 'rgba(201,169,110,0.7)' }}>LEGEND</div>
                <div className="font-display text-sm font-bold mt-2 text-white/90">JUDGE</div>
                <div className="text-[0.45rem] tracking-wider mt-0.5" style={{ color: 'rgba(201,169,110,0.5)' }}>RF · #99</div>
              </div>
            </div>
          </div>
          <p className="text-center text-[0.6rem] text-dim mt-2 tracking-wider">@marco_collects</p>
        </div>

        {/* Connection animation */}
        <div className="flex flex-col items-center gap-3 flex-shrink-0">
          <div className="relative w-24 md:w-40 h-px">
            <svg className="absolute inset-0 w-full h-8 -top-4" viewBox="0 0 160 8" preserveAspectRatio="none">
              <line ref={lineRef} x1="0" y1="4" x2="160" y2="4"
                stroke="url(#matchGrad)" strokeWidth="2"
                strokeDasharray="400" strokeDashoffset="400"
                strokeLinecap="round" />
              <defs>
                <linearGradient id="matchGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#c9a96e" />
                  <stop offset="50%"  stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#4ab8ff" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="text-center">
            <span
              ref={pctRef}
              className="font-display text-3xl md:text-5xl font-bold"
              style={{ background: 'linear-gradient(135deg, #c9a96e, #fff, #4ab8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >0%</span>
            <p className="text-[0.55rem] text-dim tracking-widest mt-1">COMPATIBILITY</p>
          </div>
        </div>

        {/* Card B */}
        <div className="match-card w-32 md:w-44" style={{ opacity: 0 }}>
          <div className="aspect-[2.5/3.5] rounded-xl border-2 overflow-hidden relative"
            style={{ borderColor: 'rgba(74,184,255,0.6)', background: 'linear-gradient(160deg, #000510, #000d20)', boxShadow: '0 0 30px rgba(74,184,255,0.3)' }}>
            <div className="absolute inset-0 flex items-center justify-center p-3">
              <div className="text-center">
                <div className="font-display text-4xl font-bold" style={{ color: '#4ab8ff' }}>94</div>
                <div className="text-[0.5rem] tracking-widest mt-1" style={{ color: 'rgba(74,184,255,0.7)' }}>ICON</div>
                <div className="font-display text-sm font-bold mt-2 text-white/90">MESSI</div>
                <div className="text-[0.45rem] tracking-wider mt-0.5" style={{ color: 'rgba(74,184,255,0.5)' }}>RW · #10</div>
              </div>
            </div>
          </div>
          <p className="text-center text-[0.6rem] text-dim mt-2 tracking-wider">@carlos_stickers</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Hero ────────────────────────────────────────────────────────────────

export function CinematicHero() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef   = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const btnsRef    = useRef<HTMLDivElement>(null);
  const card1Ref   = useRef<HTMLDivElement>(null);
  const card2Ref   = useRef<HTMLDivElement>(null);
  const scrollRef  = useRef<HTMLDivElement>(null);

  // Three.js particles
  useParticleCanvas(canvasRef);

  useEffect(() => {
    // Wait a tick for DOM
    const raf = requestAnimationFrame(() => {
      const tl = gsap.timeline();

      // ── 0s: start black ──────────────────────────────────────────────────
      // (cards start opacity:0 via inline style)

      // ── 2s: baseball card ────────────────────────────────────────────────
      if (card1Ref.current) {
        tl.fromTo(card1Ref.current,
          { opacity: 0, scale: 0.78, filter: 'blur(28px)', rotateY: -20 },
          { opacity: 1, scale: 1,    filter: 'blur(0px)',  rotateY: 0,
            duration: 1.8, ease: 'power3.out' },
          2
        );
      }

      // ── 3s: soccer card ──────────────────────────────────────────────────
      if (card2Ref.current) {
        tl.fromTo(card2Ref.current,
          { opacity: 0, scale: 0.78, filter: 'blur(28px)', rotateY: 20 },
          { opacity: 1, scale: 1,    filter: 'blur(0px)',  rotateY: 0,
            duration: 1.8, ease: 'power3.out' },
          3
        );
      }

      // ── 4s: title, letter by letter with SplitText ───────────────────────
      const titleEl = titleRef.current;
      if (titleEl) {
        tl.call(() => {
          try {
            const split = new SplitText(titleEl, { type: 'chars' });
            gsap.fromTo(split.chars,
              { opacity: 0, y: 60, filter: 'blur(12px)', rotateX: -45 },
              {
                opacity: 1, y: 0, filter: 'blur(0px)', rotateX: 0,
                duration: 0.6, stagger: 0.04, ease: 'power3.out',
                transformOrigin: '50% 50% -20px',
              }
            );
          } catch {
            // fallback: fade in whole title
            gsap.fromTo(titleEl,
              { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }
            );
          }
        }, [], 4);
      }

      // ── 4.8s: subtitle ───────────────────────────────────────────────────
      if (subtitleRef.current) {
        tl.fromTo(subtitleRef.current,
          { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, ease: 'power2.out' },
          4.8
        );
      }

      // ── 5.2s: buttons ────────────────────────────────────────────────────
      if (btnsRef.current) {
        tl.fromTo(btnsRef.current,
          { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power2.out' },
          5.2
        );
      }

      // ── 5.6s: scroll hint ────────────────────────────────────────────────
      if (scrollRef.current) {
        tl.fromTo(scrollRef.current, { opacity: 0 }, { opacity: 1, duration: 0.8 }, 5.6);
      }

      // ── Floating: cards breath after entrance ────────────────────────────
      if (card1Ref.current) {
        gsap.to(card1Ref.current, {
          y: '-=18', rotation: 1.5,
          duration: 5, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 4,
        });
      }
      if (card2Ref.current) {
        gsap.to(card2Ref.current, {
          y: '+=18', rotation: -1.5,
          duration: 5.5, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 4.5,
        });
      }

      // ── Scroll: cards separate ────────────────────────────────────────────
      const section = sectionRef.current;
      if (section && card1Ref.current && card2Ref.current) {
        ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.2,
          onUpdate: (self) => {
            const prog = self.progress;
            if (card1Ref.current) gsap.set(card1Ref.current, { x: -prog * 80, rotateZ: prog * -3, opacity: 1 - prog * 0.4 });
            if (card2Ref.current) gsap.set(card2Ref.current, { x: prog * 80,  rotateZ: prog * 3,  opacity: 1 - prog * 0.4 });
          },
        });
      }
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#04040a' }}
    >
      {/* Three.js particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      />

      {/* Cinematic vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1,
        background: 'radial-gradient(ellipse 85% 75% at 50% 50%, transparent 30%, rgba(4,4,10,0.85) 100%)' }} />

      {/* Center top mist */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-64 pointer-events-none" style={{ zIndex: 1,
        background: 'radial-gradient(ellipse 100% 100% at 50% 0%, rgba(255,255,255,0.025) 0%, transparent 70%)' }} />

      {/* ── Cards row ── */}
      <div className="relative w-full max-w-5xl mx-auto px-4 flex flex-col items-center justify-center" style={{ zIndex: 5 }}>

        {/* Title above cards */}
        <div className="text-center mb-12 md:mb-14">
          <h1
            ref={titleRef}
            className="hero-title"
            style={{ perspective: '600px', transformStyle: 'preserve-3d' }}
          >
            <span className="italic text-[#f0ede8]">Trade.</span>
            {' '}
            <span style={{ color: '#c9a96e' }}>Bid.</span>
            {' '}
            <span className="text-[#f0ede8]">Collect.</span>
          </h1>
        </div>

        {/* Two cards */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-10 md:gap-16 w-full">

          {/* Baseball card */}
          <div
            ref={card1Ref}
            className="w-[200px] sm:w-[230px] md:w-[260px] lg:w-[290px] flex-shrink-0"
            style={{ opacity: 0 }}
          >
            <PremiumCard
              variant="baseball"
              rating={99}
              cardType="LEGEND"
              firstName="AARON"
              lastName="JUDGE"
              team="New York Yankees"
              position="RF"
              number="#99"
            />
          </div>

          {/* Center: subtitle + buttons */}
          <div className="flex flex-col items-center gap-6 text-center flex-shrink-0 max-w-[220px] sm:max-w-xs">
            <p
              ref={subtitleRef}
              className="text-sm font-light leading-relaxed"
              style={{ color: 'rgba(240,237,232,0.42)', opacity: 0 }}
            >
              The premium marketplace for sports cards &amp; stickers.
            </p>
            <div ref={btnsRef} className="flex flex-col gap-3 w-full" style={{ opacity: 0 }}>
              <Link href="/marketplace"
                className="btn btn-primary text-xs py-3.5 w-full">
                Explore Cards
              </Link>
              <Link href="/auctions"
                className="btn btn-ghost text-xs py-3.5 w-full">
                Live Auctions
              </Link>
            </div>
          </div>

          {/* Soccer card */}
          <div
            ref={card2Ref}
            className="w-[200px] sm:w-[230px] md:w-[260px] lg:w-[290px] flex-shrink-0"
            style={{ opacity: 0 }}
          >
            <PremiumCard
              variant="soccer"
              rating={94}
              cardType="ICON"
              firstName="LIONEL"
              lastName="MESSI"
              team="FC Barcelona"
              position="RW"
              number="#10"
            />
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-8 md:gap-16 mt-14 flex-wrap justify-center">
          {[
            { v: '180K+', l: 'Cards' },
            { v: '42K',   l: 'Collectors' },
            { v: '$2.8M', l: 'Traded' },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <p className="font-display text-xl font-medium" style={{ color: '#c9a96e' }}>{s.v}</p>
              <p className="text-[0.6rem] tracking-widest uppercase" style={{ color: 'rgba(240,237,232,0.3)' }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll hint */}
      <div ref={scrollRef} className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ zIndex: 5, opacity: 0 }}>
        <span className="label text-[0.55rem]" style={{ color: 'rgba(240,237,232,0.22)' }}>Scroll</span>
        <div className="w-px h-8" style={{ background: 'linear-gradient(to bottom, rgba(201,169,110,0.4), transparent)' }} />
      </div>
    </section>
  );
}

// ─── Export match section too ─────────────────────────────────────────────────
export { MatchSection };
