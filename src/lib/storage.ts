import Storage from "expo-sqlite/kv-store";

export type ResonanceEntry = {
  /** 관람 후 경과 시간(시간 단위). 0은 첫인상. */
  hours: number;
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
  /** 영화가 끝난 뒤 몇 시간 만에 첫인상을 남겼는지. 없으면 0(직후). watchedAt은 영화가 끝난 시각이다. */
  firstImpressionDelayHours?: number;
};

const KEY = "yeoun.records.v2";

// 이전 버전은 day(일 단위)로 저장했다. 읽을 때 hours로 바꿔 주면 기존 기록도 그대로 쓸 수 있다.
type StoredEntry = {
  hours?: number;
  day?: number;
  score: number;
  createdAt: string;
};

function normalize(record: YeounRecord): YeounRecord {
  const history = (record.resonanceHistory ?? []) as unknown as StoredEntry[];
  return {
    ...record,
    resonanceHistory: history.map((e) => ({
      hours: e.hours ?? (e.day ?? 0) * 24,
      score: e.score,
      createdAt: e.createdAt,
    })),
  };
}

export async function getRecords(): Promise<YeounRecord[]> {
  const raw = await Storage.getItem(KEY);
  return raw ? (JSON.parse(raw) as YeounRecord[]).map(normalize) : [];
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
  const withoutSameDay = history.filter((e) => e.hours !== entry.hours);

  current[index] = {
    ...current[index],
    resonanceHistory: [...withoutSameDay, entry].sort((a, b) => a.hours - b.hours),
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
