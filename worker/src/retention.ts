export function cutoffIso(retentionDays: number, now: number = Date.now()): string {
  return new Date(now - retentionDays * 24 * 60 * 60 * 1000).toISOString();
}
