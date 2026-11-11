import { Link, router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
  FlatList,
  Image,
} from "react-native";
import { getRecords, YeounRecord } from "../lib/storage";
import { posterUrl } from "../lib/tmdb";

export default function HomeScreen() {
  const [records, setRecords] = useState<YeounRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      getRecords().then(setRecords).catch(console.error);
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={records.slice(0, 6)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <View style={styles.topRow}>
              <View>
                <Text style={styles.brand}>YEOUN</Text>
                <Text style={styles.tagline}>영화가 끝난 뒤, 여운은 시작된다.</Text>
              </View>

              <View style={styles.topActions}>
                <Link href="/archive" asChild>
                  <Pressable style={styles.pill}>
                    <Text style={styles.pillText}>아카이브</Text>
                  </Pressable>
                </Link>
                <Link href="/stats" asChild>
                  <Pressable style={styles.pill}>
                    <Text style={styles.pillText}>나의 여운</Text>
                  </Pressable>
                </Link>
              </View>
            </View>

            <View style={styles.hero}>
              <Text style={styles.heroEyebrow}>AFTER THE FILM</Text>
              <Text style={styles.heroLabel}>
                오늘 본 영화가{"\n"}아직 마음에 남아 있나요?
              </Text>
              <Text style={styles.heroSub}>
                별점 대신 첫인상을 남기고, 시간이 지난 뒤 진짜 여운을 다시 기록해보세요.
              </Text>

              <Link href="/search" asChild>
                <Pressable style={styles.button}>
                  <Text style={styles.buttonText}>영화 기록하기</Text>
                </Pressable>
              </Link>
            </View>

            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>최근 기록</Text>
              {records.length > 6 && (
                <Link href="/archive" asChild>
                  <Pressable>
                    <Text style={styles.more}>전체 보기</Text>
                  </Pressable>
                </Link>
              )}
            </View>
          </>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>아직 기록된 영화가 없어요.</Text>
        }
        renderItem={({ item }) => {
          const image = posterUrl(item.posterPath);
          const history = item.resonanceHistory ?? [];
          const latest = history.length
            ? history[history.length - 1]
            : { day: 0, score: item.day0Score };

          return (
            <Pressable
              style={styles.card}
              onPress={() =>
                router.push({ pathname: "/movie", params: { id: item.id } })
              }
            >
              {image ? (
                <Image source={{ uri: image }} style={styles.poster} />
              ) : (
                <View style={styles.posterFallback} />
              )}

              <View style={styles.cardBody}>
                <View style={styles.titleRow}>
                  <Text numberOfLines={1} style={styles.cardTitle}>{item.title}</Text>
                  {(item.rewatchIndex ?? 1) > 1 && (
                    <Text style={styles.rewatchBadge}>{item.rewatchIndex}회차</Text>
                  )}
                </View>
                <Text style={styles.meta}>
                  {new Date(item.watchedAt).toLocaleDateString("ko-KR")}
                </Text>
                <Text style={styles.scoreLabel}>
                  {latest.day === 0 ? "첫인상" : `DAY ${latest.day} 여운`}
                </Text>
                <Text style={styles.score}>{latest.score}</Text>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0b" },
  content: { padding: 24, paddingBottom: 60 },
  topRow: { gap: 18 },
  topActions: { flexDirection: "row", gap: 8 },
  brand: { color: "#fff", fontSize: 34, fontWeight: "800", letterSpacing: 4 },
  tagline: { color: "#8a8a8a", fontSize: 14, marginTop: 8 },
  pill: { borderWidth: 1, borderColor: "#2a2a2a", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  pillText: { color: "#d8d8d8", fontSize: 12, fontWeight: "700" },
  hero: { paddingVertical: 48 },
  heroEyebrow: { color: "#666", fontSize: 11, letterSpacing: 2.4, fontWeight: "800", marginBottom: 12 },
  heroLabel: { color: "#fff", fontSize: 30, fontWeight: "800", lineHeight: 40 },
  heroSub: { color: "#8f8f8f", fontSize: 15, lineHeight: 23, marginTop: 16, marginBottom: 28 },
  button: { backgroundColor: "#f1f1f1", paddingVertical: 17, borderRadius: 15, alignItems: "center" },
  buttonText: { color: "#111", fontWeight: "800", fontSize: 16 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { color: "#fff", fontWeight: "800", fontSize: 20 },
  more: { color: "#7f7f7f", fontSize: 13 },
  empty: { color: "#666" },
  card: { backgroundColor: "#141414", borderRadius: 18, overflow: "hidden", flexDirection: "row", marginBottom: 14 },
  poster: { width: 90, height: 135 },
  posterFallback: { width: 90, height: 135, backgroundColor: "#242424" },
  cardBody: { flex: 1, padding: 16 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { color: "#fff", fontSize: 17, fontWeight: "800", flexShrink: 1 },
  rewatchBadge: { color: "#999", fontSize: 11, borderWidth: 1, borderColor: "#333", borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
  meta: { color: "#666", marginTop: 5 },
  scoreLabel: { color: "#777", marginTop: 18, fontSize: 11, letterSpacing: 1.2, fontWeight: "700" },
  score: { color: "#fff", fontSize: 31, fontWeight: "800", marginTop: 2 },
});
