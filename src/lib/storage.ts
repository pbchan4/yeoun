import Storage from "expo-sqlite/kv-store";

export type ResonanceEntry = {
  /** 관람 후 경과 시간(시간 단위). 0은 첫인상. */
  hours: number;
  score: number;
  createdAt: string;
  /** 그 시점에 떠오른 한 줄. */
  note?: string;
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
  /** TMDB 장르 id. 이 기능 이전 기록에는 없다. */
  genreIds?: number[];
};

const KEY = "yeoun.records.v2";

// 이전 버전은 day(일 단위)로 저장했다. 읽을 때 hours로 바꿔 주면 기존 기록도 그대로 쓸 수 있다.
type StoredEntry = {
  hours?: number;
  day?: number;
  score: number;
  createdAt: string;
  note?: string;
};

function normalize(record: YeounRecord): YeounRecord {
  const history = (record.resonanceHistory ?? []) as unknown as StoredEntry[];
  return {
    ...record,
    resonanceHistory: history.map((e) => ({
      hours: e.hours ?? (e.day ?? 0) * 24,
      score: e.score,
      createdAt: e.createdAt,
      ...(e.note ? { note: e.note } : {}),
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

// ─── 백업 ────────────────────────────────────────────────

export type BackupFile = {
  app: "yeoun";
  version: 1;
  exportedAt: string;
  records: YeounRecord[];
};

export async function exportData(): Promise<BackupFile> {
  return {
    app: "yeoun",
    version: 1,
    exportedAt: new Date().toISOString(),
    records: await getRecords(),
  };
}

function isRecord(value: unknown): value is YeounRecord {
  const r = value as YeounRecord;
  return (
    !!r &&
    typeof r.id === "string" &&
    typeof r.tmdbId === "number" &&
    typeof r.title === "string" &&
    typeof r.watchedAt === "string" &&
    typeof r.day0Score === "number"
  );
}

/**
 * 백업 파일의 기록을 지금 기록과 합친다. 지우는 기록은 없다.
 * 같은 id가 이미 있으면 여운 이력이 더 많은 쪽을 남긴다.
 */
export async function importData(text: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("백업 파일을 읽을 수 없어요.");
  }

  const list = Array.isArray(parsed)
    ? parsed
    : (parsed as Partial<BackupFile>)?.app === "yeoun"
      ? (parsed as BackupFile).records
      : null;
  if (!Array.isArray(list)) throw new Error("여운 백업 파일이 아니에요.");

  const incoming = list.filter(isRecord).map(normalize);
  const current = await getRecords();
  const byId = new Map(current.map((r) => [r.id, r]));

  const added: YeounRecord[] = [];
  let updated = 0;

  for (const record of incoming) {
    const existing = byId.get(record.id);
    if (!existing) {
      byId.set(record.id, record);
      added.push(record);
    } else if (
      (record.resonanceHistory?.length ?? 0) > (existing.resonanceHistory?.length ?? 0)
    ) {
      byId.set(record.id, record);
      updated += 1;
    }
  }

  const merged = Array.from(byId.values()).sort(
    (a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime()
  );
  await saveRecords(merged);

  return { added, updated, skipped: list.length - incoming.length };
}
