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

// ─── 변화 해석 ────────────────────────────────────────────

/** 첫인상과 지금의 차이를 한 문장으로. */
export function describeChange(history: { score: number }[]) {
  if (history.length <= 1) return "첫인상이 기록됐어요. 진짜 여운은 시간이 지나면서 시작됩니다.";
  const diff = history[history.length - 1].score - history[0].score;
  if (diff >= 15) return "처음보다 더 깊게 남은 영화예요.";
  if (diff >= 5) return "시간이 지나며 조금 더 선명해지고 있어요.";
  if (diff <= -15) return "강했던 첫인상이 빠르게 옅어지고 있어요.";
  if (diff <= -5) return "처음보다는 조금 흐려졌어요.";
  return "처음의 감정이 비슷한 온도로 남아 있어요.";
}

// ─── 여운 유형 ────────────────────────────────────────────

export type ResonanceType = "deepening" | "lasting" | "fading";

export const TYPE_INFO: Record<ResonanceType, { label: string; en: string; body: string }> = {
  deepening: { label: "잔향형", en: "DEEPENING", body: "시간이 지날수록 더 깊어지는 영화" },
  lasting: { label: "지속형", en: "LASTING", body: "처음의 온도가 그대로 남는 영화" },
  fading: { label: "증발형", en: "FADING", body: "강렬했지만 빠르게 옅어지는 영화" },
};

/** 하루 이상 지난 뒤의 기록이 있어야 유형을 정한다. 없으면 null. */
export function classify(record: YeounRecord): ResonanceType | null {
  const history = getHistory(record);
  const later = history.filter((e) => e.hours >= 24);
  if (!later.length) return null;
  const diff = later[later.length - 1].score - history[0].score;
  if (diff >= 5) return "deepening";
  if (diff <= -15) return "fading";
  return "lasting";
}

export function countTypes(records: YeounRecord[]) {
  const counts: Record<ResonanceType, number> = { deepening: 0, lasting: 0, fading: 0 };
  let classified = 0;
  for (const r of records) {
    const t = classify(r);
    if (t) {
      counts[t] += 1;
      classified += 1;
    }
  }
  return { counts, classified };
}

// ─── 어떤 첫인상이 여운을 예측하나 ─────────────────────────

/** 개인 인사이트를 열기 위한 최소 기록 수(3일 뒤 이상 기록이 있는 영화 기준). */
export const MIN_INSIGHT_RECORDS = 10;

function pearson(xs: number[], ys: number[]) {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  if (dx === 0 || dy === 0) return null;
  return num / Math.sqrt(dx * dy);
}

/**
 * 첫인상 질문별 답과 3일 이후 여운의 상관을 구한다.
 * 기록이 부족하면 { ready: false, have, need }를 돌려준다.
 */
export function questionInsight(records: YeounRecord[], keys: readonly string[]) {
  const usable = records
    .map((r) => {
      const late = getHistory(r).filter((e) => e.hours >= 72);
      return late.length ? { answers: r.answers ?? {}, score: late[late.length - 1].score } : null;
    })
    .filter((v): v is { answers: Record<string, number>; score: number } => !!v);

  if (usable.length < MIN_INSIGHT_RECORDS) {
    return { ready: false as const, have: usable.length, need: MIN_INSIGHT_RECORDS };
  }

  const results = keys
    .map((key) => {
      const rows = usable.filter((u) => typeof u.answers[key] === "number");
      if (rows.length < MIN_INSIGHT_RECORDS) return null;
      const r = pearson(rows.map((u) => u.answers[key]), rows.map((u) => u.score));
      return r == null ? null : { key, r };
    })
    .filter((v): v is { key: string; r: number } => !!v)
    .sort((a, b) => b.r - a.r);

  return { ready: true as const, results };
}

// ─── 장르 ─────────────────────────────────────────────────

/** 장르별 평균 최신 여운. 2편 이상 기록한 장르만. */
export function genreStats(records: YeounRecord[], minCount = 2) {
  const acc = new Map<number, { sum: number; count: number }>();
  for (const r of records) {
    const score = getLatest(r).score;
    for (const g of new Set(r.genreIds ?? [])) {
      const cur = acc.get(g) ?? { sum: 0, count: 0 };
      cur.sum += score;
      cur.count += 1;
      acc.set(g, cur);
    }
  }
  return Array.from(acc.entries())
    .filter(([, v]) => v.count >= minCount)
    .map(([id, v]) => ({ id, count: v.count, avg: Math.round(v.sum / v.count) }))
    .sort((a, b) => b.avg - a.avg);
}

// ─── 연말 결산 ─────────────────────────────────────────────

export function yearRecap(records: YeounRecord[], year: number) {
  const list = records
    .filter((r) => new Date(r.watchedAt).getFullYear() === year)
    .sort((a, b) => new Date(a.watchedAt).getTime() - new Date(b.watchedAt).getTime());

  if (!list.length) return null;

  const avgFirst = Math.round(list.reduce((s, r) => s + r.day0Score, 0) / list.length);

  // 가장 오래 남은 영화: 가장 늦은 시점의 기록이 가장 높은 영화. 동점이면 더 늦게까지 기록한 쪽.
  const longest = list.reduce((best, r) => {
    const a = getLatest(r);
    const b = getLatest(best);
    if (a.score !== b.score) return a.score > b.score ? r : best;
    return a.hours > b.hours ? r : best;
  });

  // 처음보다 가장 깊어진 영화
  let deepest: { record: YeounRecord; diff: number } | null = null;
  for (const r of list) {
    const h = getHistory(r);
    if (h.length < 2) continue;
    const diff = h[h.length - 1].score - h[0].score;
    if (diff > 0 && (!deepest || diff > deepest.diff)) deepest = { record: r, diff };
  }

  const months = new Array(12).fill(0) as number[];
  for (const r of list) months[new Date(r.watchedAt).getMonth()] += 1;
  const busiest = months.indexOf(Math.max(...months));

  return {
    year,
    records: list,
    count: list.length,
    avgFirst,
    longest,
    deepest,
    types: countTypes(list),
    busiestMonth: busiest + 1,
    busiestCount: months[busiest],
  };
}
