export function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function getBudgetStatus(usage: number): 'safe' | 'watch' | 'danger' | 'over' {
  if (usage >= 1) {
    return 'over';
  }

  if (usage >= 0.9) {
    return 'danger';
  }

  if (usage >= 0.7) {
    return 'watch';
  }

  return 'safe';
}
