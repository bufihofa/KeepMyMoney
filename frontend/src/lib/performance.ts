import { Capacitor } from '@capacitor/core';

export const isNativePlatform = Capacitor.isNativePlatform();

export function shouldReduceMotion() {
  if (typeof window === 'undefined') return isNativePlatform;
  return isNativePlatform || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
