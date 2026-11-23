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
  TextInput,
  ScrollView,
} from "react-native";
import { getRecords, YeounRecord } from "../lib/storage";
import { classify, getLatest, ResonanceType, TYPE_INFO } from "../lib/resonance";
import { usePosterColors } from "../lib/poster-color";
import { ColorBand } from "../components/color-band";
import { posterUrl } from "../lib/tmdb";
import { fonts } from "../lib/typography";

type SortMode = "latest" | "score";
type Filter = "all" | "rewatch" | ResonanceType;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "deepening", label: TYPE_INFO.deepening.label },
  { key: "lasting", label: TYPE_INFO.lasting.label },
  { key: "fading", label: TYPE_INFO.fading.label },
  { key: "rewatch", label: "재관람" },
];

export default function ArchiveScreen() {
  const [records, setRecords] = useState<YeounRecord[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("latest");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useFocusEffect(
    useCallback(() => {
      getRecords().then(setRecords).catch(console.error);
    }, [])
  );

  const sorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const copy = records.filter((r) => {
      if (q && !r.title.toLowerCase().includes(q) && !(r.originalTitle ?? "").toLowerCase().includes(q)) {
        return false;
      }
      if (filter === "rewatch") return (r.rewatchIndex ?? 1) > 1;
      if (filter !== "all") return classify(r) === filter;
      return true;
    });

    if (sortMode === "score") {
      return copy.sort((a, b) => getLatest(b).score - getLatest(a).score);
    }

    return copy.sort(
      (a, b) =>
        new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime()
    );
  }, [records, sortMode, query, filter]);

  const colors = usePosterColors(records.map((r) => r.posterPath));
  const bandItems = useMemo(
    () =>
      [...records]
        .sort((a, b) => new Date(a.watchedAt).getTime() - new Date(b.watchedAt).getTime())
        .map((r) => ({
          id: r.id,
          color: r.posterPath ? colors[r.posterPath] ?? null : null,
          score: getLatest(r).score,
          label: r.title,
        })),
    [records, colors]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>YOUR ARCHIVE</Text>
        <Text style={styles.title}>기억에 남은 영화들</Text>
        <Text style={styles.sub}>
          <Text style={styles.subNum}>{records.length}</Text>개의 관람 기록
        </Text>

        <View style={{ marginTop: 18, marginBottom: 6 }}>
          <ColorBand items={bandItems} />
        </View>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="제목으로 찾기"
          placeholderTextColor="#555"
          style={styles.search}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.key}
              style={[styles.filter, filter === f.key && styles.filterActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={[styles.filters, { marginTop: 8 }]}>
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
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text style={styles.empty}>
            {records.length ? "조건에 맞는 기록이 없어요." : "아직 기록이 없어요."}
          </Text>
        }
        renderItem={({ item }) => {
          const image = posterUrl(item.posterPath);
          const latest = getLatest(item);

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
                <Text style={styles.metaNum}>{latest.score}</Text>
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
  eyebrow: { color: "#666", letterSpacing: 2.2, fontSize: 13, fontFamily: fonts.display },
  title: { color: "#fff", fontSize: 29, marginTop: 10, fontFamily: fonts.semibold },
  sub: { color: "#777", marginTop: 7, fontFamily: fonts.regular },
  subNum: { fontFamily: fonts.display, fontSize: 16 },
  filters: { flexDirection: "row", gap: 8, marginTop: 12 },
  search: { backgroundColor: "#151515", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, color: "#fff", marginTop: 16, fontSize: 15, fontFamily: fonts.regular },
  filter: { borderWidth: 1, borderColor: "#333", paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999 },
  filterActive: { backgroundColor: "#f2f2f2", borderColor: "#f2f2f2" },
  filterText: { color: "#aaa", fontSize: 12, fontFamily: fonts.semibold },
  filterTextActive: { color: "#111", fontFamily: fonts.regular },
  grid: { paddingHorizontal: 14, paddingBottom: 50 },
  row: { gap: 10 },
  item: { flex: 1, marginBottom: 20, maxWidth: "32%" },
  poster: { width: "100%", aspectRatio: 2 / 3, borderRadius: 10, backgroundColor: "#181818" },
  posterFallback: { width: "100%", aspectRatio: 2 / 3, borderRadius: 10, backgroundColor: "#202020" },
  movieTitle: { color: "#fff", fontSize: 12, marginTop: 7, fontFamily: fonts.semibold },
  meta: { color: "#666", fontSize: 11, marginTop: 3, fontFamily: fonts.regular },
  metaNum: { fontFamily: fonts.display, fontSize: 14 },
  empty: { color: "#666", padding: 20, fontFamily: fonts.regular },
});
