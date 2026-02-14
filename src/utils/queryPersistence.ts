const KEY = 'events_saved_queries';

export interface SavedQueryItem {
  name: string;
  query: Record<string, string>;
}

export function loadSavedQueries(): SavedQueryItem[] {
  return JSON.parse(localStorage.getItem(KEY) ?? '[]') as SavedQueryItem[];
}

export function saveQuery(item: SavedQueryItem): void {
  const list = loadSavedQueries().filter((q) => q.name !== item.name);
  list.unshift(item);
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 8)));
}
