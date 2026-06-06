'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import api from '@/lib/api';
import type { Card, UserCardStatus } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import toast from 'react-hot-toast';

type StatusFilter = 'all' | UserCardStatus;

const STATUS_LABELS: Record<UserCardStatus, { label: string; color: string }> = {
  have:      { label: 'Have',      color: '#4caf7d' },
  need:      { label: 'Need',      color: '#c9a96e' },
  duplicate: { label: 'Duplicate', color: '#60a5fa' },
};

function CollectionCardItem({ card, onStatusChange }: {
  card: Card & { status?: UserCardStatus };
  onStatusChange: (cardId: string, status: UserCardStatus | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  async function setStatus(s: UserCardStatus) {
    if (card.status === s) {
      await api.delete(`/cards/${card.id}/collect`, { params: { status: s } });
      onStatusChange(card.id, null);
      toast('Removed from collection');
    } else {
      await api.post(`/cards/${card.id}/collect`, { status: s });
      onStatusChange(card.id, s);
    }
  }

  return (
    <div
      ref={ref}
      className="bg-elevated border border-subtle rounded-xl overflow-hidden group hover:border-[rgba(255,255,255,0.12)] transition-colors duration-300"
    >
      {/* Card visual */}
      <div className="aspect-[2.5/3.5] relative bg-[rgba(255,255,255,0.02)]">
        {card.image_url ? (
          <img src={card.image_url} alt={card.player_name || ''} className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-display text-xl text-[rgba(255,255,255,0.1)]">{card.card_number}</p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-[0.6rem] text-gold/60 uppercase tracking-wider truncate">{card.collection_name}</p>
          <p className="text-xs font-medium text-white/90 truncate">{card.player_name}</p>
        </div>
        <span className={`absolute top-2 right-2 badge badge-${card.rarity}`}>
          {card.rarity === 'ultra_rare' ? 'Ultra' : card.rarity === 'legendary' ? 'Legend' : card.rarity}
        </span>
      </div>

      {/* Status buttons */}
      <div className="p-3 flex gap-1">
        {(Object.entries(STATUS_LABELS) as [UserCardStatus, { label: string; color: string }][]).map(([s, meta]) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className="flex-1 py-1.5 rounded-lg text-[0.6rem] font-medium uppercase tracking-wide transition-all duration-200"
            style={{
              background: card.status === s ? `${meta.color}22` : 'rgba(255,255,255,0.03)',
              color:       card.status === s ? meta.color : 'rgba(255,255,255,0.3)',
              border:      `1px solid ${card.status === s ? `${meta.color}44` : 'transparent'}`,
            }}
          >
            {meta.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CollectionPage() {
  const headRef   = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated } = useAuth();

  const [cards,      setCards]      = useState<(Card & { status?: UserCardStatus })[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [q,          setQ]          = useState('');

  useEffect(() => {
    gsap.fromTo(headRef.current?.children ?? [],
      { opacity: 0, y: 20 }, { opacity: 1, y: 0, stagger: 0.08, duration: 0.7, ease: 'power3.out', delay: 0.1 }
    );
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    setLoading(true);

    const params: Record<string, string> = {};
    if (statusFilter !== 'all') params.status = statusFilter;
    if (q) params.q = q;

    api.get(`/users/${user.id}/collection`, { params })
      .then(({ data }) => setCards(data.cards))
      .catch(() => setCards([]))
      .finally(() => setLoading(false));
  }, [user, isAuthenticated, statusFilter, q]);

  function handleStatusChange(cardId: string, status: UserCardStatus | null) {
    setCards((prev) =>
      status === null
        ? prev.filter((c) => !(c.id === cardId))
        : prev.map((c) => c.id === cardId ? { ...c, status } : c)
    );
  }

  const counts = {
    have:      cards.filter((c) => c.status === 'have').length,
    need:      cards.filter((c) => c.status === 'need').length,
    duplicate: cards.filter((c) => c.status === 'duplicate').length,
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <p className="font-display text-3xl mb-4">Your collection awaits.</p>
        <p className="text-sm text-dim mb-8 max-w-xs">Sign in to start tracking your stickers and cards.</p>
        <Link href="/login" className="btn btn-primary px-8 py-3.5 text-sm">Get started</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div ref={headRef} className="mb-10">
          <p className="label mb-3">My Collection</p>
          <h1 className="section-title mb-6">Your cards.</h1>

          {/* Stats */}
          <div className="flex gap-6 mb-8">
            {(Object.entries(counts) as [UserCardStatus, number][]).map(([s, n]) => (
              <div key={s}>
                <p className="font-display text-2xl" style={{ color: STATUS_LABELS[s].color }}>{n}</p>
                <p className="label text-[0.6rem]">{STATUS_LABELS[s].label}</p>
              </div>
            ))}
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap gap-3 items-center">
            <input
              className="input-base w-40 text-xs py-2"
              placeholder="Search player…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <div className="flex gap-1">
              {(['all', 'have', 'need', 'duplicate'] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-4 py-2 rounded-full text-[0.7rem] font-medium capitalize transition-all duration-200 ${
                    statusFilter === s
                      ? 'bg-gold text-[#080808]'
                      : 'bg-[rgba(255,255,255,0.04)] text-dim border border-subtle'
                  }`}
                >
                  {s === 'all' ? 'All' : STATUS_LABELS[s as UserCardStatus].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="aspect-[2.5/3.5] rounded-xl bg-[rgba(255,255,255,0.03)] animate-pulse" />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="font-display text-2xl text-dim mb-3">No cards yet</p>
            <p className="text-sm text-faint mb-6">Browse the marketplace and add cards to your collection</p>
            <Link href="/marketplace" className="btn btn-outline text-xs px-6 py-3">Browse cards</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {cards.map((card) => (
              <CollectionCardItem key={`${card.id}-${card.status}`} card={card} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
