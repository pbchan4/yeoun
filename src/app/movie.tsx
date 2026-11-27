import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  Alert,
} from "react-native";
import { deleteRecord, findPreviousViewings, getRecord, YeounRecord } from "../lib/storage";
import { classify, describeChange, getHistory, TYPE_INFO } from "../lib/resonance";
import { cancelReminders } from "../lib/notifications";
import { CHECKPOINTS, formatCheckpoint, formatDelay } from "../lib/checkpoints";
import { ResonanceStrip } from "../components/resonance-strip";
import { posterUrl } from "../lib/tmdb";
import { fonts } from "../lib/typography";
import { useT } from "../lib/i18n";

// 알림은 정해진 시점 "이후"에만 울리므로(밤에는 아침으로 미룸), 경과 시간 기준으로 열면 알림보다 먼저 열린다.
function hoursSince(iso: string) {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

export default function MovieScreen() {
  const t = useT();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [record, setRecord] = useState<YeounRecord | null>(null);
  const [missing, setMissing] = useState(false);
  const [viewingCount, setViewingCount] = useState(1);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      getRecord(id)
        .then(async (r) => {
          setRecord(r);
          setMissing(!r);
          if (r) setViewingCount((await findPreviousViewings(r.tmdbId)).length);
        })
        .catch(console.error);
    }, [id])
  );

  const available = useMemo(() => {
    if (!record) return [];
    const elapsed = hoursSince(record.watchedAt);
    const done = new Set(getHistory(record).map((e) => e.hours));
    const delay = record.firstImpressionDelayHours ?? 0;
    return CHECKPOINTS.filter(
      (c) => c.hours > delay && elapsed >= c.hours && !done.has(c.hours)
    );
  }, [record]);

  const remove = () => {
    if (!record) return;
    Alert.alert(
      t.movie.deleteTitle,
      t.movie.deleteBody,
      [
        { text: t.common.cancel, style: "cancel" },
        {
          text: t.common.delete,
          style: "destructive",
          onPress: async () => {
            await cancelReminders(record.id).catch(console.warn);
            await deleteRecord(record.id);
            router.replace("/");
          },
        },
      ]
    );
  };

  if (!record) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.loading}>
          {missing ? t.common.recordNotFound : t.movie.loading}
        </Text>
      </SafeAreaView>
    );
  }

  const image = posterUrl(record.posterPath);
  const history = getHistory(record);
  const firstDelay = record.firstImpressionDelayHours ?? 0;
  const type = classify(record);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          {image && <Image source={{ uri: image }} style={styles.poster} />}
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{record.title}</Text>
            <Text style={styles.meta}>
              <Text style={styles.metaNum}>
                {new Date(record.watchedAt).toLocaleDateString(t.dateLocale)}
              </Text>
              {(record.rewatchIndex ?? 1) > 1 ? ` · ${t.common.viewing(record.rewatchIndex ?? 1)}` : ""}
            </Text>
          </View>
        </View>

        {!!record.note && (
          <View style={styles.noteBox}>
            <Text style={styles.noteLabel}>{t.movie.noteLabel}</Text>
            <Text style={styles.noteText}>{record.note}</Text>
          </View>
        )}

        <View style={styles.statementBox}>
          {type && (
            <Text style={styles.typeBadge}>
              {t.typeBadge(TYPE_INFO[type].en, TYPE_INFO[type].label)}
            </Text>
          )}
          <Text style={styles.statement}>{describeChange(history)}</Text>
          {type && <Text style={styles.typeBody}>{TYPE_INFO[type].body}</Text>}
        </View>

        <Text style={styles.sectionTitle}>{t.movie.flow}</Text>
        <ResonanceStrip history={history} posterUri={image} delayHours={firstDelay} />

        <Text style={[styles.sectionTitle, styles.sectionTitleSpaced]}>{t.movie.timeline}</Text>

        <View style={styles.timeline}>
          {history.map((entry) => (
            <View key={entry.hours} style={styles.timelineItem}>
              <View style={styles.timelineTop}>
                <Text style={styles.day}>
                  {formatCheckpoint(entry.hours)}
                  {entry.hours === 0 && firstDelay > 0 ? (
                    <Text style={styles.dayKo}>{` · ${formatDelay(firstDelay)}`}</Text>
                  ) : null}
                </Text>
                <Text style={styles.score}>{entry.score}</Text>
              </View>

              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${entry.score}%` }]} />
              </View>
              {!!entry.note && <Text style={styles.entryNote}>{entry.note}</Text>}
            </View>
          ))}
        </View>

        {available.map((c) => (
          <Pressable
            key={c.hours}
            style={styles.recheckButton}
            onPress={() =>
              router.push({
                pathname: "/recheck",
                params: { id: record.id, hours: String(c.hours) },
              })
            }
          >
            <Text style={styles.recheckTitle}>{t.movie.recordCheckpoint(c.label)}</Text>
            <Text style={styles.recheckSub}>{c.prompt}</Text>
          </Pressable>
        ))}

        <View style={styles.actions}>
          <Pressable
            style={styles.secondary}
            onPress={() => router.push({ pathname: "/share", params: { id: record.id } })}
          >
            <Text style={styles.secondaryText}>{t.movie.shareCard}</Text>
          </Pressable>
          {viewingCount > 1 && (
            <Pressable
              style={styles.secondary}
              onPress={() =>
                router.push({ pathname: "/compare", params: { tmdbId: String(record.tmdbId) } })
              }
            >
              <Text style={styles.secondaryText}>{t.movie.compare}</Text>
            </Pressable>
          )}
        </View>

        <View style={[styles.actions, { marginTop: 10 }]}>
          <Pressable
            style={styles.secondary}
            onPress={() => router.push({ pathname: "/edit", params: { id: record.id } })}
          >
            <Text style={styles.secondaryText}>{t.movie.edit}</Text>
          </Pressable>
          <Pressable style={styles.deleteButton} onPress={remove}>
            <Text style={styles.deleteText}>{t.common.delete}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0b" },
  center: { flex: 1, backgroundColor: "#0b0b0b", alignItems: "center", justifyContent: "center" },
  loading: { color: "#777", fontFamily: fonts.regular },
  content: { padding: 22, paddingBottom: 60 },
  header: { flexDirection: "row", alignItems: "flex-end" },
  poster: { width: 116, height: 174, borderRadius: 15 },
  headerCopy: { flex: 1, paddingLeft: 18, paddingBottom: 8 },
  title: { color: "#fff", fontSize: 25, lineHeight: 32, fontFamily: fonts.semibold },
  meta: { color: "#666", marginTop: 8, fontFamily: fonts.regular },
  metaNum: { fontFamily: fonts.display, fontSize: 15, letterSpacing: 0.6 },
  noteBox: { marginTop: 24, borderLeftWidth: 2, borderLeftColor: "#444", paddingLeft: 14 },
  noteLabel: { color: "#666", fontSize: 11, letterSpacing: 1.2, fontFamily: fonts.semibold },
  noteText: { color: "#d8d8d8", fontSize: 16, lineHeight: 24, marginTop: 7, fontFamily: fonts.regular },
  statementBox: { marginTop: 28, marginBottom: 34, backgroundColor: "#151515", borderRadius: 18, padding: 20 },
  typeBadge: { color: "#777", fontSize: 12, letterSpacing: 1.6, marginBottom: 8, fontFamily: fonts.display },
  typeBody: { color: "#888", fontSize: 13, marginTop: 6, fontFamily: fonts.regular },
  entryNote: { color: "#bbb", fontSize: 14, lineHeight: 21, marginTop: 10, fontFamily: fonts.regular },
  statement: { color: "#fff", fontSize: 18, lineHeight: 27, fontFamily: fonts.semibold },
  sectionTitleSpaced: { marginTop: 30 },
  sectionTitle: { color: "#fff", fontSize: 19, marginBottom: 14, fontFamily: fonts.semibold },
  timeline: { gap: 12 },
  timelineItem: { backgroundColor: "#131313", borderRadius: 16, padding: 16 },
  timelineTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 },
  day: { color: "#777", fontSize: 13, letterSpacing: 1.6, fontFamily: fonts.display },
  dayKo: { fontFamily: fonts.medium, fontSize: 11, letterSpacing: 0 },
  score: { color: "#fff", fontSize: 38, fontFamily: fonts.display },
  barTrack: { height: 7, backgroundColor: "#252525", borderRadius: 99, overflow: "hidden" },
  barFill: { height: "100%", backgroundColor: "#efefef", borderRadius: 99 },
  recheckButton: { marginTop: 18, borderRadius: 18, backgroundColor: "#f2f2f2", padding: 18 },
  recheckTitle: { color: "#111", fontSize: 17, fontFamily: fonts.semibold },
  recheckSub: { color: "#555", marginTop: 6, lineHeight: 20, fontFamily: fonts.regular },
  actions: { flexDirection: "row", gap: 10, marginTop: 26 },
  secondary: { flex: 1, borderWidth: 1, borderColor: "#333", borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  secondaryText: { color: "#ddd", fontFamily: fonts.semibold },
  deleteButton: { borderRadius: 14, paddingHorizontal: 22, justifyContent: "center", backgroundColor: "#211313" },
  deleteText: { color: "#e58f8f", fontFamily: fonts.semibold },
});
