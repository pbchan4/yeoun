import { useLocalSearchParams, router } from "expo-router";
import { useMemo, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
  Image,
  TextInput,
} from "react-native";
import { addRecord } from "../lib/storage";
import { posterUrl } from "../lib/tmdb";
import { scheduleYeounReminders } from "../lib/notifications";
import { CHECKPOINTS } from "../lib/checkpoints";
import { fonts } from "../lib/typography";
import { QUESTIONS } from "../lib/questions";
import { parseGenreIds } from "../lib/genres";

const LEVELS = [
  { label: "거의 없음", value: 20 },
  { label: "조금", value: 40 },
  { label: "보통", value: 60 },
  { label: "많이", value: 80 },
  { label: "아주 강하게", value: 100 },
];

// 영화가 끝난 지 얼마나 됐는지. 이미 지나간 재확인 시점은 건너뛴다.
const DELAY_OPTIONS = [
  { label: "방금", hours: 0 },
  { label: "1시간쯤", hours: 1 },
  { label: "반나절쯤", hours: 6 },
  { label: "하루 이상", hours: 24 },
];

export default function RecordScreen() {
  const params = useLocalSearchParams<{
    tmdbId?: string;
    title?: string;
    originalTitle?: string;
    posterPath?: string;
    releaseDate?: string;
    rewatchIndex?: string;
    genreIds?: string;
  }>();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [delayHours, setDelayHours] = useState(0);

  const score = useMemo(() => {
    const values = Object.values(answers);
    if (!values.length) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }, [answers]);

  const question = QUESTIONS[step];
  const complete = Object.keys(answers).length === QUESTIONS.length;
  const image = posterUrl(params.posterPath);
  const rewatchIndex = Number(params.rewatchIndex ?? "1");
  const nextLabel = CHECKPOINTS.find((c) => c.hours > delayHours)?.label ?? "나중에";

  const select = (value: number) => {
    setAnswers((prev) => ({ ...prev, [question.key]: value }));
    if (step < QUESTIONS.length - 1) setStep(step + 1);
  };

  const restart = () => {
    setAnswers({});
    setStep(0);
  };

  const save = async () => {
    if (!complete || !params.tmdbId || saving || saved) return;
    setSaving(true);

    try {
      const now = new Date().toISOString();
      const id = `${Date.now()}-${params.tmdbId}`;
      // 관람 시각은 "기록한 시각"이 아니라 영화가 끝난 시각으로 잡는다.
      const finishedAt = new Date(Date.now() - delayHours * 60 * 60 * 1000).toISOString();

      await addRecord({
          id,
        tmdbId: Number(params.tmdbId),
        title: params.title ?? "제목 없음",
        originalTitle: params.originalTitle ?? "",
        posterPath: params.posterPath || null,
        releaseDate: params.releaseDate ?? "",
        watchedAt: finishedAt,
        firstImpressionDelayHours: delayHours,
        day0Score: score,
        answers,
        resonanceHistory: [{ hours: 0, score, createdAt: now }],
        note: note.trim(),
        rewatchIndex,
        genreIds: parseGenreIds(params.genreIds),
      });

      setSaved(true);

      scheduleYeounReminders(params.title ?? "이 영화", finishedAt, id, delayHours, {
        note: note.trim() || undefined,
      }).catch(console.warn);

      Alert.alert(
        rewatchIndex > 1 ? "재관람 기록 완료" : "첫인상이 기록됐어요",
        `첫인상 지수는 ${score}입니다.\n${nextLabel}, 진짜 여운을 다시 물어볼게요.`,
        [{ text: "홈으로", onPress: () => router.replace("/") }],
        { cancelable: false }
      );
    } catch {
      Alert.alert("저장 실패", "기록을 저장하지 못했어요.");
    } finally {
      setSaving(false);
    }
  };

  if (complete) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.result}>
          {image && <Image source={{ uri: image }} style={styles.resultPoster} />}
          <Text style={styles.resultEyebrow}>
            {rewatchIndex > 1 ? `REWATCH · ${rewatchIndex}` : "FIRST IMPRESSION"}
          </Text>
          <Text style={styles.resultTitle}>{params.title}</Text>
          <Text style={styles.resultScore}>{score}</Text>

          <Text style={extra.delayLabel}>영화가 끝난 지 얼마나 됐나요?</Text>
          <View style={extra.chips}>
            {DELAY_OPTIONS.map((o) => {
              const active = delayHours === o.hours;
              return (
                <Pressable
                  key={o.hours}
                  onPress={() => setDelayHours(o.hours)}
                  style={[extra.chip, active && extra.chipActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[extra.chipText, active && extra.chipTextActive]}>
                    {o.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="지금 떠오르는 한 줄을 남겨도 좋아요."
            placeholderTextColor="#666"
            multiline
            maxLength={140}
            style={styles.note}
          />

          <Text style={styles.resultCopy}>
            이건 아직 여운이 아니에요.{"\n"}{nextLabel}, 이 영화가 얼마나 남았는지 다시 볼게요.
          </Text>

          <Pressable style={styles.saveButton} onPress={save} disabled={saving || saved}>
            <Text style={styles.saveButtonText}>{saving ? "저장 중..." : "첫인상 남기기"}</Text>
          </Pressable>

          {!saved && (
            <Pressable onPress={restart}>
              <Text style={styles.back}>답변 다시 고르기</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.progress}>
          {QUESTIONS.map((_, i) => (
            <View key={i} style={[styles.progressUnit, i <= step && styles.progressActive]} />
          ))}
        </View>

        <View>
          <Text style={styles.eyebrow}>
            <Text style={styles.eyebrowNum}>{question.eyebrow.split(" · ")[0]}</Text>
            {` · ${question.eyebrow.split(" · ")[1]}`}
          </Text>
          <Text style={styles.question}>{question.label}</Text>
        </View>

        <View style={styles.options}>
          {LEVELS.map((level) => (
            <Pressable key={level.value} style={styles.option} onPress={() => select(level.value)}>
              <Text style={styles.optionText}>{level.label}</Text>
              <Text style={styles.optionValue}>{level.value}</Text>
            </Pressable>
          ))}
        </View>

        {step > 0 && (
          <Pressable onPress={() => setStep(step - 1)}>
            <Text style={styles.back}>이전 질문</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0b" },
  content: { flex: 1, padding: 24, },
  progress: { flexDirection: "row", gap: 6, marginTop: 8 },
  progressUnit: { flex: 1, height: 3, backgroundColor: "#252525", borderRadius: 99 },
  progressActive: { backgroundColor: "#efefef" },
  eyebrow: { color: "#666", fontSize: 12, marginBottom: 12, fontFamily: fonts.semibold },
  eyebrowNum: { fontFamily: fonts.display, fontSize: 14, letterSpacing: 1.5 },
  question: { color: "#fff", fontSize: 30, lineHeight: 41, maxWidth: 340, marginBottom: 32, fontFamily: fonts.semibold },
  options: { gap: 10 },
  option: { backgroundColor: "#151515", borderRadius: 15, padding: 17, flexDirection: "row", justifyContent: "space-between" },
  optionText: { color: "#d0d0d0", fontSize: 15, fontFamily: fonts.regular },
  optionValue: { color: "#666", fontSize: 17, fontFamily: fonts.display },
  back: { color: "#666", textAlign: "center", paddingVertical: 16, fontFamily: fonts.regular },
  result: { flex: 1, padding: 24, justifyContent: "center", alignItems: "center" },
  resultPoster: { width: 118, height: 177, borderRadius: 15, marginBottom: 24 },
  resultEyebrow: { color: "#666", letterSpacing: 2.4, fontSize: 13, fontFamily: fonts.display },
  resultTitle: { color: "#fff", fontSize: 23, marginTop: 10, textAlign: "center", fontFamily: fonts.semibold },
  resultScore: { color: "#fff", fontSize: 88, lineHeight: 100, fontFamily: fonts.display, marginTop: 8 },
  note: { width: "100%", minHeight: 88, backgroundColor: "#151515", borderRadius: 15, padding: 15, color: "#fff", textAlignVertical: "top", marginTop: 12, marginBottom: 16, fontFamily: fonts.regular },
  resultCopy: { color: "#8b8b8b", textAlign: "center", lineHeight: 23, marginBottom: 24, fontFamily: fonts.regular },
  saveButton: { width: "100%", backgroundColor: "#f2f2f2", borderRadius: 15, paddingVertical: 17, alignItems: "center" },
  saveButtonText: { color: "#111", fontSize: 16, fontFamily: fonts.semibold },
});

const extra = StyleSheet.create({
  delayLabel: {
    color: "#929292",
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 18,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
    marginBottom: 6,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: "#F2F2F2",
    borderColor: "#F2F2F2",
  },
  chipText: {
    color: "#9B9B9B",
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  chipTextActive: {
    color: "#111111",
  },
});
