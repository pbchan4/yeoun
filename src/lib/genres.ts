/** TMDB 영화 장르 id → 한국어 이름. (TMDB 장르 목록은 거의 바뀌지 않아 고정해 둔다.) */
export const GENRES: Record<number, string> = {
  28: "액션",
  12: "모험",
  16: "애니메이션",
  35: "코미디",
  80: "범죄",
  99: "다큐멘터리",
  18: "드라마",
  10751: "가족",
  14: "판타지",
  36: "역사",
  27: "공포",
  10402: "음악",
  9648: "미스터리",
  10749: "로맨스",
  878: "SF",
  10770: "TV 영화",
  53: "스릴러",
  10752: "전쟁",
  37: "서부",
};

export function genreName(id: number) {
  return GENRES[id] ?? null;
}

/** "18,10749" 같은 라우트 파라미터를 숫자 배열로 바꾼다. */
export function parseGenreIds(raw?: string) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n) && n > 0);
}
