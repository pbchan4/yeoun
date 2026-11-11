import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import { getRecord, updateRecord } from "../lib/storage";

export default function EditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [note, setNote] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!id) return;
    getRecord(id).then((record) => {
      if (record) setNote(record.note ?? "");
      setLoaded(true);
    });
  }, [id]);

  const save = async () => {
    if (!id) return;
    const updated = await updateRecord(id, { note: note.trim() });
    if (!updated) {
      Alert.alert("저장 실패", "기록을 찾지 못했어요.");
      return;
    }
    router.replace({ pathname: "/movie", params: { id } });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.eyebrow}>EDIT RECORD</Text>
      <Text style={styles.title}>그날의 한 줄을{"\n"}수정할 수 있어요.</Text>

      <TextInput
        value={note}
        onChangeText={setNote}
        multiline
        maxLength={140}
        placeholder="영화가 끝난 직후 떠오른 생각"
        placeholderTextColor="#666"
        style={styles.input}
      />

      <Text style={styles.count}>{note.length}/140</Text>

      <Pressable disabled={!loaded} style={styles.save} onPress={save}>
        <Text style={styles.saveText}>저장하기</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0b", padding: 24 },
  eyebrow: { color: "#666", letterSpacing: 2.2, fontSize: 11, fontWeight: "800" },
  title: { color: "#fff", fontSize: 30, lineHeight: 41, fontWeight: "800", marginTop: 12 },
  input: { minHeight: 150, backgroundColor: "#151515", borderRadius: 16, padding: 16, color: "#fff", textAlignVertical: "top", fontSize: 16, lineHeight: 24, marginTop: 28 },
  count: { color: "#666", textAlign: "right", marginTop: 8 },
  save: { backgroundColor: "#f2f2f2", borderRadius: 15, paddingVertical: 17, alignItems: "center", marginTop: 24 },
  saveText: { color: "#111", fontSize: 16, fontWeight: "800" },
});
