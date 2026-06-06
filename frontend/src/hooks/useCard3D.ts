'use client';

import { useRef, useCallback } from 'react';
import { gsap } from 'gsap';

interface UseCard3DOptions {
  intensity?: number;
  glowColor?: string;
  liftAmount?: number;
}

export function useCard3D<T extends HTMLElement>({
  intensity = 15,
  glowColor = 'rgba(201,169,110,0.25)',
  liftAmount = 8,
}: UseCard3DOptions = {}) {
  const cardRef   = useRef<T>(null);
  const glowRef   = useRef<HTMLDivElement>(null);
  const shineRef  = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback((e: React.MouseEvent<T>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x    = (e.clientX - rect.left) / rect.width  - 0.5; // -0.5 to 0.5
    const y    = (e.clientY - rect.top)  / rect.height - 0.5;

    gsap.to(card, {
      rotateY:             x * intensity,
      rotateX:            -y * intensity,
      translateZ:          liftAmount,
      duration:            0.4,
      ease:                'power2.out',
      transformPerspective: 1000,
    });

    if (shineRef.current) {
      gsap.to(shineRef.current, {
        background: `radial-gradient(circle at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%,
          rgba(255,255,255,0.15) 0%,
          transparent 60%)`,
        opacity:  0.8,
        duration: 0.3,
      });
    }

    if (glowRef.current) {
      gsap.to(glowRef.current, {
        background: `radial-gradient(circle at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%,
          ${glowColor} 0%,
          transparent 70%)`,
        opacity:  0.6,
        duration: 0.3,
      });
    }
  }, [intensity, glowColor, liftAmount]);

  const onMouseEnter = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    gsap.to(card, { scale: 1.03, duration: 0.3, ease: 'power2.out' });
  }, []);

  const onMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;

    gsap.to(card, {
      rotateY:    0, rotateX: 0, translateZ: 0, scale: 1,
      duration:   0.8, ease: 'elastic.out(1,0.4)',
    });

    if (shineRef.current) gsap.to(shineRef.current, { opacity: 0, duration: 0.4 });
    if (glowRef.current)  gsap.to(glowRef.current,  { opacity: 0, duration: 0.4 });
  }, []);

  return { cardRef, glowRef, shineRef, onMouseMove, onMouseEnter, onMouseLeave };
}
