/**
 * Returns true if any filter in the subscription's event_types list matches eventType.
 *
 * Supported filter patterns:
 *   '*'        — match everything
 *   'order'    — exact match only ('order' matches 'order', not 'order.created')
 *   'order.*'  — prefix match ('order.*' matches 'order.created', 'order.updated', etc.)
 */
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
