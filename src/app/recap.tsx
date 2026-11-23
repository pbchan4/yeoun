import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Alert, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { CARD_HEIGHT, CARD_WIDTH } from "../components/share-card";
import { usePosterColors } from "../lib/poster-color";
import { getLatest, ResonanceType, TYPE_INFO, yearRecap } from "../lib/resonance";
import { CaptureView, shareViewAsImage } from "../lib/share";
import { getRecords, YeounRecord } from "../lib/storage";
import { posterUrl } from "../lib/tmdb";
import { fonts } from "../lib/typography";

const TYPE_ORDER: ResonanceType[] = ["deepening", "lasting", "fading"];
const TYPE_SHADE: Record<ResonanceType, string> = {
  deepening: "#F2F2F2",
  lasting: "#8D8D8D",
  fading: "#3A3A3A",
};

export default function RecapScreen() {
  const params = useLocalSearchParams<{ year?: string }>();
  const [records, setRecords] = useState<YeounRecord[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [year, setYear] = useState(() => Number(params.year) || new Date().getFullYear());
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<CaptureView>(null);

  useFocusEffect(
    useCallback(() => {
      getRecords()
        .then((r) => {
          setRecords(r);
          setLoaded(true);
        })
        .catch(console.error);
    }, [])
  );

  const years = useMemo(
    () =>
      Array.from(new Set(records.map((r) => new Date(r.watchedAt).getFullYear()))).sort((a, b) => a - b),
    [records]
  );
  const recap = useMemo(() => yearRecap(records, year), [records, year]);
  const colors = usePosterColors(recap?.records.map((r) => r.posterPath) ?? []);

  const index = years.indexOf(year);
  const prevYear = index > 0 ? years[index - 1] : null;
  const nextYear = index >= 0 && index < years.length - 1 ? years[index + 1] : null;

  const share = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await shareViewAsImage(cardRef, `${year} 올해의 여운`);
    } catch (e) {
      Alert.alert("공유 실패", e instanceof Error ? e.message : "이미지를 만들지 못했어요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.yearRow}>
          <Pressable disabled={!prevYear} onPress={() => prevYear && setYear(prevYear)} hitSlop={12}>
            <Text style={[styles.yearArrow, !prevYear && styles.hidden]}>‹</Text>
          </Pressable>
          <Text style={styles.yearText}>{year}</Text>
          <Pressable disabled={!nextYear} onPress={() => nextYear && setYear(nextYear)} hitSlop={12}>
            <Text style={[styles.yearArrow, !nextYear && styles.hidden]}>›</Text>
          </Pressable>
        </View>

        {!recap ? (
          <Text style={styles.empty}>
            {loaded ? `${year}년에 남긴 기록이 없어요.` : "불러오는 중..."}
          </Text>
        ) : (
          <>
            <View ref={cardRef} collapsable={false} style={styles.card}>
              <Text style={styles.cardEyebrow}>YEOUN · {recap.year}</Text>
              <Text style={styles.cardTitle}>올해의 여운</Text>

              <View style={styles.numbers}>
                <View>
                  <Text style={styles.bigNum}>{recap.count}</Text>
                  <Text style={styles.numLabel}>편의 영화</Text>
                </View>
                <View>
                  <Text style={styles.bigNum}>{recap.avgFirst}</Text>
                  <Text style={styles.numLabel}>평균 첫인상</Text>
                </View>
                <View>
                  <Text style={styles.bigNum}>{recap.busiestMonth}월</Text>
                  <Text style={styles.numLabel}>가장 많이 본 달</Text>
                </View>
              </View>

              <Highlight label="가장 오래 남은 영화" record={recap.longest} value={getLatest(recap.longest).score} />
              {recap.deepest && (
                <Highlight
                  label="처음보다 깊어진 영화"
                  record={recap.deepest.record}
                  value={`+${recap.deepest.diff}`}
                />
              )}

              {recap.types.classified > 0 && (
                <View style={styles.typeBlock}>
                  <View style={styles.typeBar}>
                    {TYPE_ORDER.map((t) =>
                      recap.types.counts[t] > 0 ? (
                        <View
                          key={t}
                          style={{ flex: recap.types.counts[t], backgroundColor: TYPE_SHADE[t] }}
                        />
                      ) : null
                    )}
                  </View>
                  <View style={styles.typeLegend}>
                    {TYPE_ORDER.map((t) => (
                      <Text key={t} style={styles.typeLegendText}>
                        <Text style={{ color: TYPE_SHADE[t] }}>■ </Text>
                        {TYPE_INFO[t].label} {recap.types.counts[t]}
                      </Text>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.band}>
                {recap.records.map((r) => {
                  const strength = getLatest(r).score / 100;
                  const w = Math.max(3, Math.min(12, (CARD_WIDTH - 48) / recap.records.length - 2));
                  return (
                    <View
                      key={r.id}
                      style={{
                        width: w,
                        height: 10 + 30 * strength,
                        borderRadius: 1.5,
                        backgroundColor: (r.posterPath && colors[r.posterPath]) || "#555555",
                        opacity: 0.25 + 0.75 * strength,
                      }}
                    />
                  );
                })}
              </View>
              <Text style={styles.footer}>영화가 끝난 뒤, 여운은 시작된다.</Text>
            </View>

            <Pressable style={[styles.button, busy && styles.disabled]} disabled={busy} onPress={share}>
              <Text style={styles.buttonText}>{busy ? "이미지 만드는 중..." : "결산 카드 공유하기"}</Text>
            </Pressable>

            <Text style={styles.listTitle}>{year}년의 기록</Text>
            {recap.records.map((r) => (
              <Pressable
                key={r.id}
                style={styles.row}
                onPress={() => router.push({ pathname: "/movie", params: { id: r.id } })}
              >
                <Text style={styles.rowDate}>
                  {new Date(r.watchedAt).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}
                </Text>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {r.title}
                </Text>
                <Text style={styles.rowScore}>{getLatest(r).score}</Text>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Highlight({ label, record, value }: { label: string; record: YeounRecord; value: number | string }) {
  const image = posterUrl(record.posterPath);
  return (
    <View style={styles.highlight}>
      {image ? <Image source={{ uri: image }} style={styles.hlPoster} /> : <View style={styles.hlPoster} />}
      <View style={{ flex: 1 }}>
        <Text style={styles.hlLabel}>{label}</Text>
        <Text style={styles.hlTitle} numberOfLines={2}>
          {record.title}
        </Text>
      </View>
      <Text style={styles.hlValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b0b0b" },
  content: { alignItems: "center", padding: 24, paddingBottom: 60 },
  yearRow: { flexDirection: "row", alignItems: "center", gap: 24, marginBottom: 18 },
  yearArrow: { color: "#aaa", fontSize: 28, fontFamily: fonts.display },
  hidden: { opacity: 0 },
  yearText: { color: "#fff", fontSize: 26, fontFamily: fonts.display, letterSpacing: 1 },
  empty: { color: "#777", marginTop: 40, fontFamily: fonts.regular },

  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: "#0B0B0B",
    borderWidth: 1,
    borderColor: "#1E1E1E",
    borderRadius: 4,
    padding: 24,
  },
  cardEyebrow: { color: "#6D6D6D", fontSize: 11, letterSpacing: 2, fontFamily: fonts.display },
  cardTitle: { color: "#F4F4F4", fontSize: 28, marginTop: 6, fontFamily: fonts.semibold },
  numbers: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  bigNum: { color: "#F2F2F2", fontSize: 34, fontFamily: fonts.display },
  numLabel: { color: "#777", fontSize: 11, fontFamily: fonts.regular },
  highlight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  hlPoster: { width: 40, height: 60, borderRadius: 4, backgroundColor: "#202020" },
  hlLabel: { color: "#777", fontSize: 11, fontFamily: fonts.regular },
  hlTitle: { color: "#F2F2F2", fontSize: 15, lineHeight: 20, marginTop: 3, fontFamily: fonts.semibold },
  hlValue: { color: "#F2F2F2", fontSize: 26, fontFamily: fonts.display },
  typeBlock: { marginTop: 18 },
  typeBar: { flexDirection: "row", height: 6, borderRadius: 99, overflow: "hidden", backgroundColor: "#1A1A1A" },
  typeLegend: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  typeLegendText: { color: "#999", fontSize: 11, fontFamily: fonts.regular },
  band: { flexDirection: "row", alignItems: "flex-end", gap: 2, marginTop: "auto", height: 40, overflow: "hidden" },
  footer: { color: "#555", fontSize: 10, marginTop: 10, textAlign: "center", fontFamily: fonts.regular },

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
  listTitle: { alignSelf: "stretch", color: "#fff", fontSize: 19, marginTop: 34, marginBottom: 8, fontFamily: fonts.semibold },
  row: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1C1C1C",
  },
  rowDate: { color: "#666", width: 44, fontSize: 14, fontFamily: fonts.display },
  rowTitle: { flex: 1, color: "#ddd", fontSize: 15, fontFamily: fonts.regular },
  rowScore: { color: "#fff", fontSize: 20, fontFamily: fonts.display },
});
