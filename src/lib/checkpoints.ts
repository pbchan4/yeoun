/**
 * 여운을 다시 물어보는 시점. 시점을 바꾸고 싶으면 이 배열만 고치면 된다.
 * hours는 영화를 본 뒤 지난 시간이다. (저장되는 값이므로 한번 정하면 바꾸지 않는 게 좋다.)
 */
export type Checkpoint = {
  hours: number;
  label: string;
  prompt: string;
  notifyTitle: string;
  notifyBody: (movieTitle: string) => string;
};

export const CHECKPOINTS: Checkpoint[] = [
  {
    hours: 3,
    label: "3시간 뒤",
    prompt: "영화관을 나선 지 몇 시간, 아직 마음에 남아 있나요?",
    notifyTitle: "3시간이 지났어요.",
    notifyBody: (t) => `아직 ${t}이(가) 마음에 남아 있나요?`,
  },
  {
    hours: 24,
    label: "하루 뒤",
    prompt: "하루가 지난 지금도 이 영화가 남아 있나요?",
    notifyTitle: "하루가 지났어요.",
    notifyBody: (t) => `${t}의 여운, 하루가 지난 지금은 어떤가요?`,
  },
  {
    hours: 72,
    label: "3일 뒤",
    prompt: "3일이 지났어요. 아직 이 영화가 마음에 남아 있나요?",
    notifyTitle: "3일이 지났어요.",
    notifyBody: (t) => `${t}의 여운은 지금 얼마나 남아 있나요?`,
  },
];

/** 0 → FIRST IMPRESSION, 3 → 3H, 24 → DAY 1, 72 → DAY 3 (이전 버전의 DAY 14 기록은 DAY 14로 보인다) */
export function formatCheckpoint(hours: number) {
  if (hours === 0) return "FIRST IMPRESSION";
  if (hours < 24) return `${hours}H`;
  return `DAY ${Math.round(hours / 24)}`;
}

/** 기록할 때 고른 "영화가 끝난 뒤 지난 시간"을 화면에 보여줄 말로 바꾼다. */
export function formatDelay(hours: number) {
  if (hours <= 0) return "끝난 직후";
  if (hours >= 24) return "끝난 지 하루 넘게";
  return `끝난 지 ${hours}시간쯤`;
}
