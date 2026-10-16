// SearchItem is one thing the quick search can open.
export type SearchItem = {
  group: string;
  label: string;
  // detail is shown beside the label: an alias, a type, a namespace.
  detail?: string;
  to: string;
};

// matchItems ranks items against a query: a label starting with it first, then
// a word in the label or detail starting with it, then anything containing it.
// Each group keeps at most perGroup results, groups in the order given.
export function matchItems(items: SearchItem[], query: string, groups: string[], perGroup = 5): SearchItem[] {
  const q = query.trim().toLowerCase();
  const score = (item: SearchItem): number => {
    if (!q) {
      return 1;
    }
    const label = item.label.toLowerCase();
    const text = `${label} ${(item.detail || '').toLowerCase()}`;
    if (label.startsWith(q)) {
      return 3;
    }
    if (text.split(/[\s\-_./()]+/).some((word) => word.startsWith(q))) {
      return 2;
    }
    return text.includes(q) ? 1 : 0;
  };
  const out: SearchItem[] = [];
  for (const group of groups) {
    const ranked = items
      .filter((item) => item.group === group)
      .map((item) => ({ item, s: score(item) }))
      .filter(({ s }) => s > 0)
      .sort((a, b) => b.s - a.s || a.item.label.localeCompare(b.item.label));
    out.push(...ranked.slice(0, perGroup).map(({ item }) => item));
  }
  return out;
}

// isQuickSearchKey is Cmd+K on macOS and Ctrl+K elsewhere.
export function isQuickSearchKey(e: { key: string; metaKey: boolean; ctrlKey: boolean }): boolean {
  return e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey);
}

// maxRecent is how many recently opened things the search keeps.
const maxRecent = 6;

// addRecent puts an item first among the recently opened, once, keeping a few.
export function addRecent(list: SearchItem[], item: SearchItem): SearchItem[] {
  return [item, ...list.filter((i) => i.to !== item.to)].slice(0, maxRecent);
}

// recentFromPath is the application a page belongs to, opened at its Overview,
// for a visit to any of its pages.
export function recentFromPath(path: string): SearchItem | undefined {
  const m = /^\/applications\/([^/]+)\//.exec(path);
  return m ? { group: 'Applications', label: decodeURIComponent(m[1]), to: `/applications/${m[1]}/config` } : undefined;
}
