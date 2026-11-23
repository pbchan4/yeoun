import { useState } from "react";
import { Alert, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { exportBackup, importBackup } from "../lib/backup";
import { fonts } from "../lib/typography";


export default function AboutScreen() {
  const [busy, setBusy] = useState(false);

  const runExport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await exportBackup();
    } catch (e) {
      Alert.alert("백업 실패", e instanceof Error ? e.message : "백업 파일을 만들지 못했어요.");
    } finally {
      setBusy(false);
    }
  };

  const runImport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await importBackup();
      if (result) {
        Alert.alert(
          "가져오기 완료",
          `새 기록 ${result.added}개, 더 최신으로 바뀐 기록 ${result.updated}개.` +
            (result.skipped ? `\n읽을 수 없는 항목 ${result.skipped}개는 건너뛰었어요.` : "")
        );
      }
    } catch (e) {
      Alert.alert("가져오기 실패", e instanceof Error ? e.message : "백업 파일을 읽지 못했어요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>ABOUT</Text>
        <Text style={styles.title}>여운에 대해</Text>

        <View style={styles.block}>
          <Text style={styles.label}>데이터</Text>
          <Text style={styles.body}>
            내가 남긴 첫인상과 여운 기록은 이 기기에만 저장돼요. 서버로 보내지 않아요.{"\n\n"}앱을 삭제하거나 기기를 바꾸기 전에 백업 파일을 만들어 두세요.
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>백업</Text>
          <Text style={styles.body}>
            모든 기록을 파일 하나로 내보내 파일 앱, 클라우드 드라이브, 메일 등에 보관할 수 있어요. 가져오면 지금 기록과 합쳐지고, 지워지는 기록은 없어요.
          </Text>
          <View style={styles.buttons}>
            <Pressable style={[styles.button, busy && styles.disabled]} disabled={busy} onPress={runExport}>
              <Text style={styles.buttonText}>백업 파일 만들기</Text>
            </Pressable>
            <Pressable style={[styles.ghost, busy && styles.disabled]} disabled={busy} onPress={runImport}>
              <Text style={styles.ghostText}>백업에서 가져오기</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>영화 정보</Text>
          <Text style={styles.body}>
            영화 제목과 포스터 등 영화 정보는 TMDB에서 가져와요.
          </Text>
          <Image
            source={require("../../assets/images/tmdb-logo.png")}
            style={styles.tmdbLogo}
            resizeMode="contain"
            accessibilityLabel="TMDB"
          />
          <Text style={styles.notice}>
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0b" },
  content: { padding: 24, paddingBottom: 60 },
  eyebrow: { color: "#666", letterSpacing: 2.2, fontSize: 13, fontFamily: fonts.display },
  title: { color: "#fff", fontSize: 30, marginTop: 10, marginBottom: 28, fontFamily: fonts.semibold },
  block: { marginBottom: 28, borderTopWidth: 1, borderTopColor: "#242424", paddingTop: 18 },
  label: { color: "#888", fontSize: 12, marginBottom: 8, fontFamily: fonts.medium },
  body: { color: "#d0d0d0", fontSize: 15, lineHeight: 24, fontFamily: fonts.regular },
  notice: { color: "#777", fontSize: 14, lineHeight: 21, marginTop: 14, fontFamily: fonts.display },
  buttons: { gap: 10, marginTop: 16 },
  button: { backgroundColor: "#f2f2f2", borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  buttonText: { color: "#111", fontSize: 15, fontFamily: fonts.semibold },
  ghost: { borderWidth: 1, borderColor: "#333", borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  ghostText: { color: "#ddd", fontSize: 15, fontFamily: fonts.semibold },
  disabled: { opacity: 0.4 },
  tmdbLogo: { width: 90, height: 65, marginTop: 14 },
});
