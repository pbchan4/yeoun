import { getT } from "./i18n";

export function genreName(id: number) {
  return getT().genres[id] ?? null;
}

/** "18,10749" 같은 라우트 파라미터를 숫자 배열로 바꾼다. */
export function parseGenreIds(raw?: string) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n) && n > 0);
}
