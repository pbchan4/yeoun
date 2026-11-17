import type { ResonanceEntry, YeounRecord } from "./storage";

/** 이 점수 이상이면 "선명하게 남은 여운"으로 본다. */
export const STRONG_THRESHOLD = 80;

/**
 * 기록의 여운 이력을 돌려준다. (이력은 storage가 day 순으로 정렬해 저장한다.)
 * 이력이 비어 있는 오래된 기록은 첫인상(day 0)만 있는 이력으로 간주한다.
 */
export function getHistory(record: YeounRecord): ResonanceEntry[] {
  const history = record.resonanceHistory ?? [];
  if (history.length) return history;
  return [{ hours: 0, score: record.day0Score, createdAt: record.watchedAt }];
}

/** 가장 최근 시점의 여운. */
export function getLatest(record: YeounRecord): ResonanceEntry {
  const history = getHistory(record);
  return history[history.length - 1];
}
