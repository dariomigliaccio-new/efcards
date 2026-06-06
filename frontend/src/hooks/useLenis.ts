'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { ScrollTrigger } from '@/lib/gsap';

let lenisInstance: Lenis | null = null;

export function useLenis() {
  useEffect(() => {
    if (lenisInstance) return;

    const lenis = new Lenis({
      duration:    1.3,
      easing:      (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 2,
    });

    lenisInstance = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);

  return lenisInstance;
}

export function getLenis() {
  return lenisInstance;
}
