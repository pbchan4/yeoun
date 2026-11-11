import Storage from "expo-sqlite/kv-store";

export type ResonanceEntry = {
  day: 0 | 3 | 14;
  score: number;
  createdAt: string;
};

export type YeounRecord = {
  id: string;
  tmdbId: number;
  title: string;
  originalTitle: string;
  posterPath?: string | null;
  releaseDate?: string;
  watchedAt: string;
  day0Score: number;
  answers: Record<string, number>;
  resonanceHistory: ResonanceEntry[];
  note?: string;
  rewatchIndex?: number;
};

const KEY = "yeoun.records.v2";

export async function getRecords(): Promise<YeounRecord[]> {
  const raw = await Storage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveRecords(records: YeounRecord[]) {
  await Storage.setItem(KEY, JSON.stringify(records));
}

export async function addRecord(record: YeounRecord) {
  const current = await getRecords();
  await saveRecords([record, ...current]);
}

export async function getRecord(id: string) {
  const current = await getRecords();
  return current.find((r) => r.id === id) ?? null;
}

export async function updateRecord(
  id: string,
  patch: Partial<YeounRecord>
): Promise<YeounRecord | null> {
  const current = await getRecords();
  const index = current.findIndex((r) => r.id === id);
  if (index < 0) return null;

  current[index] = { ...current[index], ...patch };
  await saveRecords(current);
  return current[index];
}

export async function deleteRecord(id: string) {
  const current = await getRecords();
  await saveRecords(current.filter((r) => r.id !== id));
}

export async function addResonanceEntry(
  id: string,
  entry: ResonanceEntry
): Promise<YeounRecord | null> {
  const current = await getRecords();
  const index = current.findIndex((r) => r.id === id);
  if (index < 0) return null;

  const history = current[index].resonanceHistory ?? [];
  const withoutSameDay = history.filter((e) => e.day !== entry.day);

  current[index] = {
    ...current[index],
    resonanceHistory: [...withoutSameDay, entry].sort((a, b) => a.day - b.day),
  };

  await saveRecords(current);
  return current[index];
}

export async function findPreviousViewings(tmdbId: number) {
  const current = await getRecords();
  return current
    .filter((r) => r.tmdbId === tmdbId)
    .sort(
      (a, b) =>
        new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime()
    );
}
