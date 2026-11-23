import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { addResonanceEntry, getRecord, YeounRecord } from "../lib/storage";
import { cancelReminders } from "../lib/notifications";
import { CHECKPOINTS, formatCheckpoint } from "../lib/checkpoints";
import { fonts } from "../lib/typography";

const LEVELS = [
  { label: "거의 사라졌어요", value: 20 },
  { label: "희미하게 남아 있어요", value: 40 },
  { label: "문득 떠올라요", value: 60 },
  { label: "자주 생각나요", value: 80 },
  { label: "아직도 아주 선명해요", value: 100 },
];

export default function RecheckScreen() {
  const { id, hours } = useLocalSearchParams<{ id?: string; hours?: string }>();
  const [score, setScore] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [record, setRecord] = useState<YeounRecord | null>(null);
  const target = CHECKPOINTS.find((c) => String(c.hours) === hours) ?? CHECKPOINTS[0];
  const targetHours = target.hours;

  useEffect(() => {
    if (!id) return;
    getRecord(id).then(setRecord).catch(console.warn);
  }, [id]);

  const save = async () => {
    if (!id || score == null || saving) return;
    setSaving(true);

    try {
      const updated = await addResonanceEntry(id, {
        hours: targetHours,
        score,
        createdAt: new Date().toISOString(),
        ...(note.trim() ? { note: note.trim() } : {}),
      });

      if (!updated) {
        Alert.alert("저장 실패", "기록을 찾지 못했어요.");
        setSaving(false);
        return;
      }

      // 이미 기록했으니 같은 날의 남은 알림은 취소한다.
      cancelReminders(id, targetHours).catch(console.warn);

      Alert.alert(
        `${target.label} 여운 기록 완료`,
        `지금의 여운은 ${score}입니다.`,
        [
          {
            text: "변화 보기",
            onPress: () =>
              router.replace({ pathname: "/movie", params: { id } }),
          },
        ],
        { cancelable: false }
      );
    } catch {
      Alert.alert("저장 실패", "여운을 저장하지 못했어요. 다시 시도해 주세요.");
      setSaving(false);
    }
  };

  const letter = target.letter && !!record?.note;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View>
            <Text style={styles.day}>{formatCheckpoint(targetHours)}</Text>
            {!!record && <Text style={styles.movie}>{record.title}</Text>}
            <Text style={styles.title}>
              {letter ? "한 달 전의 당신이\n남긴 한 줄이에요." : "아직 이 영화가\n당신 안에 남아 있나요?"}
            </Text>
            {letter ? (
              <View style={styles.letter}>
                <Text style={styles.letterText}>“{record!.note}”</Text>
                <Text style={styles.letterDate}>
                  {new Date(record!.watchedAt).toLocaleDateString("ko-KR")}
                </Text>
              </View>
            ) : (
              <Text style={styles.sub}>
                좋았는지 다시 평가하지 않아도 돼요. 지금 떠오르는 정도만 기록하세요.
              </Text>
            )}
          </View>

          <View style={styles.options}>
            {LEVELS.map((item) => {
              const selected = score === item.value;
              return (
                <Pressable
                  key={item.value}
                  style={[styles.option, selected && styles.selected]}
                  onPress={() => setScore(item.value)}
                >
                  <Text style={[styles.optionText, selected && styles.selectedText]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={letter ? "지금의 나는 이렇게 답해요." : "지금 떠오르는 장면이나 대사가 있나요? (선택)"}
            placeholderTextColor="#666"
            multiline
            maxLength={140}
            style={styles.note}
          />

          <Pressable
            disabled={score == null || saving}
            onPress={save}
            style={[styles.save, (score == null || saving) && styles.disabled]}
          >
            <Text style={styles.saveText}>지금의 여운 남기기</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0b" },
  content: { flexGrow: 1, padding: 24, gap: 24, justifyContent: "space-between" },
  movie: { color: "#888", fontSize: 14, marginTop: 8, fontFamily: fonts.medium },
  letter: { marginTop: 18, borderLeftWidth: 2, borderLeftColor: "#555", paddingLeft: 14 },
  letterText: { color: "#e6e6e6", fontSize: 18, lineHeight: 28, fontFamily: fonts.regular },
  letterDate: { color: "#666", fontSize: 14, marginTop: 8, fontFamily: fonts.display },
  note: { minHeight: 72, backgroundColor: "#151515", borderRadius: 15, padding: 15, color: "#fff", textAlignVertical: "top", fontFamily: fonts.regular },
  day: { color: "#666", letterSpacing: 2.2, fontSize: 13, fontFamily: fonts.display },
  title: { color: "#fff", fontSize: 30, lineHeight: 41, marginTop: 12, fontFamily: fonts.semibold },
  sub: { color: "#888", fontSize: 15, lineHeight: 23, marginTop: 14, fontFamily: fonts.regular },
  options: { gap: 10 },
  option: { backgroundColor: "#151515", borderRadius: 15, padding: 18 },
  selected: { backgroundColor: "#f1f1f1" },
  optionText: { color: "#aaa", fontSize: 15, fontFamily: fonts.regular },
  selectedText: { color: "#111", fontFamily: fonts.semibold },
  save: { backgroundColor: "#fff", borderRadius: 15, paddingVertical: 17, alignItems: "center" },
  disabled: { opacity: 0.3 },
  saveText: { color: "#111", fontSize: 16, fontFamily: fonts.semibold },
});
