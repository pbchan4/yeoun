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

const QUESTIONS = [
  { key: "immersion", eyebrow: "01 · 몰입", label: "보는 동안 얼마나 빠져들었나요?" },
  { key: "emotion", eyebrow: "02 · 감정", label: "감정적으로 얼마나 크게 흔들렸나요?" },
  { key: "thought", eyebrow: "03 · 생각", label: "엔딩 뒤에도 계속 생각이 이어지나요?" },
  { key: "rewatch", eyebrow: "04 · 재회", label: "언젠가 다시 이 영화를 만나고 싶나요?" },
];

const LEVELS = [
  { label: "거의 없음", value: 20 },
  { label: "조금", value: 40 },
  { label: "보통", value: 60 },
  { label: "많이", value: 80 },
  { label: "아주 강하게", value: 100 },
];

export default function RecordScreen() {
  const params = useLocalSearchParams<{
    tmdbId?: string;
    title?: string;
    originalTitle?: string;
    posterPath?: string;
    releaseDate?: string;
    rewatchIndex?: string;
  }>();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const score = useMemo(() => {
    const values = Object.values(answers);
    if (!values.length) return 0;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  }, [answers]);

  const question = QUESTIONS[step];
  const complete = Object.keys(answers).length === QUESTIONS.length;
  const image = posterUrl(params.posterPath);
  const rewatchIndex = Number(params.rewatchIndex ?? "1");

  const select = (value: number) => {
    setAnswers((prev) => ({ ...prev, [question.key]: value }));
    setTimeout(() => {
      if (step < QUESTIONS.length - 1) setStep(step + 1);
    }, 100);
  };

  const save = async () => {
    if (!complete || !params.tmdbId || saving) return;
    setSaving(true);

    try {
      const now = new Date().toISOString();

      await addRecord({
        id: `${Date.now()}-${params.tmdbId}`,
        tmdbId: Number(params.tmdbId),
        title: params.title ?? "제목 없음",
        originalTitle: params.originalTitle ?? "",
        posterPath: params.posterPath || null,
        releaseDate: params.releaseDate ?? "",
        watchedAt: now,
        day0Score: score,
        answers,
        resonanceHistory: [{ day: 0, score, createdAt: now }],
        note: note.trim(),
        rewatchIndex,
      });

      scheduleYeounReminders(params.title ?? "이 영화", now).catch(console.warn);

      Alert.alert(
        rewatchIndex > 1 ? "재관람 기록 완료" : "첫인상이 기록됐어요",
        `첫인상 지수는 ${score}입니다.\n3일 뒤, 진짜 여운을 다시 물어볼게요.`,
        [{ text: "홈으로", onPress: () => router.replace("/") }]
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
            이건 아직 여운이 아니에요.{"\n"}3일 뒤, 이 영화가 얼마나 남았는지 다시 볼게요.
          </Text>

          <Pressable style={styles.saveButton} onPress={save} disabled={saving}>
            <Text style={styles.saveButtonText}>{saving ? "저장 중..." : "첫인상 남기기"}</Text>
          </Pressable>
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
          <Text style={styles.eyebrow}>{question.eyebrow}</Text>
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
  eyebrow: { color: "#666", letterSpacing: 2, fontSize: 11, fontWeight: "800", marginBottom: 12 },
  question: { color: "#fff", fontSize: 30, lineHeight: 41, fontWeight: "800", maxWidth: 340, marginBottom: 32 },
  options: { gap: 10 },
  option: { backgroundColor: "#151515", borderRadius: 15, padding: 17, flexDirection: "row", justifyContent: "space-between" },
  optionText: { color: "#d0d0d0", fontSize: 15 },
  optionValue: { color: "#666", fontWeight: "800" },
  back: { color: "#666", textAlign: "center", paddingVertical: 16 },
  result: { flex: 1, padding: 24, justifyContent: "center", alignItems: "center" },
  resultPoster: { width: 118, height: 177, borderRadius: 15, marginBottom: 24 },
  resultEyebrow: { color: "#666", letterSpacing: 2.4, fontSize: 11, fontWeight: "800" },
  resultTitle: { color: "#fff", fontSize: 23, fontWeight: "800", marginTop: 10, textAlign: "center" },
  resultScore: { color: "#fff", fontSize: 72, lineHeight: 84, fontWeight: "900", marginTop: 8 },
  note: { width: "100%", minHeight: 88, backgroundColor: "#151515", borderRadius: 15, padding: 15, color: "#fff", textAlignVertical: "top", marginTop: 12, marginBottom: 16 },
  resultCopy: { color: "#8b8b8b", textAlign: "center", lineHeight: 23, marginBottom: 24 },
  saveButton: { width: "100%", backgroundColor: "#f2f2f2", borderRadius: 15, paddingVertical: 17, alignItems: "center" },
  saveButtonText: { color: "#111", fontWeight: "800", fontSize: 16 },
});
