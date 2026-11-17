import Storage from "expo-sqlite/kv-store";
import { useEffect, useState } from "react";
import { posterUrl } from "./tmdb";

/**
 * 포스터의 대표 색을 뽑아 기기에 저장해 둔다. (기록 데이터는 건드리지 않는다.)
 * react-native-image-colors가 설치돼 있지 않거나 실패하면 null을 돌려주고,
 * 화면은 회색으로 대신 보여준다.
 *   설치: npx expo install react-native-image-colors   (개발 빌드가 필요해요. Expo Go에서는 동작하지 않아요.)
 */
const KEY = "yeoun.posterColors.v1";
let cache: Record<string, string> | null = null;
const inflight = new Map<string, Promise<string | null>>();

async function loadCache() {
  if (cache) return cache;
  try {
    const raw = await Storage.getItem(KEY);
    cache = raw ? JSON.parse(raw) : {};
  } catch {
    cache = {};
  }
  return cache!;
}

async function extract(path: string): Promise<string | null> {
  let lib: any;
  try {
    lib = require("react-native-image-colors");
  } catch {
    return null;
  }
  const url = posterUrl(path);
  if (!url) return null;

  try {
    const colors = await (lib.getColors ?? lib.default?.getColors)(url, {
      fallback: "#555555",
      cache: true,
      key: path,
    });
    if (colors.platform === "ios") return colors.background ?? colors.primary ?? null;
    return colors.vibrant ?? colors.dominant ?? colors.average ?? null;
  } catch {
    return null;
  }
}

export function getPosterColor(path: string): Promise<string | null> {
  const pending = inflight.get(path);
  if (pending) return pending;

  const job = (async () => {
    const saved = await loadCache();
    if (saved[path]) return saved[path];

    const color = await extract(path);
    if (color) {
      saved[path] = color;
      try {
        await Storage.setItem(KEY, JSON.stringify(saved));
      } catch {}
    }
    return color;
  })().finally(() => inflight.delete(path));

  inflight.set(path, job);
  return job;
}

/** posterPath → 대표 색. 아직 못 구한 포스터는 맵에 없다. */
export function usePosterColors(paths: (string | null | undefined)[]) {
  const [colors, setColors] = useState<Record<string, string>>({});
  const key = paths.filter(Boolean).join("|");

  useEffect(() => {
    let alive = true;
    const unique = Array.from(new Set(paths.filter((p): p is string => !!p)));

    unique.forEach((p) => {
      getPosterColor(p).then((c) => {
        if (alive && c) setColors((prev) => (prev[p] === c ? prev : { ...prev, [p]: c }));
      });
    });

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return colors;
}
