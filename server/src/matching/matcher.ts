export function matchesEventType(filters: string[], eventType: string): boolean {
  return filters.some(filter => {
    if (filter === '*') return true;
    if (filter.endsWith('.*')) {
      const prefix = filter.slice(0, -2);
      return eventType === prefix || eventType.startsWith(prefix + '.');
    }
    return filter === eventType;
  });
}
