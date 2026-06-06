'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import Link from 'next/link';
import api from '@/lib/api';

interface Collection {
  id: string;
  name: string;
  sport: string;
  year: number;
  manufacturer: string;
  total_cards: number;
  image_url?: string;
}

const SPORT_GRADIENT: Record<string, string> = {
  soccer:     'linear-gradient(135deg, rgba(30,80,50,0.8) 0%, rgba(10,30,15,1) 100%)',
  basketball: 'linear-gradient(135deg, rgba(80,40,10,0.8) 0%, rgba(30,10,5,1) 100%)',
  baseball:   'linear-gradient(135deg, rgba(20,40,80,0.8) 0%, rgba(5,10,30,1) 100%)',
  football:   'linear-gradient(135deg, rgba(50,20,10,0.8) 0%, rgba(20,5,5,1) 100%)',
  default:    'linear-gradient(135deg, rgba(30,25,15,0.8) 0%, rgba(10,8,5,1) 100%)',
};

const SPORT_ACCENT: Record<string, string> = {
  soccer:     '#4caf7a',
  basketball: '#f97316',
  baseball:   '#60a5fa',
  football:   '#ef4444',
  default:    '#c9a96e',
};

export default function CollectionsPage() {
  const headRef = useRef<HTMLHeadingElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [sport, setSport] = useState('All');

  const SPORTS = ['All', 'soccer', 'basketball', 'baseball', 'football'];

  useEffect(() => {
    const el = headRef.current;
    if (!el) return;
    gsap.fromTo(el,
      { opacity: 0, y: 24, filter: 'blur(8px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, ease: 'power3.out', delay: 0.1 }
    );
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (sport !== 'All') params.sport = sport;
        const { data } = await api.get('/collections', { params });
        setCollections(data.collections || []);

        if (gridRef.current) {
          const cards = gridRef.current.querySelectorAll('.col-card');
          gsap.fromTo(cards,
            { opacity: 0, y: 40, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, stagger: 0.07, duration: 0.8, ease: 'power3.out' }
          );
        }
      } catch (_) {
        setCollections([]);
      }
      setLoading(false);
    }
    load();
  }, [sport]);

  return (
    <div className="min-h-screen pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-12">
          <p className="label mb-3">Browse</p>
          <h1 ref={headRef} className="section-title mb-6">
            All Collections
          </h1>
          <p className="text-dim text-sm max-w-lg mb-8">
            Explore every series. Track what you have, what you need, and find traders who complete your set.
          </p>

          <div className="flex gap-2 flex-wrap">
            {SPORTS.map((s) => (
              <button
                key={s}
                onClick={() => setSport(s)}
                className={`px-4 py-2 rounded-full text-[0.7rem] font-medium transition-all duration-200 ${
                  sport === s
                    ? 'bg-gold text-[#080808]'
                    : 'bg-[rgba(255,255,255,0.04)] text-dim border border-subtle hover:border-[rgba(255,255,255,0.12)]'
                }`}
              >
                {s === 'All' ? 'All sports' : s}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-[rgba(255,255,255,0.03)] animate-pulse" style={{ height: 220 }} />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="font-display text-3xl text-dim mb-3">No collections found</p>
          </div>
        ) : (
          <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((col) => {
              const accent = SPORT_ACCENT[col.sport] || SPORT_ACCENT.default;
              const bg     = SPORT_GRADIENT[col.sport] || SPORT_GRADIENT.default;

              return (
                <Link
                  key={col.id}
                  href={`/collection/${col.id}`}
                  className="col-card group relative rounded-2xl overflow-hidden border border-subtle transition-all duration-300 hover:border-[rgba(255,255,255,0.14)] hover:-translate-y-1"
                  style={{ background: bg, minHeight: 220 }}
                >
                  {/* Glow on hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                    style={{ boxShadow: `inset 0 0 40px ${accent}22` }}
                  />

                  <div className="relative z-10 p-6 flex flex-col h-full" style={{ minHeight: 220 }}>
                    {/* Sport chip */}
                    <div className="flex items-center justify-between mb-auto">
                      <span
                        className="px-3 py-1 rounded-full text-[0.6rem] font-semibold uppercase tracking-widest"
                        style={{ background: `${accent}22`, color: accent, border: `1px solid ${accent}44` }}
                      >
                        {col.sport}
                      </span>
                      <span className="text-[0.6rem] text-dim font-mono">{col.year}</span>
                    </div>

                    {/* Name */}
                    <div className="mt-8">
                      <p className="text-[0.55rem] uppercase tracking-widest text-white/30 mb-1">{col.manufacturer}</p>
                      <h2 className="font-display text-xl font-medium text-white/95 leading-snug group-hover:text-white transition-colors">
                        {col.name}
                      </h2>
                    </div>

                    {/* Footer */}
                    <div className="flex items-end justify-between mt-4 pt-4 border-t border-white/5">
                      <div>
                        <p className="text-[0.55rem] uppercase tracking-wider text-white/25 mb-0.5">Cards in set</p>
                        <p className="text-lg font-display" style={{ color: accent }}>{col.total_cards}</p>
                      </div>
                      <span className="text-[0.65rem] text-white/30 group-hover:text-white/60 transition-colors">
                        View set →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
