import Storage from "expo-sqlite/kv-store";
import { useSyncExternalStore } from "react";
import { en } from "./locales/en";
import { ko, type Dict } from "./locales/ko";

export type Lang = "ko" | "en";
/** 사용자가 고른 값. "system"이면 기기 언어를 따른다. */
export type LangSetting = Lang | "system";

const KEY = "yeoun.language.v1";
const DICTS: Record<Lang, Dict> = { ko, en };

/** 기기 언어. 한국어가 아니면 영어로 보여준다. (네이티브 모듈 없이 Hermes Intl로 읽는다) */
function systemLang(): Lang {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? "";
    return locale.toLowerCase().startsWith("ko") ? "ko" : "en";
  } catch {
    return "ko";
  }
}

let setting: LangSetting = "system";
let lang: Lang = systemLang();
const listeners = new Set<() => void>();

function apply(next: LangSetting) {
  setting = next;
  lang = next === "system" ? systemLang() : next;
  listeners.forEach((l) => l());
}

/** 앱 시작 시 한 번. 저장된 언어 설정을 불러온다. */
export async function initLanguage() {
  try {
    const saved = await Storage.getItem(KEY);
    if (saved === "ko" || saved === "en" || saved === "system") apply(saved);
  } catch (e) {
    console.warn(e);
  }
}

export async function setLanguage(next: LangSetting) {
  apply(next);
  await Storage.setItem(KEY, next);
}

export function getLanguage() {
  return lang;
}

export function getLanguageSetting() {
  return setting;
}

/** 화면 밖(알림, 에러 메시지 등)에서 쓰는 현재 언어 사전. */
export function getT(): Dict {
  return DICTS[lang];
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** 화면에서 쓰는 현재 언어 사전. 언어가 바뀌면 다시 그린다. */
export function useT(): Dict {
  const current = useSyncExternalStore(subscribe, getLanguage, getLanguage);
  return DICTS[current];
}

/** 언어 값 자체가 필요할 때 (루트에서 화면 전체를 다시 그리는 용도 등). */
export function useLanguage(): Lang {
  return useSyncExternalStore(subscribe, getLanguage, getLanguage);
}
