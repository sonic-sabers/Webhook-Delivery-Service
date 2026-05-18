export function matchesEventType(filters: string[], eventType: string): boolean {
  return filters.some(f => {
    if (f === '*') return true;
    if (f === eventType) return true;
    if (f.endsWith('.*')) {
      const prefix = f.slice(0, -2);
      return eventType.startsWith(prefix + '.');
    }
    return false;
  });
}
