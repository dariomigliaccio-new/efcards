'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { Card3D } from '@/components/ui/Card3D';

const DEMO_CARDS = [
  { id: '1', playerName: 'Lionel Messi',   team: 'Inter Miami', sport: 'soccer',     rarity: 'legendary' as const, year: 2022, collectionName: 'Panini World Cup', price: 2400, imageUrl: '' },
  { id: '2', playerName: 'LeBron James',   team: 'LA Lakers',   sport: 'basketball', rarity: 'ultra_rare' as const, year: 2003, collectionName: 'Topps Chrome',     price: 1800, imageUrl: '' },
  { id: '3', playerName: 'Mike Trout',     team: 'LA Angels',   sport: 'baseball',   rarity: 'rare' as const,       year: 2011, collectionName: 'Bowman Draft',     price: 950,  imageUrl: '' },
  { id: '4', playerName: 'Patrick Mahomes',team: 'KC Chiefs',   sport: 'football',   rarity: 'ultra_rare' as const, year: 2017, collectionName: 'Panini Prizm',     price: 3200, imageUrl: '' },
  { id: '5', playerName: 'Erling Haaland', team: 'Man City',    sport: 'soccer',     rarity: 'rare' as const,       year: 2019, collectionName: 'Topps Chrome UCL', price: 480,  imageUrl: '' },
  { id: '6', playerName: 'Giannis A.',     team: 'Milwaukee',   sport: 'basketball', rarity: 'rare' as const,       year: 2013, collectionName: 'Panini Prizm',     price: 620,  imageUrl: '' },
];

export function FeaturedCards() {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef    = useRef<HTMLDivElement>(null);
  const headRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    // Header reveal
    ScrollTrigger.create({
      trigger: el,
      start: 'top 70%',
      once: true,
      onEnter: () => {
        if (headRef.current) {
          gsap.fromTo(headRef.current.children,
            { opacity: 0, y: 30, filter: 'blur(8px)' },
            { opacity: 1, y: 0, filter: 'blur(0px)', stagger: 0.1, duration: 1, ease: 'power3.out' }
          );
        }
      },
    });

    // Cards stagger
    ScrollTrigger.create({
      trigger: gridRef.current,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        const cards = gridRef.current?.querySelectorAll('.card-wrapper');
        if (cards) {
          gsap.fromTo(cards,
            { opacity: 0, y: 60, scale: 0.9, filter: 'blur(12px)' },
            { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', stagger: 0.1, duration: 1.2, ease: 'power3.out' }
          );
        }
      },
    });
  }, []);

  return (
    <section ref={sectionRef} className="py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div ref={headRef} className="flex items-end justify-between mb-16">
          <div>
            <p className="label mb-3">Featured</p>
            <h2 className="section-title max-w-xs">Cards of the moment.</h2>
          </div>
          <Link href="/marketplace" className="label text-[0.65rem] hover:text-gold transition-colors hidden sm:block">
            View all →
          </Link>
        </div>

        <div
          ref={gridRef}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          {DEMO_CARDS.map((card) => (
            <div key={card.id} className="card-wrapper">
              <Card3D {...card} href={`/marketplace/${card.id}`} showPrice />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
