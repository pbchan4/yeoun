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
import { getT, useT } from "../lib/i18n";

const LEVELS = [20, 40, 60, 80, 100].map((value, i) => ({
  value,
  get label() {
    return getT().recheck.levels[i];
  },
}));

export default function RecheckScreen() {
  const t = useT();
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
        Alert.alert(t.common.saveFailed, t.common.recordNotFound);
        setSaving(false);
        return;
      }

      // 이미 기록했으니 같은 날의 남은 알림은 취소한다.
      cancelReminders(id, targetHours).catch(console.warn);

      Alert.alert(
        t.recheck.savedTitle(target.label),
        t.recheck.savedBody(score),
        [
          {
            text: t.recheck.seeChange,
            onPress: () =>
              router.replace({ pathname: "/movie", params: { id } }),
          },
        ],
        { cancelable: false }
      );
    } catch {
      Alert.alert(t.common.saveFailed, t.recheck.saveError);
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
              {letter ? t.recheck.titleLetter : t.recheck.title}
            </Text>
            {letter ? (
              <View style={styles.letter}>
                <Text style={styles.letterText}>“{record!.note}”</Text>
                <Text style={styles.letterDate}>
                  {new Date(record!.watchedAt).toLocaleDateString(t.dateLocale)}
                </Text>
              </View>
            ) : (
              <Text style={styles.sub}>
                {t.recheck.sub}
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
            placeholder={letter ? t.recheck.notePlaceholderLetter : t.recheck.notePlaceholder}
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
            <Text style={styles.saveText}>{t.recheck.saveCta}</Text>
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
