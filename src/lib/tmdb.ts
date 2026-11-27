import { getT } from "./i18n";

export type TmdbMovie = {
  id: number;
  title: string;
  original_title: string;
  release_date?: string;
  poster_path?: string | null;
  genre_ids?: number[];
};

const TMDB_TOKEN = process.env.EXPO_PUBLIC_TMDB_TOKEN;

export async function searchMovies(query: string): Promise<TmdbMovie[]> {
  if (!TMDB_TOKEN) throw new Error(getT().errors.tmdbToken);

  const url =
    `https://api.themoviedb.org/3/search/movie?language=${getT().tmdbLanguage}&include_adult=false&query=` +
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
    throw new Error(getT().errors.network);
  }

  if (!res.ok) throw new Error(getT().errors.searchFailed(res.status));

  const data = await res.json();
  return data.results ?? [];
}

export function posterUrl(path?: string | null) {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/w500${path}`;
}
