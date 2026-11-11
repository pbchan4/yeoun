import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Alert,
} from "react-native";
import { addResonanceEntry } from "../lib/storage";

const LEVELS = [
  { label: "거의 사라졌어요", value: 20 },
  { label: "희미하게 남아 있어요", value: 40 },
  { label: "문득 떠올라요", value: 60 },
  { label: "자주 생각나요", value: 80 },
  { label: "아직도 아주 선명해요", value: 100 },
];

export default function RecheckScreen() {
  const { id, day } = useLocalSearchParams<{ id?: string; day?: string }>();
  const [score, setScore] = useState<number | null>(null);
  const targetDay = day === "14" ? 14 : 3;

  const save = async () => {
    if (!id || score == null) return;

    const updated = await addResonanceEntry(id, {
      day: targetDay,
      score,
      createdAt: new Date().toISOString(),
    });

    if (!updated) {
      Alert.alert("저장 실패", "기록을 찾지 못했어요.");
      return;
    }

    Alert.alert(
      `DAY ${targetDay} 여운 기록 완료`,
      `지금의 여운은 ${score}입니다.`,
      [
        {
          text: "변화 보기",
          onPress: () => router.replace({ pathname: "/movie", params: { id } }),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View>
          <Text style={styles.day}>DAY {targetDay}</Text>
          <Text style={styles.title}>아직 이 영화가{"\n"}당신 안에 남아 있나요?</Text>
          <Text style={styles.sub}>
            좋았는지 다시 평가하지 않아도 돼요. 지금 떠오르는 정도만 기록하세요.
          </Text>
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

        <Pressable
          disabled={score == null}
          onPress={save}
          style={[styles.save, score == null && styles.disabled]}
        >
          <Text style={styles.saveText}>지금의 여운 남기기</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0b" },
  content: { flex: 1, padding: 24, justifyContent: "space-between" },
  day: { color: "#666", letterSpacing: 2.2, fontSize: 11, fontWeight: "800" },
  title: { color: "#fff", fontSize: 30, lineHeight: 41, fontWeight: "800", marginTop: 12 },
  sub: { color: "#888", fontSize: 15, lineHeight: 23, marginTop: 14 },
  options: { gap: 10 },
  option: { backgroundColor: "#151515", borderRadius: 15, padding: 18 },
  selected: { backgroundColor: "#f1f1f1" },
  optionText: { color: "#aaa", fontSize: 15 },
  selectedText: { color: "#111", fontWeight: "800" },
  save: { backgroundColor: "#fff", borderRadius: 15, paddingVertical: 17, alignItems: "center" },
  disabled: { opacity: 0.3 },
  saveText: { color: "#111", fontWeight: "800", fontSize: 16 },
});
