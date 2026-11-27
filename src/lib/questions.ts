import { getT } from "./i18n";

const KEYS = ["immersion", "emotion", "thought", "rewatch"] as const;
export type QuestionKey = (typeof KEYS)[number];

/** 첫인상 질문. 기록 화면과 통계(어떤 질문이 여운을 예측하나)에서 함께 쓴다. 문구는 현재 언어로 읽힌다. */
export const QUESTIONS = KEYS.map((key) => ({
  key,
  get eyebrow() {
    return getT().questions[key].eyebrow;
  },
  get short() {
    return getT().questions[key].short;
  },
  get label() {
    return getT().questions[key].label;
  },
}));
