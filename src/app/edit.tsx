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
} from "react-native";
import { getRecord, updateRecord } from "../lib/storage";
import { fonts } from "../lib/typography";

export default function EditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [note, setNote] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!id) return;
    // 불러오기에 실패하면 저장 버튼을 열지 않아 빈 메모로 덮어쓰는 일을 막는다.
    getRecord(id)
      .then((record) => {
        if (record) {
          setNote(record.note ?? "");
          setLoaded(true);
        }
      })
      .catch(() => Alert.alert("불러오기 실패", "기록을 불러오지 못했어요."));
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
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b0b0b" },
  container: { flex: 1, padding: 24 },
  eyebrow: { color: "#666", letterSpacing: 2.2, fontSize: 13, fontFamily: fonts.display },
  title: { color: "#fff", fontSize: 30, lineHeight: 41, marginTop: 12, fontFamily: fonts.semibold },
  input: { minHeight: 150, backgroundColor: "#151515", borderRadius: 16, padding: 16, color: "#fff", textAlignVertical: "top", fontSize: 16, lineHeight: 24, marginTop: 28, fontFamily: fonts.regular },
  count: { color: "#666", textAlign: "right", marginTop: 8, fontSize: 15, fontFamily: fonts.display },
  save: { backgroundColor: "#f2f2f2", borderRadius: 15, paddingVertical: 17, alignItems: "center", marginTop: 24 },
  saveText: { color: "#111", fontSize: 16, fontFamily: fonts.semibold },
});
