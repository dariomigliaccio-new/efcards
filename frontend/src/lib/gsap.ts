'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import { SplitText } from 'gsap/SplitText';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, Flip, SplitText);
  gsap.defaults({ ease: 'power2.out', duration: 0.8 });
  gsap.config({ force3D: true, nullTargetWarn: false });
}

export { gsap, ScrollTrigger, Flip, SplitText };

export const EASE_OUT_EXPO = 'power4.out';
export const EASE_INOUT    = 'power2.inOut';
export const EASE_ELASTIC  = 'elastic.out(1, 0.4)';

export function fadeInUp(el: Element | null, delay = 0, duration = 1) {
  if (!el) return;
  return gsap.fromTo(el,
    { opacity: 0, y: 30, filter: 'blur(8px)' },
    { opacity: 1, y: 0,  filter: 'blur(0px)', duration, delay, ease: EASE_OUT_EXPO }
  );
}

export function cardReveal(el: Element | null, delay = 0) {
  if (!el) return;
  return gsap.fromTo(el,
    { opacity: 0, scale: 0.85, filter: 'blur(20px)', rotateY: 12 },
    { opacity: 1, scale: 1,    filter: 'blur(0px)',  rotateY: 0,
      duration: 1.8, delay, ease: EASE_OUT_EXPO }
  );
}

export function staggerReveal(container: Element | null, selector = ':scope > *', stagger = 0.1) {
  if (!container) return;
  const children = container.querySelectorAll(selector);
  return gsap.fromTo(children,
    { opacity: 0, y: 24, filter: 'blur(6px)' },
    { opacity: 1, y: 0,  filter: 'blur(0px)',
      duration: 0.8, stagger, ease: 'power3.out' }
  );
}
