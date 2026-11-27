import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { CHECKPOINTS, formatCheckpoint } from "../lib/checkpoints";
import { classify, getHistory, TYPE_INFO } from "../lib/resonance";
import { findPreviousViewings, YeounRecord } from "../lib/storage";
import { posterUrl } from "../lib/tmdb";
import { fonts } from "../lib/typography";
import { useT } from "../lib/i18n";

/** 회차마다 막대 밝기를 달리해 겹쳐 보이게 한다. 최근 회차가 가장 밝다. */
function shade(i: number, total: number) {
  if (total <= 1) return "#F2F2F2";
  const t = i / (total - 1);
  const v = Math.round(0x55 + (0xf2 - 0x55) * t);
  const h = v.toString(16).padStart(2, "0");
  return `#${h}${h}${h}`;
}

export default function CompareScreen() {
  const t = useT();
  const { tmdbId } = useLocalSearchParams<{ tmdbId?: string }>();
  const [viewings, setViewings] = useState<YeounRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!tmdbId) return;
      findPreviousViewings(Number(tmdbId))
        .then((list) => setViewings([...list].reverse())) // 오래된 회차부터
        .catch(console.error);
    }, [tmdbId])
  );

  const rows = useMemo(() => {
    const hours = new Set<number>([0, ...CHECKPOINTS.map((c) => c.hours)]);
    viewings.forEach((v) => getHistory(v).forEach((e) => hours.add(e.hours)));
    return Array.from(hours)
      .sort((a, b) => a - b)
      .map((h) => ({
        hours: h,
        scores: viewings.map((v) => getHistory(v).find((e) => e.hours === h)?.score ?? null),
      }))
      .filter((row) => row.scores.some((s) => s != null));
  }, [viewings]);

  if (!viewings.length) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.muted}>{t.common.loading}</Text>
      </SafeAreaView>
    );
  }

  const first = viewings[0];
  const image = posterUrl(first.posterPath);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          {image && <Image source={{ uri: image }} style={styles.poster} />}
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>REWATCH · {viewings.length}</Text>
            <Text style={styles.title}>{first.title}</Text>
            <Text style={styles.sub}>{t.compare.sub}</Text>
          </View>
        </View>

        <View style={styles.legend}>
          {viewings.map((v, i) => {
            const type = classify(v);
            return (
              <Pressable
                key={v.id}
                style={styles.legendItem}
                onPress={() => router.push({ pathname: "/movie", params: { id: v.id } })}
              >
                <View style={[styles.swatch, { backgroundColor: shade(i, viewings.length) }]} />
                <Text style={styles.legendText}>
                  {t.common.viewing(v.rewatchIndex ?? i + 1)} · {new Date(v.watchedAt).toLocaleDateString(t.dateLocale)}
                  {type ? ` · ${TYPE_INFO[type].label}` : ""}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {rows.map((row) => (
          <View key={row.hours} style={styles.block}>
            <Text style={styles.blockLabel}>{formatCheckpoint(row.hours)}</Text>
            {row.scores.map((score, i) => (
              <View key={viewings[i].id} style={styles.barRow}>
                <View style={styles.track}>
                  {score != null && (
                    <View
                      style={[styles.fill, { width: `${score}%`, backgroundColor: shade(i, viewings.length) }]}
                    />
                  )}
                </View>
                <Text style={styles.barScore}>{score ?? "—"}</Text>
              </View>
            ))}
          </View>
        ))}

        {viewings.some((v) => v.note) && (
          <>
            <Text style={styles.sectionTitle}>{t.compare.notes}</Text>
            {viewings.map((v, i) =>
              v.note ? (
                <View key={v.id} style={styles.noteBox}>
                  <Text style={styles.noteLabel}>{t.common.viewing(v.rewatchIndex ?? i + 1)}</Text>
                  <Text style={styles.noteText}>{v.note}</Text>
                </View>
              ) : null
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b0b0b" },
  center: { flex: 1, backgroundColor: "#0b0b0b", alignItems: "center", justifyContent: "center" },
  muted: { color: "#777", fontFamily: fonts.regular },
  content: { padding: 22, paddingBottom: 60 },
  header: { flexDirection: "row", alignItems: "flex-end", gap: 16 },
  poster: { width: 84, height: 126, borderRadius: 10 },
  eyebrow: { color: "#666", letterSpacing: 2, fontSize: 12, fontFamily: fonts.display },
  title: { color: "#fff", fontSize: 23, lineHeight: 30, marginTop: 6, fontFamily: fonts.semibold },
  sub: { color: "#888", marginTop: 6, fontFamily: fonts.regular },
  legend: { marginTop: 24, gap: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  swatch: { width: 14, height: 14, borderRadius: 3 },
  legendText: { color: "#bbb", fontSize: 13, fontFamily: fonts.regular },
  block: { marginTop: 18, backgroundColor: "#131313", borderRadius: 16, padding: 16, gap: 8 },
  blockLabel: { color: "#777", fontSize: 13, letterSpacing: 1.6, fontFamily: fonts.display, marginBottom: 2 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  track: { flex: 1, height: 7, backgroundColor: "#252525", borderRadius: 99, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 99 },
  barScore: { color: "#fff", width: 34, textAlign: "right", fontSize: 18, fontFamily: fonts.display },
  sectionTitle: { color: "#fff", fontSize: 19, marginTop: 32, marginBottom: 6, fontFamily: fonts.semibold },
  noteBox: { marginTop: 12, borderLeftWidth: 2, borderLeftColor: "#444", paddingLeft: 14 },
  noteLabel: { color: "#666", fontSize: 11, letterSpacing: 1.2, fontFamily: fonts.semibold },
  noteText: { color: "#d8d8d8", fontSize: 15, lineHeight: 23, marginTop: 5, fontFamily: fonts.regular },
});
