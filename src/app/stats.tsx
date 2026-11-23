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

const TYPE_ORDER: ResonanceType[] = ["deepening", "lasting", "fading"];

function questionShort(key: string) {
  return QUESTIONS.find((q) => q.key === key)?.short ?? key;
}

/** 상관계수를 말로. */
function insightSentence(best: { key: string; r: number }, worst: { key: string; r: number } | undefined) {
  if (best.r < 0.2) {
    return "아직 첫인상의 어떤 항목도 오래 남을지를 잘 예측하지 못해요. 여운은 보는 순간과 꽤 다른 곳에서 오는 것 같아요.";
  }
  const head = `당신에게 오래 남는 영화는 '${questionShort(best.key)}'이 컸던 영화예요.`;
  if (worst && worst.key !== best.key && worst.r <= -0.2) {
    return `${head} 오히려 '${questionShort(worst.key)}'이 컸던 영화는 빨리 옅어지는 편이었어요.`;
  }
  if (worst && worst.key !== best.key && worst.r < 0.1) {
    return `${head} 반면 '${questionShort(worst.key)}'은 3일 뒤의 여운과 거의 상관이 없었어요.`;
  }
  return head;
}

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
        <Text style={styles.title}>나의 여운</Text>
        <Text style={styles.sub}>
          영화가 좋았던 순간보다, 시간이 지나도 남은 것을 모아봅니다.
        </Text>

        <Pressable
          style={styles.recap}
          onPress={() => router.push({ pathname: "/recap", params: { year: String(year) } })}
        >
          <View>
            <Text style={styles.recapEyebrow}>{year} RECAP</Text>
            <Text style={styles.recapTitle}>올해의 여운 보기</Text>
          </View>
          <Text style={styles.recapArrow}>→</Text>
        </Pressable>

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

        {/* 여운 유형 */}
        <Text style={styles.sectionTitle}>여운의 유형</Text>
        {types.classified === 0 ? (
          <Text style={styles.muted}>하루 뒤의 여운까지 기록한 영화가 생기면 유형이 보여요.</Text>
        ) : (
          <View style={styles.typeList}>
            {TYPE_ORDER.map((t) => {
              const n = types.counts[t];
              const pct = Math.round((n / types.classified) * 100);
              return (
                <View key={t} style={styles.typeRow}>
                  <View style={styles.typeHead}>
                    <Text style={styles.typeLabel}>
                      {TYPE_INFO[t].label}
                      <Text style={styles.typeEn}>  {TYPE_INFO[t].en}</Text>
                    </Text>
                    <Text style={styles.typePct}>{pct}%</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.typeBody}>
                    {TYPE_INFO[t].body} · {n}편
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* 첫인상 → 여운 인사이트 */}
        <Text style={styles.sectionTitle}>무엇이 오래 남게 할까</Text>
        {!insight.ready ? (
          <View style={styles.lockBox}>
            <Text style={styles.muted}>
              3일 뒤 여운까지 기록한 영화가 {insight.need}편이 되면, 첫인상의 어떤 항목이 당신의 여운을 예측하는지 알려드려요.
            </Text>
            <View style={[styles.barTrack, { marginTop: 14 }]}>
              <View style={[styles.barFill, { width: `${(insight.have / insight.need) * 100}%` }]} />
            </View>
            <Text style={styles.lockCount}>
              {insight.have} / {insight.need}
            </Text>
          </View>
        ) : insight.results.length === 0 ? (
          <Text style={styles.muted}>답이 모두 비슷해서 아직 차이를 찾지 못했어요.</Text>
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
            <Text style={styles.corrHint}>1에 가까울수록 그 항목이 컸던 영화가 3일 뒤에도 남았다는 뜻이에요.</Text>
          </View>
        )}

        {/* 장르 */}
        <Text style={styles.sectionTitle}>장르별 여운</Text>
        {genres.length === 0 ? (
          <Text style={styles.muted}>같은 장르를 두 편 이상 기록하면 보여요. (이번 업데이트 이후 기록부터 장르가 저장돼요.)</Text>
        ) : (
          <View style={{ gap: 12 }}>
            {genres.slice(0, 6).map((g) => (
              <View key={g.id} style={styles.corrRow}>
                <Text style={styles.corrLabel}>{genreName(g.id) ?? "기타"}</Text>
                <View style={[styles.barTrack, { flex: 1 }]}>
                  <View style={[styles.barFill, { width: `${g.avg}%` }]} />
                </View>
                <Text style={styles.corrValue}>{g.avg}</Text>
              </View>
            ))}
            <Text style={styles.corrHint}>지금 남아 있는 여운의 평균이에요.</Text>
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
