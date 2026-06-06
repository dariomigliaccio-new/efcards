'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import api from '@/lib/api';
import type { TradeMatch } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import toast from 'react-hot-toast';

function MatchCard({ match, onTrade }: { match: TradeMatch; onTrade: (m: TradeMatch) => void }) {
  const ref  = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!barRef.current) return;
    gsap.fromTo(barRef.current,
      { width: '0%' },
      { width: `${match.compatibility}%`, duration: 1.4, ease: 'power3.out', delay: 0.3 }
    );
  }, [match.compatibility]);

  const color =
    match.compatibility >= 80 ? '#c9a96e' :
    match.compatibility >= 50 ? '#60a5fa' : 'rgba(255,255,255,0.3)';

  return (
    <div
      ref={ref}
      className="bg-elevated border border-subtle rounded-2xl p-6 flex flex-col gap-4 hover:border-[rgba(255,255,255,0.12)] transition-colors duration-300"
    >
      {/* User info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.06)] flex items-center justify-center text-sm font-medium text-dim shrink-0">
          {match.user?.display_name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{match.user?.display_name || match.user?.username}</p>
          <p className="text-[0.7rem] text-dim">
            @{match.user?.username} · {match.user?.total_trades} trades · ⭐ {match.user?.rating?.toFixed(1) || '—'}
          </p>
        </div>
        {match.compatibility >= 80 && (
          <span className="ml-auto badge" style={{ background: 'rgba(201,169,110,0.12)', color: '#c9a96e', border: '1px solid rgba(201,169,110,0.3)' }}>
            Hot match
          </span>
        )}
      </div>

      {/* Compatibility bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[0.65rem] uppercase tracking-wider text-dim">Compatibility</p>
          <p className="text-sm font-medium" style={{ color }}>{match.compatibility}%</p>
        </div>
        <div className="h-1 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
          <div ref={barRef} className="h-full rounded-full" style={{ background: color, width: 0 }} />
        </div>
      </div>

      {/* Card counts */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-[rgba(255,255,255,0.03)] rounded-xl p-3">
          <p className="text-[0.6rem] uppercase tracking-wider text-dim mb-1">You can offer</p>
          <p className="font-display text-xl text-gold">{match.cards_i_can_offer.length}</p>
          <p className="text-[0.65rem] text-dim">cards they need</p>
        </div>
        <div className="bg-[rgba(255,255,255,0.03)] rounded-xl p-3">
          <p className="text-[0.6rem] uppercase tracking-wider text-dim mb-1">They can offer</p>
          <p className="font-display text-xl text-gold">{match.cards_they_can_offer.length}</p>
          <p className="text-[0.65rem] text-dim">cards you need</p>
        </div>
      </div>

      {/* Actions */}
      <button
        onClick={() => onTrade(match)}
        className="btn btn-primary w-full text-xs py-3 mt-auto"
      >
        Propose Trade
      </button>
    </div>
  );
}

export default function TradesPage() {
  const headRef   = useRef<HTMLDivElement>(null);
  const gridRef   = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated } = useAuth();

  const [matches, setMatches] = useState<TradeMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState<'matches' | 'active' | 'history'>('matches');

  useEffect(() => {
    gsap.fromTo(headRef.current?.children ?? [],
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, stagger: 0.08, duration: 0.8, ease: 'power3.out', delay: 0.1 }
    );
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    api.get('/trades/matches')
      .then(({ data }) => setMatches(data.matches))
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  function handleTrade(match: TradeMatch) {
    toast('Trade proposal UI coming soon');
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <p className="font-display text-3xl mb-4">Find your perfect trade.</p>
        <p className="text-sm text-dim mb-8 max-w-xs">Sign in to discover collectors with cards you need.</p>
        <Link href="/login" className="btn btn-primary px-8 py-3.5 text-sm">Sign in to trade</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div ref={headRef} className="mb-12">
          <p className="label mb-3">Trade Matches</p>
          <h1 className="section-title mb-2">Your perfect trades,<br />discovered automatically.</h1>
          <p className="text-sm text-dim">Based on what you have and what you need.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-10 bg-[rgba(255,255,255,0.03)] p-1 rounded-xl w-fit">
          {(['matches', 'active', 'history'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-xs font-medium capitalize transition-all duration-200 ${
                tab === t ? 'bg-elevated text-[#f0ede8]' : 'text-dim hover:text-[#f0ede8]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Matches grid */}
        {tab === 'matches' && (
          loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 rounded-2xl bg-[rgba(255,255,255,0.03)] animate-pulse" />
              ))}
            </div>
          ) : matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <p className="font-display text-2xl text-dim mb-3">No matches yet</p>
              <p className="text-sm text-faint mb-6">Add cards to your collection to find trades</p>
              <Link href="/collection" className="btn btn-outline text-xs px-6 py-3">Add cards</Link>
            </div>
          ) : (
            <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((m) => (
                <MatchCard key={m.user_id} match={m} onTrade={handleTrade} />
              ))}
            </div>
          )
        )}

        {tab === 'active' && (
          <ActiveTrades />
        )}

        {tab === 'history' && (
          <TradeHistory />
        )}
      </div>
    </div>
  );
}

function ActiveTrades() {
  const [trades, setTrades] = useState<unknown[]>([]);
  useEffect(() => {
    api.get('/trades', { params: { status: 'pending,accepted' } })
      .then(({ data }) => setTrades(data.trades))
      .catch(() => {});
  }, []);

  if (!trades.length) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="font-display text-2xl text-dim">No active trades</p>
      </div>
    );
  }
  return <div className="text-dim text-sm">{trades.length} active trades (detail view coming soon)</div>;
}

function TradeHistory() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <p className="font-display text-2xl text-dim">Trade history</p>
      <p className="text-sm text-faint mt-2">Your completed trades will appear here</p>
    </div>
  );
}
