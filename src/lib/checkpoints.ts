import { getT } from "./i18n";

/**
 * 여운을 다시 물어보는 시점. 시점을 바꾸고 싶으면 이 배열만 고치면 된다.
 * hours는 영화를 본 뒤 지난 시간이다. (저장되는 값이므로 한번 정하면 바꾸지 않는 게 좋다.)
 */
export type Checkpoint = {
  hours: number;
  label: string;
  prompt: string;
  notifyTitle: string;
  notifyBody: (movieTitle: string, note?: string) => string;
  /** 첫날 남긴 한 줄을 다시 보여주는 "편지" 시점. */
  letter?: boolean;
};

type CheckpointHours = 3 | 24 | 72 | 720;

function checkpoint(hours: CheckpointHours, letter = false): Checkpoint {
  return {
    hours,
    letter,
    get label() {
      return getT().checkpoints[hours].label;
    },
    get prompt() {
      return getT().checkpoints[hours].prompt;
    },
    get notifyTitle() {
      return getT().checkpoints[hours].notifyTitle;
    },
    notifyBody: (movieTitle, note) => getT().checkpoints[hours].notifyBody(movieTitle, note),
  };
}

export const CHECKPOINTS: Checkpoint[] = [checkpoint(3), checkpoint(24), checkpoint(72), checkpoint(720, true)];

/** 0 → FIRST IMPRESSION, 3 → 3H, 24 → DAY 1, 72 → DAY 3 (이전 버전의 DAY 14 기록은 DAY 14로 보인다) */
export function formatCheckpoint(hours: number) {
  if (hours === 0) return "FIRST IMPRESSION";
  if (hours < 24) return `${hours}H`;
  return `DAY ${Math.round(hours / 24)}`;
}

/** 기록할 때 고른 "영화가 끝난 뒤 지난 시간"을 화면에 보여줄 말로 바꾼다. */
export function formatDelay(hours: number) {
  const t = getT().delay;
  if (hours <= 0) return t.now;
  if (hours >= 24) return t.overDay;
  return t.hours(hours);
}
