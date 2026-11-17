export type TmdbMovie = {
  id: number;
  title: string;
  original_title: string;
  release_date?: string;
  poster_path?: string | null;
};

const TMDB_TOKEN = process.env.EXPO_PUBLIC_TMDB_TOKEN;

export async function searchMovies(query: string): Promise<TmdbMovie[]> {
  if (!TMDB_TOKEN) throw new Error("TMDB 토큰이 설정되지 않았어요. EXPO_PUBLIC_TMDB_TOKEN을 확인해 주세요.");

  const url =
    "https://api.themoviedb.org/3/search/movie?language=ko-KR&include_adult=false&query=" +
    encodeURIComponent(query);

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${TMDB_TOKEN}`,
        accept: "application/json",
      },
    });
  } catch {
    throw new Error("네트워크에 연결할 수 없어요. 연결을 확인해 주세요.");
  }

  if (!res.ok) throw new Error(`검색에 실패했어요. (${res.status})`);

  const data = await res.json();
  return data.results ?? [];
}

export function posterUrl(path?: string | null) {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/w500${path}`;
}
