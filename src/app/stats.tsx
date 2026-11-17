import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getRecords, YeounRecord } from "../lib/storage";
import { getHistory, getLatest, STRONG_THRESHOLD } from "../lib/resonance";
import { fonts } from "../lib/typography";

export default function StatsScreen() {
  const [records, setRecords] = useState<YeounRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      getRecords().then(setRecords).catch(console.error);
    }, [])
  );

  const stats = useMemo(() => {
    if (!records.length) {
      return {
        count: 0,
        avgFirst: 0,
        longCount: 0,
        rewatches: 0,
        strongest: null as YeounRecord | null,
      };
    }

    const avgFirst = Math.round(
      records.reduce((sum, r) => sum + r.day0Score, 0) / records.length
    );

    const longCount = records.filter((r) =>
      getHistory(r).some((e) => e.hours >= 72 && e.score >= STRONG_THRESHOLD)
    ).length;

    const rewatches = records.filter((r) => (r.rewatchIndex ?? 1) > 1).length;

    let strongest: YeounRecord | null = null;
    let strongestScore = -1;

    for (const record of records) {
      const latest = getLatest(record);
      if (latest.score > strongestScore) {
        strongestScore = latest.score;
        strongest = record;
      }
    }

    return { count: records.length, avgFirst, longCount, rewatches, strongest };
  }, [records]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>YOUR CINEMA MEMORY</Text>
        <Text style={styles.title}>나의 여운</Text>
        <Text style={styles.sub}>
          영화가 좋았던 순간보다, 시간이 지나도 남은 것을 모아봅니다.
        </Text>

        <View style={styles.grid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.count}</Text>
            <Text style={styles.statLabel}>관람 기록</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.avgFirst || "—"}</Text>
            <Text style={styles.statLabel}>평균 첫인상</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.longCount}</Text>
            <Text style={styles.statLabel}>3일 뒤에도 선명</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.rewatches}</Text>
            <Text style={styles.statLabel}>재관람 기록</Text>
          </View>
        </View>

        <View style={styles.highlight}>
          <Text style={styles.highlightLabel}>지금 가장 강하게 남은 영화</Text>
          <Text style={styles.highlightTitle}>
            {stats.strongest?.title ?? "아직 데이터가 없어요"}
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
  title: { color: "#fff", fontSize: 34, marginTop: 10, fontFamily: fonts.semibold },
  sub: { color: "#888", fontSize: 15, lineHeight: 23, marginTop: 12, marginBottom: 30, fontFamily: fonts.regular },
  grid: { gap: 12 },
  statCard: { backgroundColor: "#151515", borderRadius: 18, padding: 20 },
  statValue: { color: "#fff", fontSize: 52, fontFamily: fonts.display },
  statLabel: { color: "#777", marginTop: 4, fontFamily: fonts.regular },
  highlight: { marginTop: 24, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#242424", paddingVertical: 24 },
  highlightLabel: { color: "#666", fontSize: 12, letterSpacing: 1.1, fontFamily: fonts.regular },
  highlightTitle: { color: "#fff", fontSize: 24, lineHeight: 32, marginTop: 10, fontFamily: fonts.semibold },
});
