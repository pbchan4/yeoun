import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { ShareCard } from "../components/share-card";
import { classify, describeChange, getHistory } from "../lib/resonance";
import { CaptureView, shareViewAsImage } from "../lib/share";
import { getRecord, YeounRecord } from "../lib/storage";
import { posterUrl } from "../lib/tmdb";
import { fonts } from "../lib/typography";
import { useT } from "../lib/i18n";

export default function ShareScreen() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [record, setRecord] = useState<YeounRecord | null>(null);
  const [posterReady, setPosterReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<CaptureView>(null);

  useEffect(() => {
    if (!id) return;
    getRecord(id).then(setRecord).catch(console.error);
  }, [id]);

  if (!record) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.muted}>{t.share.preparing}</Text>
      </SafeAreaView>
    );
  }

  const image = posterUrl(record.posterPath);
  const history = getHistory(record);
  // 포스터가 없으면 기다릴 이미지가 없다.
  const ready = posterReady || !image;

  const share = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await shareViewAsImage(cardRef, t.share.dialog(record.title));
    } catch (e) {
      Alert.alert(t.common.shareFailed, e instanceof Error ? e.message : t.common.imageFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <ShareCard
          ref={cardRef}
          title={record.title}
          posterUri={image}
          history={history}
          statement={describeChange(history)}
          type={classify(record)}
          note={record.note}
          rewatchIndex={record.rewatchIndex}
          watchedAt={record.watchedAt}
          onPosterLoad={() => setPosterReady(true)}
        />

        <Pressable
          style={[styles.button, (!ready || busy) && styles.disabled]}
          disabled={!ready || busy}
          onPress={share}
        >
          <Text style={styles.buttonText}>{busy ? t.common.makingImage : t.share.cta}</Text>
        </Pressable>
        <Text style={styles.hint}>{t.share.hint}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b0b0b" },
  center: { flex: 1, backgroundColor: "#0b0b0b", alignItems: "center", justifyContent: "center" },
  muted: { color: "#777", fontFamily: fonts.regular },
  content: { alignItems: "center", padding: 24, paddingBottom: 60 },
  button: {
    alignSelf: "stretch",
    backgroundColor: "#f2f2f2",
    borderRadius: 15,
    paddingVertical: 17,
    alignItems: "center",
    marginTop: 24,
  },
  disabled: { opacity: 0.3 },
  buttonText: { color: "#111", fontSize: 16, fontFamily: fonts.semibold },
  hint: { color: "#666", fontSize: 12, marginTop: 12, fontFamily: fonts.regular },
});
