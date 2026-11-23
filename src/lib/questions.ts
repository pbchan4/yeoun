/** 첫인상 질문. 기록 화면과 통계(어떤 질문이 여운을 예측하나)에서 함께 쓴다. */
export const QUESTIONS = [
  { key: "immersion", eyebrow: "01 · 몰입", short: "몰입", label: "보는 동안 얼마나 빠져들었나요?" },
  { key: "emotion", eyebrow: "02 · 감정", short: "감정", label: "감정적으로 얼마나 크게 흔들렸나요?" },
  { key: "thought", eyebrow: "03 · 생각", short: "엔딩 뒤 생각", label: "엔딩 뒤에도 계속 생각이 이어지나요?" },
  { key: "rewatch", eyebrow: "04 · 재회", short: "다시 보고 싶은 마음", label: "언젠가 다시 이 영화를 만나고 싶나요?" },
] as const;

export type QuestionKey = (typeof QUESTIONS)[number]["key"];
