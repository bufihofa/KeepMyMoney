import { Clipboard } from '@capacitor/clipboard';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export async function copyText(text: string) {
  if (Capacitor.isNativePlatform()) {
    await Clipboard.write({ string: text });
    return;
  }

  await navigator.clipboard.writeText(text);
}

export async function impact(style: ImpactStyle = ImpactStyle.Light) {
  try {
    await Haptics.impact({ style });
  } catch {
    // Ignore haptics errors on unsupported platforms.
  }
}
