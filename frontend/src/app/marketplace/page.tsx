'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { Card3D } from '@/components/ui/Card3D';
import api from '@/lib/api';
import type { Listing } from '@/types';

const SPORTS   = ['All', 'soccer', 'baseball', 'basketball', 'football'];
const RARITIES = ['All', 'legendary', 'ultra_rare', 'rare', 'uncommon', 'common'];
const SORTS    = [
  { value: 'newest',    label: 'Newest' },
  { value: 'price_asc', label: 'Price ↑' },
  { value: 'price_desc',label: 'Price ↓' },
  { value: 'popular',   label: 'Popular' },
];

export default function MarketplacePage() {
  const headRef  = useRef<HTMLDivElement>(null);
  const gridRef  = useRef<HTMLDivElement>(null);

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [sport,    setSport]    = useState('All');
  const [rarity,   setRarity]   = useState('All');
  const [sort,     setSort]     = useState('newest');
  const [q,        setQ]        = useState('');
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);

  useEffect(() => {
    const el = headRef.current;
    if (!el) return;
    gsap.fromTo(el.children,
      { opacity: 0, y: 20, filter: 'blur(6px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', stagger: 0.08, duration: 0.8, ease: 'power3.out', delay: 0.1 }
    );
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params: Record<string, string | number> = { page, limit: 24, sort };
        if (sport  !== 'All') params.sport  = sport;
        if (rarity !== 'All') params.rarity = rarity;
        if (q)                params.q      = q;

        const { data } = await api.get('/listings', { params });
        setListings(data.listings);
        setTotal(data.total);

        if (gridRef.current) {
          const cards = gridRef.current.querySelectorAll('.card-wrapper');
          gsap.fromTo(cards,
            { opacity: 0, y: 30, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, stagger: 0.05, duration: 0.7, ease: 'power2.out' }
          );
        }
      } catch (_) {
        // API might not be running locally; show empty state
        setListings([]);
      }
      setLoading(false);
    }
    load();
  }, [sport, rarity, sort, q, page]);

  return (
    <div className="min-h-screen pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div ref={headRef} className="mb-12">
          <p className="label mb-3">Marketplace</p>
          <h1 className="section-title mb-2">Find your next card.</h1>
          <p className="text-sm text-dim">{total.toLocaleString()} listings available</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-10 pb-6 border-b border-subtle">
          {/* Search */}
          <div className="relative">
            <input
              className="input-base w-48 text-xs pl-8"
              placeholder="Search player…"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
            />
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Sport pills */}
          <div className="flex gap-1 flex-wrap">
            {SPORTS.map((s) => (
              <button
                key={s}
                onClick={() => { setSport(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-[0.7rem] font-medium tracking-wide transition-all duration-200 ${
                  sport === s
                    ? 'bg-gold text-[#080808]'
                    : 'bg-[rgba(255,255,255,0.04)] text-dim border border-subtle hover:border-border-md'
                }`}
              >
                {s === 'All' ? 'All sports' : s}
              </button>
            ))}
          </div>

          {/* Rarity */}
          <select
            className="input-base w-auto text-xs py-2"
            value={rarity}
            onChange={(e) => { setRarity(e.target.value); setPage(1); }}
          >
            {RARITIES.map((r) => (
              <option key={r} value={r} className="bg-[#141414]">
                {r === 'All' ? 'All rarities' : r.replace('_', ' ')}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            className="input-base w-auto text-xs py-2 ml-auto"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value} className="bg-[#141414]">{s.label}</option>
            ))}
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2.5/3.5] rounded-xl bg-[rgba(255,255,255,0.03)] animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="font-display text-2xl text-dim mb-3">No cards found</p>
            <p className="text-sm text-faint">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {listings.map((l) => (
                <div key={l.id} className="card-wrapper">
                  <Card3D
                    id={l.id}
                    playerName={l.player_name}
                    team={l.team}
                    sport={l.sport}
                    rarity={l.rarity}
                    imageUrl={l.image_url}
                    year={l.year}
                    collectionName={l.collection_name}
                    price={l.price}
                    href={`/marketplace/${l.id}`}
                    showPrice
                  />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {total > 24 && (
              <div className="flex items-center justify-center gap-4 mt-16">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-ghost text-xs px-5 py-2.5 disabled:opacity-30"
                >
                  Previous
                </button>
                <span className="text-xs text-dim">
                  Page {page} of {Math.ceil(total / 24)}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(total / 24)}
                  className="btn btn-ghost text-xs px-5 py-2.5 disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
