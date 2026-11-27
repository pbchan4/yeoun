import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
} from "react-native";
import { getRecord, updateRecord } from "../lib/storage";
import { rescheduleReminders } from "../lib/notifications";
import { fonts } from "../lib/typography";
import { useT } from "../lib/i18n";

export default function EditScreen() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [note, setNote] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [watchedAt, setWatchedAt] = useState<Date | null>(null);
  const [originalAt, setOriginalAt] = useState("");

  useEffect(() => {
    if (!id) return;
    // 불러오기에 실패하면 저장 버튼을 열지 않아 빈 메모로 덮어쓰는 일을 막는다.
    getRecord(id)
      .then((record) => {
        if (record) {
          setNote(record.note ?? "");
          setWatchedAt(new Date(record.watchedAt));
          setOriginalAt(record.watchedAt);
          setLoaded(true);
        }
      })
      .catch(() => Alert.alert(t.edit.loadFailedTitle, t.edit.loadFailed));
  }, [id]);

  // 영화가 끝난 시각은 미래로 옮길 수 없다.
  const shift = (ms: number) => {
    if (!watchedAt) return;
    const next = new Date(Math.min(watchedAt.getTime() + ms, Date.now()));
    setWatchedAt(next);
  };

  const save = async () => {
    if (!id || !watchedAt) return;
    const iso = watchedAt.toISOString();
    const updated = await updateRecord(id, { note: note.trim(), watchedAt: iso });
    if (!updated) {
      Alert.alert(t.common.saveFailed, t.common.recordNotFound);
      return;
    }
    // 관람 시각이나 한 줄(한 달 뒤 편지에 쓰임)이 바뀌었으니 남은 알림을 다시 건다.
    rescheduleReminders(updated).catch(console.warn);
    router.replace({ pathname: "/movie", params: { id } });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.eyebrow}>EDIT RECORD</Text>
      <Text style={styles.title}>{t.edit.title}</Text>

      <Text style={styles.label}>{t.edit.finishedAt}</Text>
      {watchedAt && (
        <View style={styles.dateBox}>
          <View style={styles.stepRow}>
            <Pressable style={styles.step} onPress={() => shift(-DAY)} hitSlop={8}>
              <Text style={styles.stepText}>‹</Text>
            </Pressable>
            <Text style={styles.dateText}>
              {watchedAt.toLocaleDateString(t.dateLocale, { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
            </Text>
            <Pressable style={styles.step} onPress={() => shift(DAY)} hitSlop={8}>
              <Text style={styles.stepText}>›</Text>
            </Pressable>
          </View>
          <View style={styles.stepRow}>
            <Pressable style={styles.step} onPress={() => shift(-HOUR)} hitSlop={8}>
              <Text style={styles.stepText}>‹</Text>
            </Pressable>
            <Text style={styles.dateText}>
              {watchedAt.toLocaleTimeString(t.dateLocale, { hour: "numeric", minute: "2-digit" })}
            </Text>
            <Pressable style={styles.step} onPress={() => shift(HOUR)} hitSlop={8}>
              <Text style={styles.stepText}>›</Text>
            </Pressable>
          </View>
          {watchedAt.toISOString() !== originalAt && (
            <Text style={styles.dateHint}>{t.edit.dateHint}</Text>
          )}
        </View>
      )}

      <Text style={styles.label}>{t.edit.noteLabel}</Text>

      <TextInput
        value={note}
        onChangeText={setNote}
        multiline
        maxLength={140}
        placeholder={t.edit.notePlaceholder}
        placeholderTextColor="#666"
        style={styles.input}
      />

      <Text style={styles.count}>{note.length}/140</Text>

      <Pressable disabled={!loaded} style={styles.save} onPress={save}>
        <Text style={styles.saveText}>{t.edit.save}</Text>
      </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b0b0b" },
  container: { padding: 24, paddingBottom: 60 },
  label: { color: "#888", fontSize: 12, marginTop: 28, fontFamily: fonts.medium },
  dateBox: { backgroundColor: "#151515", borderRadius: 16, padding: 12, marginTop: 10, gap: 4 },
  stepRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  step: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  stepText: { color: "#ccc", fontSize: 24, fontFamily: fonts.display },
  dateText: { color: "#fff", fontSize: 16, fontFamily: fonts.medium },
  dateHint: { color: "#777", fontSize: 12, lineHeight: 18, paddingHorizontal: 8, paddingTop: 6, fontFamily: fonts.regular },
  eyebrow: { color: "#666", letterSpacing: 2.2, fontSize: 13, fontFamily: fonts.display },
  title: { color: "#fff", fontSize: 30, lineHeight: 41, marginTop: 12, fontFamily: fonts.semibold },
  input: { minHeight: 150, backgroundColor: "#151515", borderRadius: 16, padding: 16, color: "#fff", textAlignVertical: "top", fontSize: 16, lineHeight: 24, marginTop: 10, fontFamily: fonts.regular },
  count: { color: "#666", textAlign: "right", marginTop: 8, fontSize: 15, fontFamily: fonts.display },
  save: { backgroundColor: "#f2f2f2", borderRadius: 15, paddingVertical: 17, alignItems: "center", marginTop: 24 },
  saveText: { color: "#111", fontSize: 16, fontFamily: fonts.semibold },
});
