import { router } from "expo-router";
import { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  FlatList,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { posterUrl, searchMovies, TmdbMovie } from "../lib/tmdb";
import { findPreviousViewings } from "../lib/storage";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState<TmdbMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");

    try {
      setMovies(await searchMovies(query.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "검색에 실패했어요.");
    } finally {
      setLoading(false);
    }
  };

  const openRecord = async (item: TmdbMovie) => {
    const previous = await findPreviousViewings(item.id);

    const go = (rewatchIndex: number) =>
      router.push({
        pathname: "/record",
        params: {
          tmdbId: String(item.id),
          title: item.title,
          originalTitle: item.original_title,
          posterPath: item.poster_path ?? "",
          releaseDate: item.release_date ?? "",
          rewatchIndex: String(rewatchIndex),
        },
      });

    if (previous.length === 0) {
      go(1);
      return;
    }

    Alert.alert(
      "이 영화를 전에 기록했어요",
      `${item.title}을(를) ${previous.length}번 기록했어요.\n이번 관람을 새 기록으로 남길까요?`,
      [
        { text: "취소", style: "cancel" },
        { text: "재관람으로 기록", onPress: () => go(previous.length + 1) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={runSearch}
          placeholder="영화 제목을 검색하세요"
          placeholderTextColor="#666"
          style={styles.input}
          returnKeyType="search"
          autoFocus
        />
        <Pressable style={styles.searchButton} onPress={runSearch}>
          <Text style={styles.searchButtonText}>검색</Text>
        </Pressable>
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 28 }} />}
      {!!error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={movies}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ gap: 10, paddingTop: 18, paddingBottom: 50 }}
        renderItem={({ item }) => {
          const image = posterUrl(item.poster_path);
          return (
            <Pressable style={styles.movie} onPress={() => openRecord(item)}>
              {image ? (
                <Image source={{ uri: image }} style={styles.poster} />
              ) : (
                <View style={styles.posterFallback} />
              )}

              <View style={styles.movieBody}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.original}>{item.original_title}</Text>
                <Text style={styles.year}>
                  {item.release_date ? item.release_date.slice(0, 4) : "연도 미상"}
                </Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0b", padding: 20 },
  searchRow: { flexDirection: "row", gap: 8 },
  input: { flex: 1, backgroundColor: "#171717", color: "#fff", paddingHorizontal: 16, paddingVertical: 15, borderRadius: 14, fontSize: 16 },
  searchButton: { backgroundColor: "#f2f2f2", borderRadius: 14, justifyContent: "center", paddingHorizontal: 18 },
  searchButtonText: { color: "#111", fontWeight: "800" },
  error: { color: "#ff8d8d", marginTop: 18 },
  movie: { backgroundColor: "#151515", borderRadius: 14, overflow: "hidden", flexDirection: "row", alignItems: "center" },
  poster: { width: 64, height: 96 },
  posterFallback: { width: 64, height: 96, backgroundColor: "#252525" },
  movieBody: { flex: 1, paddingHorizontal: 14 },
  title: { color: "#fff", fontWeight: "700", fontSize: 16 },
  original: { color: "#777", marginTop: 3, fontSize: 12 },
  year: { color: "#999", marginTop: 6 },
  arrow: { color: "#777", fontSize: 30, paddingRight: 14 },
});
