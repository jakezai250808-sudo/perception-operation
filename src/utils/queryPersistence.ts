export interface SavedQueryItem {
  name: string;
  query: Record<string, string>;
}

function loadByKey(key: string): SavedQueryItem[] {
  return JSON.parse(localStorage.getItem(key) ?? '[]') as SavedQueryItem[];
}

function saveByKey(key: string, item: SavedQueryItem): void {
  const list = loadByKey(key).filter((q) => q.name !== item.name);
  list.unshift(item);
  localStorage.setItem(key, JSON.stringify(list.slice(0, 8)));
}

export function loadSavedEventQueries(): SavedQueryItem[] {
  return loadByKey('events_saved_queries');
}

export function saveEventQuery(item: SavedQueryItem): void {
  saveByKey('events_saved_queries', item);
}

export function loadSavedSnapshotQueries(): SavedQueryItem[] {
  return loadByKey('snapshots_saved_queries');
}

export function saveSnapshotQuery(item: SavedQueryItem): void {
  saveByKey('snapshots_saved_queries', item);
}
