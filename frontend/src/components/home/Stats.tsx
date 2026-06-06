'use client';

import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

const STATS = [
  { value: '180K+', label: 'Cards in database' },
  { value: '42K',   label: 'Active collectors' },
  { value: '$2.8M', label: 'Traded this month' },
  { value: '98%',   label: 'Satisfaction rate' },
];

export function Stats() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    ScrollTrigger.create({
      trigger: el,
      start: 'top 75%',
      once: true,
      onEnter: () => {
        const items = el.querySelectorAll('.stat-item');
        gsap.fromTo(items,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, stagger: 0.1, duration: 0.9, ease: 'power3.out' }
        );
      },
    });
  }, []);

  return (
    <section ref={ref} className="py-20 border-t border-b border-[rgba(255,255,255,0.06)]">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
        {STATS.map((s) => (
          <div key={s.label} className="stat-item text-center opacity-0">
            <p className="font-display text-3xl md:text-4xl font-medium text-gold mb-1">{s.value}</p>
            <p className="label text-[0.625rem]">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
