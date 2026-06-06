'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { gsap } from '@/lib/gsap';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';

const NAV_LINKS = [
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Auctions',    href: '/auctions' },
  { label: 'Trades',      href: '/trades' },
  { label: 'Collection',  href: '/collection' },
];

export function Navigation() {
  const [open, setOpen] = useState(false);
  const overlayRef      = useRef<HTMLDivElement>(null);
  const linksRef        = useRef<HTMLUListElement>(null);
  const pathname        = usePathname();
  const { user }        = useAuthStore();
  const cartCount       = useCartStore((s) => s.items.length);

  const openMenu = useCallback(() => {
    setOpen(true);
    const overlay = overlayRef.current;
    const links   = linksRef.current?.querySelectorAll('li');
    if (!overlay || !links) return;

    gsap.to(overlay, { opacity: 1, pointerEvents: 'all', duration: 0.4, ease: 'power2.out' });
    gsap.fromTo(links,
      { opacity: 0, x: -30 },
      { opacity: 1, x: 0, stagger: 0.08, duration: 0.6, ease: 'power3.out', delay: 0.15 }
    );
  }, []);

  const closeMenu = useCallback(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    gsap.to(overlay, {
      opacity: 0,
      duration: 0.35,
      ease: 'power2.in',
      onComplete: () => setOpen(false),
    });
  }, []);

  // Close on route change
  useEffect(() => { closeMenu(); }, [pathname, closeMenu]);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMenu(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeMenu]);

  return (
    <>
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-5 mix-blend-normal">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-display text-base font-medium tracking-tight text-[#f0ede8] group-hover:text-gold transition-colors duration-300">
            CardMatch
          </span>
        </Link>

        {/* Right cluster */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/collection" className="label text-[0.65rem] hover:text-gold transition-colors">
                My Cards
              </Link>
              {cartCount > 0 && (
                <Link href="/cart" className="relative label text-[0.65rem] hover:text-gold transition-colors">
                  Cart
                  <span className="absolute -top-1.5 -right-2.5 w-3.5 h-3.5 rounded-full bg-gold text-[#080808] text-[0.5rem] font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                </Link>
              )}
              <Link href={`/profile/${user.username}`} className="w-7 h-7 rounded-full bg-[#1a1a1a] border border-[rgba(255,255,255,0.08)] overflow-hidden flex items-center justify-center text-xs text-dim">
                {user.display_name?.[0]?.toUpperCase() || '?'}
              </Link>
            </>
          ) : (
            <Link href="/login" className="label text-[0.65rem] hover:text-gold transition-colors">
              Sign in
            </Link>
          )}

          {/* Menu button */}
          <button
            onClick={open ? closeMenu : openMenu}
            className="flex flex-col gap-[5px] p-1 group"
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-px bg-[#f0ede8] transition-all duration-300 ${open ? 'rotate-45 translate-y-[6px]' : ''}`} />
            <span className={`block w-5 h-px bg-[#f0ede8] transition-all duration-300 ${open ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-px bg-[#f0ede8] transition-all duration-300 ${open ? '-rotate-45 -translate-y-[6px]' : ''}`} />
          </button>
        </div>
      </header>

      {/* ── Full-screen overlay menu ──────────────────────────────────────── */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-40 opacity-0 pointer-events-none"
        style={{ background: 'rgba(8,8,8,0.97)', backdropFilter: 'blur(8px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) closeMenu(); }}
      >
        <div className="h-full flex flex-col justify-center px-10 md:px-20">
          <ul ref={linksRef} className="space-y-2 mb-12">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-display text-4xl md:text-6xl lg:text-7xl font-normal hover:text-gold transition-colors duration-200 block py-1"
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Bottom row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
            {user ? (
              <>
                <Link href={`/profile/${user.username}`} className="label text-[0.7rem] hover:text-gold transition-colors" onClick={closeMenu}>
                  {user.display_name}
                </Link>
                <button
                  className="label text-[0.7rem] hover:text-red-400 transition-colors"
                  onClick={() => { useAuthStore.getState().logout(); closeMenu(); }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/login"    className="label text-[0.7rem] hover:text-gold transition-colors" onClick={closeMenu}>Sign in</Link>
                <Link href="/register" className="label text-[0.7rem] hover:text-gold transition-colors" onClick={closeMenu}>Create account</Link>
              </>
            )}
            <span className="label text-[0.7rem] ml-auto">© 2025 CardMatch</span>
          </div>
        </div>
      </div>
    </>
  );
}
