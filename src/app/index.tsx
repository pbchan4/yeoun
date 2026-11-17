import { Link, router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Pressable,
  FlatList,
  Image,
  StatusBar,
  Platform,

} from "react-native";
import { getRecords, YeounRecord } from "../lib/storage";
import { getHistory, getLatest } from "../lib/resonance";
import { CHECKPOINTS, formatCheckpoint } from "../lib/checkpoints";
import { posterUrl } from "../lib/tmdb";
import { fonts } from "../lib/typography";

export default function HomeScreen() {
  const [records, setRecords] = useState<YeounRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      getRecords().then(setRecords).catch(console.error);
    }, [])
  );

  const featured = useMemo(() => {
    if (!records.length) return null;
    return records.reduce((best, r) =>
      getLatest(r).score > getLatest(best).score ? r : best
    );
  }, [records]);

  // 알림을 놓쳤어도 여기서 바로 이어서 기록할 수 있게, 지금 물어볼 차례인 영화를 모은다.
  const pending = useMemo(() => {
    const now = Date.now();
    const list: { record: YeounRecord; hours: number; label: string }[] = [];
    for (const r of records) {
      const elapsed = (now - new Date(r.watchedAt).getTime()) / (1000 * 60 * 60);
      const done = new Set(getHistory(r).map((e) => e.hours));
      const delay = r.firstImpressionDelayHours ?? 0;
      const due = CHECKPOINTS.find(
        (c) => c.hours > delay && elapsed >= c.hours && !done.has(c.hours)
      );
      if (due) list.push({ record: r, hours: due.hours, label: due.label });
    }
    return list;
  }, [records]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      <FlatList
        data={records.slice(0, 5)}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <View style={styles.brandBlock}>
              <View style={styles.brandCopy}>
                <Image
                  source={require("../../assets/images/yeoun-wordmark-light.png")}
                  style={styles.logo}
                  resizeMode="contain"
                  accessibilityLabel="YEOUN"
                />
                <Text style={styles.tagline}>
                  영화가 끝난 뒤,{"\n"}여운은 시작된다.
                </Text>
              </View>

              <View style={styles.topActions}>
                <Link href="/archive" asChild>
                  <Pressable
                    style={styles.iconButton}
                    accessibilityRole="button"
                    accessibilityLabel="아카이브 보기"
                  >
                    <Text style={styles.iconButtonText}>아카이브</Text>
                  </Pressable>
                </Link>

                <Link href="/stats" asChild>
                  <Pressable
                    style={styles.iconButton}
                    accessibilityRole="button"
                    accessibilityLabel="나의 여운 통계 보기"
                  >
                    <Text style={styles.iconButtonText}>나의 여운</Text>
                  </Pressable>
                </Link>
              </View>
            </View>

            <View style={styles.hero}>
              <Text style={styles.eyebrow}>AFTER THE FILM</Text>

              <Text style={styles.heroTitle}>
                오늘 본 영화가{"\n"}
                아직 마음에{"\n"}
                남아 있나요?
              </Text>

              <Text style={styles.heroBody}>
                별점 대신 첫인상을 남기고, 시간이 지난 뒤 진짜 여운을 기록해보세요.
              </Text>

              <Link href="/search" asChild>
                <Pressable style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>영화 기록하기</Text>
                  <Text style={styles.primaryArrow}>→</Text>
                </Pressable>
              </Link>
            </View>

            {pending.length > 0 && (
              <View style={styles.pendingBlock}>
                <Text style={styles.pendingEyebrow}>RECHECK</Text>
                <Text style={styles.pendingTitle}>지금 물어볼 여운이 있어요</Text>

                {pending.slice(0, 3).map((p) => (
                  <Pressable
                    key={p.record.id}
                    style={styles.pendingCard}
                    onPress={() =>
                      router.push({
                        pathname: "/recheck",
                        params: { id: p.record.id, hours: String(p.hours) },
                      })
                    }
                  >
                    <View style={styles.pendingBody}>
                      <Text numberOfLines={1} style={styles.pendingMovie}>
                        {p.record.title}
                      </Text>
                      <Text style={styles.pendingLabel}>{p.label}의 여운 기록하기</Text>
                    </View>
                    <Text style={styles.pendingArrow}>→</Text>
                  </Pressable>
                ))}

                {pending.length > 3 && (
                  <Text style={styles.pendingMore}>
                    그 외 {pending.length - 3}편은 최근 기록에서 열어 주세요.
                  </Text>
                )}
              </View>
            )}

            {featured && (() => {
              const latest = getLatest(featured);
              const image = posterUrl(featured.posterPath);

              return (
                <Pressable
                  style={styles.featured}
                  onPress={() =>
                    router.push({
                      pathname: "/movie",
                      params: { id: featured.id },
                    })
                  }
                >
                  {image ? (
                    <Image
                      source={{ uri: image }}
                      style={styles.featuredPoster}
                    />
                  ) : (
                    <View style={styles.featuredPosterFallback} />
                  )}

                  <View style={styles.featuredTopFade} />
                  <View style={styles.featuredBottomFade} />

                  <View style={styles.featuredTopCopy}>
                    <Text style={styles.featuredEyebrow}>
                      STILL LINGERING
                    </Text>
                  </View>

                  <View style={styles.featuredCopy}>
                    <Text style={styles.featuredTitle} numberOfLines={2}>
                      {featured.title}
                    </Text>

                    <View style={styles.featuredMetaRow}>
                      <Text style={styles.featuredMeta}>
                        {formatCheckpoint(latest.hours)}
                      </Text>

                      <View style={styles.dot} />

                      <Text style={styles.featuredScore}>
                        {latest.score}
                      </Text>
                    </View>

                    <Text style={styles.featuredCaption}>
                      지금 가장 강하게 남아 있는 영화
                    </Text>
                  </View>
                </Pressable>
              );
            })()}

            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>RECENT</Text>
                <Text style={styles.sectionTitle}>최근 기록</Text>
              </View>

              {records.length > 0 && (
                <Link href="/archive" asChild>
                  <Pressable>
                    <Text style={styles.viewAll}>전체 보기</Text>
                  </Pressable>
                </Link>
              )}
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>아직 기록이 없어요.</Text>
            <Text style={styles.emptyBody}>
              첫 영화를 기록하면 여기에 기억의 흐름이 쌓이기 시작해요.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const image = posterUrl(item.posterPath);
          const latest = getLatest(item);

          return (
            <Pressable
              style={styles.recordCard}
              onPress={() =>
                router.push({
                  pathname: "/movie",
                  params: { id: item.id },
                })
              }
            >
              {image ? (
                <Image source={{ uri: image }} style={styles.recordPoster} />
              ) : (
                <View style={styles.recordPosterFallback} />
              )}

              <View style={styles.recordBody}>
                <View style={styles.recordTop}>
                  <View style={styles.recordTitleWrap}>
                    <Text numberOfLines={1} style={styles.recordTitle}>
                      {item.title}
                    </Text>

                    {(item.rewatchIndex ?? 1) > 1 && (
                      <Text style={styles.rewatchBadge}>
                        {item.rewatchIndex}회차
                      </Text>
                    )}
                  </View>

                  <Text style={styles.chevron}>›</Text>
                </View>

                <Text style={styles.recordDate}>
                  {new Date(item.watchedAt).toLocaleDateString("ko-KR")}
                </Text>

                <View style={styles.recordScoreRow}>
                  <View>
                    <Text style={styles.scoreEyebrow}>
                      {latest.hours === 0 ? formatCheckpoint(0) : `${formatCheckpoint(latest.hours)} · YEOUN`}
                    </Text>

                    <Text style={styles.recordScore}>
                      {latest.score}
                    </Text>
                  </View>

                  <View style={styles.scoreLineWrap}>
                    <View style={styles.scoreLineTrack}>
                      <View
                        style={[
                          styles.scoreLineFill,
                          { width: `${latest.score}%` },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </Pressable>
          );
        }}
        ListFooterComponent={
          <View>
            {records.length > 0 && (
              <Text style={styles.footer}>
                영화가 남긴 것을 천천히 모아보세요.
              </Text>
            )}
            <Link href="/about" asChild>
              <Pressable accessibilityRole="button" accessibilityLabel="앱 정보 보기">
                <Text style={styles.aboutLink}>정보 · TMDB</Text>
              </Pressable>
            </Link>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0B0B0B",
  },

  content: {
    paddingHorizontal: 24,
    // 안드로이드는 SafeAreaView가 상태 표시줄 높이를 비워 주지 않아 로고가 시계와 겹친다.
    paddingTop: 14 + (Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0),
    paddingBottom: 56,
  },

  brandBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  brandCopy: {
    flexShrink: 1,
  },

  logo: {
  width: 150,
  height: 58,
  },

  tagline: {
    color: "#929292",
    fontSize: 13,
    fontFamily: "PretendardRegular",
    marginTop: 9,
    lineHeight: 20,
    letterSpacing: -0.2,
  },

  topActions: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 2,
    flexShrink: 0,
  },

  iconButton: {
    height: 36,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  iconButtonText: {
    color: "#A7A7A7",
    fontSize: 12,
    fontFamily: "PretendardMedium",
    letterSpacing: -0.1,
  },

  hero: {
    paddingTop: 54,
    paddingBottom: 42,
  },

  eyebrow: {
    color: "#6D6D6D",
    fontSize: 13,
    fontFamily: fonts.display,
    letterSpacing: 2.4,
    marginBottom: 18,
  },

  heroTitle: {
    color: "#F4F4F4",
    fontSize: 39,
    lineHeight: 54,
    fontFamily: "PretendardMedium",
    letterSpacing: -1.45,
  },

  heroBody: {
    color: "#9B9B9B",
    fontSize: 15,
    fontFamily: "PretendardRegular",
    lineHeight: 25,
    marginTop: 22,
    maxWidth: 342,
    letterSpacing: -0.25,
  },

  primaryButton: {
    backgroundColor: "#F2F2F2",
    borderRadius: 15,
    paddingHorizontal: 18,
    paddingVertical: 17,
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  primaryButtonText: {
    color: "#111111",
    fontSize: 16,
    fontFamily: "PretendardSemiBold",
    letterSpacing: -0.2,
  },

  primaryArrow: {
    color: "#111111",
    fontSize: 20,
    fontFamily: "PretendardRegular",
  },

  pendingBlock: {
    marginBottom: 34,
  },

  pendingEyebrow: {
    color: "#97B7A7",
    fontSize: 13,
    fontFamily: fonts.display,
    letterSpacing: 2.2,
    marginBottom: 7,
  },

  pendingTitle: {
    color: "#F1F1F1",
    fontSize: 20,
    fontFamily: fonts.semibold,
    letterSpacing: -0.4,
    marginBottom: 14,
  },

  pendingCard: {
    backgroundColor: "#141414",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#22373C",
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  pendingBody: {
    flex: 1,
  },

  pendingMovie: {
    color: "#F2F2F2",
    fontSize: 16,
    fontFamily: fonts.semibold,
    letterSpacing: -0.3,
  },

  pendingLabel: {
    color: "#97B7A7",
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 5,
  },

  pendingArrow: {
    color: "#97B7A7",
    fontSize: 20,
    fontFamily: fonts.regular,
    marginLeft: 12,
  },

  pendingMore: {
    color: "#6D6D6D",
    fontSize: 12,
    fontFamily: fonts.regular,
    marginTop: 2,
  },

  featured: {
    height: 258,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 34,
    backgroundColor: "#151515",
  },

  featuredPoster: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  featuredPosterFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#181818",
  },

  featuredTopFade: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 76,
    backgroundColor: "rgba(0,0,0,0.20)",
  },

  featuredBottomFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 145,
    backgroundColor: "rgba(0,0,0,0.58)",
  },

  featuredTopCopy: {
    position: "absolute",
    top: 16,
    left: 18,
    right: 18,
  },

  featuredEyebrow: {
    color: "#E5E5E5",
    fontSize: 13,
    fontFamily: fonts.display,
    letterSpacing: 2.4,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },

  featuredCopy: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 18,
  },

  featuredTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 32,
    fontFamily: "PretendardSemiBold",
    letterSpacing: -0.7,
    textShadowColor: "rgba(0,0,0,0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },

  featuredMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  featuredMeta: {
    color: "#D0D0D0",
    fontSize: 10,
    fontFamily: "PretendardMedium",
    letterSpacing: 1.8,
  },

  dot: {
    width: 3,
    height: 3,
    borderRadius: 99,
    backgroundColor: "#AFAFAF",
    marginHorizontal: 8,
  },

  featuredScore: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: fonts.display,
    letterSpacing: 0,
  },

  featuredCaption: {
    color: "#B8B8B8",
    fontSize: 12,
    fontFamily: "PretendardRegular",
    lineHeight: 18,
    marginTop: 9,
    letterSpacing: -0.15,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
  },

  sectionEyebrow: {
    color: "#646464",
    fontSize: 13,
    fontFamily: fonts.display,
    letterSpacing: 2.2,
    marginBottom: 7,
  },

  sectionTitle: {
    color: "#F1F1F1",
    fontSize: 22,
    fontFamily: "PretendardSemiBold",
    letterSpacing: -0.5,
  },

  viewAll: {
    color: "#818181",
    fontSize: 12,
    fontFamily: "PretendardRegular",
    paddingVertical: 4,
  },

  empty: {
    backgroundColor: "#131313",
    borderRadius: 16,
    padding: 20,
  },

  emptyTitle: {
    color: "#F0F0F0",
    fontSize: 16,
    fontFamily: "PretendardSemiBold",
  },

  emptyBody: {
    color: "#777777",
    fontSize: 13,
    fontFamily: "PretendardRegular",
    lineHeight: 21,
    marginTop: 8,
  },

  recordCard: {
    backgroundColor: "#141414",
    borderRadius: 18,
    overflow: "hidden",
    flexDirection: "row",
    marginBottom: 14,
    minHeight: 142,
  },

  recordPoster: {
    width: 94,
    height: 142,
    resizeMode: "cover",
  },

  recordPosterFallback: {
    width: 94,
    height: 142,
    backgroundColor: "#202020",
  },

  recordBody: {
    flex: 1,
    padding: 16,
  },

  recordTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  recordTitleWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  recordTitle: {
    flexShrink: 1,
    color: "#F2F2F2",
    fontSize: 16,
    fontFamily: "PretendardSemiBold",
    letterSpacing: -0.35,
  },

  rewatchBadge: {
    color: "#8D8D8D",
    borderWidth: 1,
    borderColor: "#333333",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
    fontSize: 10,
    fontFamily: "PretendardMedium",
  },

  chevron: {
    color: "#5C5C5C",
    fontSize: 25,
    fontFamily: "PretendardRegular",
    marginLeft: 8,
  },

  recordDate: {
    color: "#626262",
    fontSize: 11,
    fontFamily: "PretendardRegular",
    marginTop: 5,
  },

  recordScoreRow: {
    flex: 1,
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },

  scoreEyebrow: {
    color: "#6D6D6D",
    fontSize: 9,
    fontFamily: "PretendardMedium",
    letterSpacing: 1.8,
  },

  recordScore: {
    color: "#FFFFFF",
    fontSize: 38,
    fontFamily: fonts.display,
    letterSpacing: 0,
    marginTop: 2,
  },

  scoreLineWrap: {
    width: 92,
    paddingBottom: 9,
  },

  scoreLineTrack: {
    height: 4,
    backgroundColor: "#292929",
    borderRadius: 99,
    overflow: "hidden",
  },

  scoreLineFill: {
    height: "100%",
    backgroundColor: "#EAEAEA",
    borderRadius: 99,
  },

  aboutLink: {
    color: "#555555",
    textAlign: "center",
    fontSize: 12,
    fontFamily: "PretendardRegular",
    marginTop: 22,
    paddingVertical: 8,
  },

  footer: {
    color: "#555555",
    textAlign: "center",
    fontSize: 12,
    fontFamily: "PretendardRegular",
    marginTop: 28,
  },
});
