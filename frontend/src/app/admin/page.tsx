'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Stats {
  users: number;
  listings: number;
  orders: number;
  revenue: number;
  active_auctions: number;
  completed_trades: number;
}

export default function AdminPage() {
  const { user, isAuthenticated } = useAuth();
  const router  = useRouter();
  const headRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/login'); return; }
    if (user?.role !== 'admin' && user?.role !== 'moderator') {
      router.replace('/'); return;
    }
    api.get('/admin/stats').then(({ data }) => setStats(data)).catch(() => {});

    gsap.fromTo(headRef.current?.children ?? [],
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, stagger: 0.06, duration: 0.7, ease: 'power3.out', delay: 0.1 }
    );
  }, [isAuthenticated, user]);

  if (!user || !['admin', 'moderator'].includes(user.role)) return null;

  const cards = [
    { label: 'Total Users',       value: stats?.users?.toLocaleString()    ?? '—', href: '/admin/users' },
    { label: 'Listings',          value: stats?.listings?.toLocaleString() ?? '—', href: '/admin/listings' },
    { label: 'Orders',            value: stats?.orders?.toLocaleString()   ?? '—', href: '/admin/payments' },
    { label: 'Revenue',           value: stats ? `$${Number(stats.revenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—', href: '/admin/payments' },
    { label: 'Live Auctions',     value: stats?.active_auctions?.toString()   ?? '—', href: '/admin/auctions' },
    { label: 'Completed Trades',  value: stats?.completed_trades?.toString()  ?? '—', href: '/admin/users' },
  ];

  const navLinks = [
    { label: 'Users',        href: '/admin/users' },
    { label: 'Listings',     href: '/admin/listings' },
    { label: 'Auctions',     href: '/admin/auctions' },
    { label: 'Payments',     href: '/admin/payments' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-20 px-6">
      <div className="max-w-6xl mx-auto">

        <div ref={headRef} className="mb-12">
          <p className="label mb-3">Admin Panel</p>
          <h1 className="section-title mb-2">Dashboard</h1>
          <p className="text-sm text-dim">Welcome back, {user.display_name}</p>
        </div>

        {/* Quick nav */}
        <div className="flex gap-2 flex-wrap mb-12">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="btn btn-ghost text-xs px-5 py-2.5">{l.label}</Link>
          ))}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
          {cards.map((c) => (
            <Link key={c.label} href={c.href} className="bg-elevated border border-subtle rounded-xl p-5 hover:border-[rgba(255,255,255,0.12)] transition-colors group">
              <p className="font-display text-2xl text-gold mb-1 group-hover:text-[#d9b97e] transition-colors">{c.value}</p>
              <p className="label text-[0.6rem]">{c.label}</p>
            </Link>
          ))}
        </div>

        {/* Pending listings */}
        <PendingListings />
      </div>
    </div>
  );
}

function PendingListings() {
  const [listings, setListings] = useState<unknown[]>([]);

  useEffect(() => {
    api.get('/admin/listings', { params: { status: 'pending', limit: 10 } })
      .then(({ data }) => setListings(data.listings))
      .catch(() => {});
  }, []);

  async function action(id: string, act: 'approve' | 'block') {
    await api.patch(`/admin/listings/${id}`, { action: act });
    setListings((prev) => prev.filter((l: unknown) => (l as { id: string }).id !== id));
  }

  if (!listings.length) return null;

  return (
    <div>
      <h2 className="font-display text-xl mb-6">Pending Approval <span className="text-dim text-base">({listings.length})</span></h2>
      <div className="space-y-3">
        {(listings as { id: string; player_name: string; sport: string; rarity: string; seller_username: string; price?: number }[]).map((l) => (
          <div key={l.id} className="bg-elevated border border-subtle rounded-xl p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{l.player_name}</p>
              <p className="text-xs text-dim">{l.sport} · {l.rarity} · @{l.seller_username}</p>
            </div>
            {l.price && <p className="text-sm text-gold font-medium">${Number(l.price).toFixed(2)}</p>}
            <div className="flex gap-2">
              <button onClick={() => action(l.id, 'approve')} className="btn btn-primary text-xs px-4 py-2">Approve</button>
              <button onClick={() => action(l.id, 'block')}   className="btn btn-ghost   text-xs px-4 py-2 hover:border-red-400 hover:text-red-400">Block</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
