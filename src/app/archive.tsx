import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
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

type SortMode = "latest" | "score";

export default function ArchiveScreen() {
  const [records, setRecords] = useState<YeounRecord[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("latest");

  useFocusEffect(
    useCallback(() => {
      getRecords().then(setRecords).catch(console.error);
    }, [])
  );

  const sorted = useMemo(() => {
    const copy = [...records];

    if (sortMode === "score") {
      return copy.sort((a, b) => {
        const ah = a.resonanceHistory ?? [];
        const bh = b.resonanceHistory ?? [];
        const ascore = ah.length ? ah[ah.length - 1].score : a.day0Score;
        const bscore = bh.length ? bh[bh.length - 1].score : b.day0Score;
        return bscore - ascore;
      });
    }

    return copy.sort(
      (a, b) =>
        new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime()
    );
  }, [records, sortMode]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>YOUR ARCHIVE</Text>
        <Text style={styles.title}>기억에 남은 영화들</Text>
        <Text style={styles.sub}>{records.length}개의 관람 기록</Text>

        <View style={styles.filters}>
          <Pressable
            style={[styles.filter, sortMode === "latest" && styles.filterActive]}
            onPress={() => setSortMode("latest")}
          >
            <Text style={[styles.filterText, sortMode === "latest" && styles.filterTextActive]}>
              최근순
            </Text>
          </Pressable>

          <Pressable
            style={[styles.filter, sortMode === "score" && styles.filterActive]}
            onPress={() => setSortMode("score")}
          >
            <Text style={[styles.filterText, sortMode === "score" && styles.filterTextActive]}>
              여운순
            </Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        ListEmptyComponent={<Text style={styles.empty}>아직 기록이 없어요.</Text>}
        renderItem={({ item }) => {
          const image = posterUrl(item.posterPath);
          const history = item.resonanceHistory ?? [];
          const latest = history.length ? history[history.length - 1] : { score: item.day0Score };

          return (
            <Pressable
              style={styles.item}
              onPress={() => router.push({ pathname: "/movie", params: { id: item.id } })}
            >
              {image ? (
                <Image source={{ uri: image }} style={styles.poster} />
              ) : (
                <View style={styles.posterFallback} />
              )}
              <Text numberOfLines={1} style={styles.movieTitle}>{item.title}</Text>
              <Text style={styles.meta}>
                {latest.score}
                {(item.rewatchIndex ?? 1) > 1 ? ` · ${item.rewatchIndex}회차` : ""}
              </Text>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0b" },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 18 },
  eyebrow: { color: "#666", letterSpacing: 2.2, fontSize: 11, fontWeight: "800" },
  title: { color: "#fff", fontSize: 29, fontWeight: "900", marginTop: 10 },
  sub: { color: "#777", marginTop: 7 },
  filters: { flexDirection: "row", gap: 8, marginTop: 18 },
  filter: { borderWidth: 1, borderColor: "#333", paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999 },
  filterActive: { backgroundColor: "#f2f2f2", borderColor: "#f2f2f2" },
  filterText: { color: "#aaa", fontSize: 12, fontWeight: "700" },
  filterTextActive: { color: "#111" },
  grid: { paddingHorizontal: 14, paddingBottom: 50 },
  row: { gap: 10 },
  item: { flex: 1, marginBottom: 20, maxWidth: "32%" },
  poster: { width: "100%", aspectRatio: 2 / 3, borderRadius: 10, backgroundColor: "#181818" },
  posterFallback: { width: "100%", aspectRatio: 2 / 3, borderRadius: 10, backgroundColor: "#202020" },
  movieTitle: { color: "#fff", fontSize: 12, fontWeight: "700", marginTop: 7 },
  meta: { color: "#666", fontSize: 11, marginTop: 3 },
  empty: { color: "#666", padding: 20 },
});
