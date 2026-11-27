import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getRecords, YeounRecord } from "../lib/storage";
import {
  countTypes,
  genreStats,
  getHistory,
  getLatest,
  questionInsight,
  ResonanceType,
  STRONG_THRESHOLD,
  TYPE_INFO,
} from "../lib/resonance";
import { QUESTIONS } from "../lib/questions";
import { genreName } from "../lib/genres";
import { fonts } from "../lib/typography";
import { getT, useT } from "../lib/i18n";

const TYPE_ORDER: ResonanceType[] = ["deepening", "lasting", "fading"];

function questionShort(key: string) {
  return QUESTIONS.find((q) => q.key === key)?.short ?? key;
}

/** 상관계수를 말로. */
function insightSentence(best: { key: string; r: number }, worst: { key: string; r: number } | undefined) {
  if (best.r < 0.2) {
    return getT().stats.insightNone;
  }
  const head = getT().stats.insightHead(questionShort(best.key));
  if (worst && worst.key !== best.key && worst.r <= -0.2) {
    return getT().stats.insightNegative(head, questionShort(worst.key));
  }
  if (worst && worst.key !== best.key && worst.r < 0.1) {
    return getT().stats.insightUnrelated(head, questionShort(worst.key));
  }
  return head;
}

export default function StatsScreen() {
  const t = useT();
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

  const types = useMemo(() => countTypes(records), [records]);
  const insight = useMemo(
    () => questionInsight(records, QUESTIONS.map((q) => q.key)),
    [records]
  );
  const genres = useMemo(() => genreStats(records), [records]);
  const year = new Date().getFullYear();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>YOUR CINEMA MEMORY</Text>
        <Text style={styles.title}>{t.stats.title}</Text>
        <Text style={styles.sub}>
          {t.stats.sub}
        </Text>

        <Pressable
          style={styles.recap}
          onPress={() => router.push({ pathname: "/recap", params: { year: String(year) } })}
        >
          <View>
            <Text style={styles.recapEyebrow}>{year} RECAP</Text>
            <Text style={styles.recapTitle}>{t.stats.recapCta}</Text>
          </View>
          <Text style={styles.recapArrow}>→</Text>
        </Pressable>

        <View style={styles.grid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.count}</Text>
            <Text style={styles.statLabel}>{t.stats.records}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.avgFirst || "—"}</Text>
            <Text style={styles.statLabel}>{t.stats.avgFirst}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.longCount}</Text>
            <Text style={styles.statLabel}>{t.stats.lasting}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.rewatches}</Text>
            <Text style={styles.statLabel}>{t.stats.rewatches}</Text>
          </View>
        </View>

        <View style={styles.highlight}>
          <Text style={styles.highlightLabel}>{t.stats.strongest}</Text>
          <Text style={styles.highlightTitle}>
            {stats.strongest?.title ?? t.stats.noData}
          </Text>
        </View>

        {/* 여운 유형 */}
        <Text style={styles.sectionTitle}>{t.stats.types}</Text>
        {types.classified === 0 ? (
          <Text style={styles.muted}>{t.stats.typesEmpty}</Text>
        ) : (
          <View style={styles.typeList}>
            {TYPE_ORDER.map((type) => {
              const n = types.counts[type];
              const pct = Math.round((n / types.classified) * 100);
              return (
                <View key={type} style={styles.typeRow}>
                  <View style={styles.typeHead}>
                    <Text style={styles.typeLabel}>
                      {TYPE_INFO[type].label}
                      {TYPE_INFO[type].label.toUpperCase() !== TYPE_INFO[type].en && (
                        <Text style={styles.typeEn}>  {TYPE_INFO[type].en}</Text>
                      )}
                    </Text>
                    <Text style={styles.typePct}>{pct}%</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.typeBody}>
                    {t.stats.typeCount(TYPE_INFO[type].body, n)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* 첫인상 → 여운 인사이트 */}
        <Text style={styles.sectionTitle}>{t.stats.insightTitle}</Text>
        {!insight.ready ? (
          <View style={styles.lockBox}>
            <Text style={styles.muted}>
              {t.stats.insightLocked(insight.need)}
            </Text>
            <View style={[styles.barTrack, { marginTop: 14 }]}>
              <View style={[styles.barFill, { width: `${(insight.have / insight.need) * 100}%` }]} />
            </View>
            <Text style={styles.lockCount}>
              {insight.have} / {insight.need}
            </Text>
          </View>
        ) : insight.results.length === 0 ? (
          <Text style={styles.muted}>{t.stats.insightFlat}</Text>
        ) : (
          <View style={styles.lockBox}>
            <Text style={styles.insight}>
              {insightSentence(insight.results[0], insight.results[insight.results.length - 1])}
            </Text>
            <View style={{ marginTop: 16, gap: 10 }}>
              {insight.results.map((r) => (
                <View key={r.key} style={styles.corrRow}>
                  <Text style={styles.corrLabel}>{questionShort(r.key)}</Text>
                  <View style={[styles.barTrack, { flex: 1 }]}>
                    <View style={[styles.barFill, { width: `${Math.max(0, r.r) * 100}%` }]} />
                  </View>
                  <Text style={styles.corrValue}>{r.r.toFixed(2)}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.corrHint}>{t.stats.corrHint}</Text>
          </View>
        )}

        {/* 장르 */}
        <Text style={styles.sectionTitle}>{t.stats.genres}</Text>
        {genres.length === 0 ? (
          <Text style={styles.muted}>{t.stats.genresEmpty}</Text>
        ) : (
          <View style={{ gap: 12 }}>
            {genres.slice(0, 6).map((g) => (
              <View key={g.id} style={styles.corrRow}>
                <Text style={styles.corrLabel}>{genreName(g.id) ?? t.stats.genreOther}</Text>
                <View style={[styles.barTrack, { flex: 1 }]}>
                  <View style={[styles.barFill, { width: `${g.avg}%` }]} />
                </View>
                <Text style={styles.corrValue}>{g.avg}</Text>
              </View>
            ))}
            <Text style={styles.corrHint}>{t.stats.genreHint}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0b" },
  content: { padding: 24, paddingBottom: 60 },
  eyebrow: { color: "#666", letterSpacing: 2.2, fontSize: 13, fontFamily: fonts.display },
  title: { color: "#fff", fontSize: 34, marginTop: 10, fontFamily: fonts.semibold },
  sub: { color: "#888", fontSize: 15, lineHeight: 23, marginTop: 12, marginBottom: 24, fontFamily: fonts.regular },
  recap: {
    backgroundColor: "#f2f2f2",
    borderRadius: 18,
    padding: 20,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  recapEyebrow: { color: "#666", fontSize: 12, letterSpacing: 2, fontFamily: fonts.display },
  recapTitle: { color: "#111", fontSize: 18, marginTop: 4, fontFamily: fonts.semibold },
  recapArrow: { color: "#111", fontSize: 20 },
  grid: { gap: 12 },
  statCard: { backgroundColor: "#151515", borderRadius: 18, padding: 20 },
  statValue: { color: "#fff", fontSize: 52, fontFamily: fonts.display },
  statLabel: { color: "#777", marginTop: 4, fontFamily: fonts.regular },
  highlight: { marginTop: 24, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#242424", paddingVertical: 24 },
  highlightLabel: { color: "#666", fontSize: 12, letterSpacing: 1.1, fontFamily: fonts.regular },
  highlightTitle: { color: "#fff", fontSize: 24, lineHeight: 32, marginTop: 10, fontFamily: fonts.semibold },
  sectionTitle: { color: "#fff", fontSize: 19, marginTop: 36, marginBottom: 14, fontFamily: fonts.semibold },
  muted: { color: "#777", fontSize: 14, lineHeight: 21, fontFamily: fonts.regular },
  typeList: { gap: 18 },
  typeRow: {},
  typeHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 },
  typeLabel: { color: "#fff", fontSize: 16, fontFamily: fonts.semibold },
  typeEn: { color: "#666", fontSize: 12, letterSpacing: 1.4, fontFamily: fonts.display },
  typePct: { color: "#fff", fontSize: 24, fontFamily: fonts.display },
  typeBody: { color: "#777", fontSize: 13, marginTop: 7, fontFamily: fonts.regular },
  barTrack: { height: 7, backgroundColor: "#252525", borderRadius: 99, overflow: "hidden" },
  barFill: { height: "100%", backgroundColor: "#efefef", borderRadius: 99 },
  lockBox: { backgroundColor: "#151515", borderRadius: 18, padding: 20 },
  lockCount: { color: "#888", fontSize: 16, marginTop: 8, textAlign: "right", fontFamily: fonts.display },
  insight: { color: "#fff", fontSize: 17, lineHeight: 26, fontFamily: fonts.semibold },
  corrRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  corrLabel: { color: "#bbb", width: 96, fontSize: 13, fontFamily: fonts.regular },
  corrValue: { color: "#fff", width: 40, textAlign: "right", fontSize: 17, fontFamily: fonts.display },
  corrHint: { color: "#666", fontSize: 12, marginTop: 12, fontFamily: fonts.regular },
});
