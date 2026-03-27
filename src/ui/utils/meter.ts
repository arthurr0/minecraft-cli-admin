export function createMeter(value: number | undefined, max: number, width: number): string {
  if (max <= 0 || width <= 0) {
    return '';
  }

  if (value === undefined || Number.isNaN(value)) {
    return '░'.repeat(width);
  }

  const ratio = Math.max(0, Math.min(1, value / max));
  const filled = Math.round(ratio * width);

  return `${'█'.repeat(filled)}${'░'.repeat(width - filled)}`;
}
