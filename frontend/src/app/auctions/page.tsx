'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import api from '@/lib/api';
import type { Auction } from '@/types';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

function Countdown({ seconds }: { seconds: number }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;

  const urgent = remaining < 3600;

  return (
    <div className={`font-mono text-sm tabular-nums ${urgent ? 'text-red-400 animate-pulse2' : 'text-gold'}`}>
      {h > 0 && `${String(h).padStart(2,'0')}:`}
      {String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
    </div>
  );
}

function AuctionCard({ auction, onBid }: { auction: Auction; onBid: (a: Auction) => void }) {
  const ref   = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  return (
    <div
      ref={ref}
      className="sport-card rarity-legendary group relative rounded-xl overflow-hidden border border-subtle cursor-default"
      style={{ aspectRatio: '3/4' }}
    >
      {/* Background */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(160deg, rgba(30,20,10,1) 0%, rgba(10,8,5,1) 100%)',
      }} />

      {/* Featured halo */}
      {auction.is_featured && (
        <div className="absolute inset-0 animate-glow pointer-events-none rounded-xl" />
      )}

      {/* Content */}
      <div className="absolute inset-0 flex flex-col p-4 z-10">
        <div className="flex items-start justify-between mb-auto">
          <span className={`badge badge-${auction.rarity}`}>
            {auction.rarity === 'legendary' ? 'Legend' : auction.rarity}
          </span>
          {auction.is_featured && (
            <span className="badge" style={{ background: 'rgba(201,169,110,0.15)', color: '#c9a96e', border: '1px solid rgba(201,169,110,0.3)' }}>
              Featured
            </span>
          )}
        </div>

        <div className="mt-auto">
          <p className="text-[0.55rem] uppercase tracking-widest text-gold/50 mb-1">{auction.collection_name}</p>
          <p className="font-display text-lg font-medium text-white/95 mb-0.5">{auction.player_name}</p>
          <p className="text-xs text-white/40 mb-4">{auction.sport?.toUpperCase()}</p>

          <div className="sep-gold mb-4" />

          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-[0.6rem] uppercase tracking-wider text-white/30 mb-0.5">Current bid</p>
              <p className="font-display text-2xl font-medium text-gold">${auction.current_price.toFixed(2)}</p>
              <p className="text-[0.6rem] text-white/30">{auction.bid_count} bids</p>
            </div>
            <div className="text-right">
              <p className="text-[0.6rem] uppercase tracking-wider text-white/30 mb-0.5">Ends in</p>
              <Countdown seconds={auction.seconds_remaining} />
            </div>
          </div>

          {auction.buy_now_price && (
            <p className="text-[0.65rem] text-white/30 mb-3">
              Buy now: <span className="text-white/60">${auction.buy_now_price.toFixed(2)}</span>
            </p>
          )}

          <button
            onClick={() => user ? onBid(auction) : toast.error('Sign in to bid')}
            className="btn btn-primary w-full text-xs py-3"
          >
            Place Bid
          </button>
        </div>
      </div>
    </div>
  );
}

function BidModal({ auction, onClose }: { auction: Auction; onClose: () => void }) {
  const [amount, setAmount] = useState(auction.current_price + auction.min_increment);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (amount <= auction.current_price) return toast.error('Bid must be higher than current price');
    setLoading(true);
    try {
      await api.post(`/auctions/${auction.id}/bid`, { amount });
      toast.success('Bid placed!');
      onClose();
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : 'Failed to place bid';
      toast.error(msg || 'Failed to place bid');
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="bg-elevated border border-subtle rounded-2xl p-8 w-full max-w-sm">
        <h3 className="font-display text-xl mb-1">{auction.player_name}</h3>
        <p className="text-xs text-dim mb-6">{auction.collection_name}</p>

        <div className="flex justify-between text-sm mb-4">
          <span className="text-dim">Current bid</span>
          <span className="text-gold font-medium">${auction.current_price.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm mb-6">
          <span className="text-dim">Min increment</span>
          <span>${auction.min_increment.toFixed(2)}</span>
        </div>

        <label className="label text-[0.6rem] block mb-2">Your bid</label>
        <input
          type="number"
          className="input-base mb-4"
          min={auction.current_price + auction.min_increment}
          step={auction.min_increment}
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value))}
        />

        <div className="flex gap-3">
          <button className="btn btn-ghost flex-1 text-xs" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary flex-1 text-xs" onClick={submit} disabled={loading}>
            {loading ? 'Placing…' : `Bid $${amount.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuctionsPage() {
  const headRef    = useRef<HTMLDivElement>(null);
  const gridRef    = useRef<HTMLDivElement>(null);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<Auction | null>(null);
  const [sport,    setSport]    = useState('All');

  const SPORTS = ['All', 'soccer', 'baseball', 'basketball', 'football'];

  useEffect(() => {
    const el = headRef.current;
    if (!el) return;
    gsap.fromTo(el.children,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, stagger: 0.08, duration: 0.8, ease: 'power3.out', delay: 0.1 }
    );
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (sport !== 'All') params.sport = sport;
        const { data } = await api.get('/auctions', { params });
        setAuctions(data.auctions);
      } catch (_) { setAuctions([]); }
      setLoading(false);

      if (gridRef.current) {
        const items = gridRef.current.querySelectorAll('.auction-item');
        gsap.fromTo(items,
          { opacity: 0, y: 40, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, stagger: 0.08, duration: 1, ease: 'power3.out' }
        );
      }
    }
    load();
  }, [sport]);

  return (
    <div className="min-h-screen pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto">

        <div ref={headRef} className="mb-12">
          <p className="label mb-3">Live Auctions</p>
          <h1 className="section-title mb-6">Rare cards.<br />Real bids.</h1>

          <div className="flex gap-2 flex-wrap">
            {SPORTS.map((s) => (
              <button
                key={s}
                onClick={() => setSport(s)}
                className={`px-4 py-2 rounded-full text-[0.7rem] font-medium transition-all duration-200 ${
                  sport === s ? 'bg-gold text-[#080808]' : 'bg-[rgba(255,255,255,0.04)] text-dim border border-subtle hover:border-[rgba(255,255,255,0.12)]'
                }`}
              >
                {s === 'All' ? 'All sports' : s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-[rgba(255,255,255,0.03)] animate-pulse" style={{ aspectRatio: '3/4' }} />
            ))}
          </div>
        ) : auctions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="font-display text-3xl text-dim mb-3">No live auctions</p>
            <p className="text-sm text-faint">Check back soon</p>
          </div>
        ) : (
          <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {auctions.map((a) => (
              <div key={a.id} className="auction-item">
                <AuctionCard auction={a} onBid={setSelected} />
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <BidModal auction={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
