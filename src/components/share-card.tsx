import { forwardRef } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { formatCheckpoint } from "../lib/checkpoints";
import type { ResonanceType } from "../lib/resonance";
import { TYPE_INFO } from "../lib/resonance";
import type { ResonanceEntry } from "../lib/storage";
import { fonts } from "../lib/typography";
import type { CaptureView } from "../lib/share";
import { useT } from "../lib/i18n";

/** 인스타 스토리 비율(9:16). 캡처하면 기기 배율만큼 커진다. */
export const CARD_WIDTH = 320;
export const CARD_HEIGHT = 568;
const INNER = CARD_WIDTH - 48;

type Props = {
  title: string;
  posterUri: string | null;
  history: ResonanceEntry[];
  statement: string;
  type: ResonanceType | null;
  note?: string;
  rewatchIndex?: number;
  watchedAt: string;
  onPosterLoad?: () => void;
};

/** 한 영화의 여운을 한 장으로. 포스터가 시점마다 옅어지는 띠가 핵심이다. */
export const ShareCard = forwardRef<CaptureView, Props>(function ShareCard(
  { title, posterUri, history, statement, type, note, rewatchIndex, watchedAt, onPosterLoad },
  ref
) {
  const t = useT();
  const n = Math.max(history.length, 1);
  const frameW = Math.min(64, (INNER - 8 * (n - 1)) / n);

  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <Image
        source={require("../../assets/images/yeoun-wordmark-light.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <View style={styles.posterWrap}>
        {posterUri ? (
          <Image source={{ uri: posterUri }} style={styles.poster} onLoad={onPosterLoad} />
        ) : (
          <View style={[styles.poster, styles.fallback]} />
        )}
      </View>

      <Text style={styles.eyebrow}>
        {type ? TYPE_INFO[type].en : "FIRST IMPRESSION"}
        {(rewatchIndex ?? 1) > 1 ? ` · REWATCH ${rewatchIndex}` : ""}
      </Text>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.statement}>{statement}</Text>

      <View style={styles.frames}>
        {history.map((e) => {
          const strength = Math.max(0, Math.min(100, e.score)) / 100;
          return (
            <View key={e.hours} style={{ width: frameW, alignItems: "center" }}>
              <View style={[styles.frame, { width: frameW, height: frameW * 1.5 }]}>
                {posterUri ? (
                  <Image
                    source={{ uri: posterUri }}
                    style={[StyleSheet.absoluteFill, { opacity: 0.2 + 0.8 * strength }]}
                    blurRadius={Math.round((1 - strength) * 10)}
                  />
                ) : (
                  <View style={[StyleSheet.absoluteFill, styles.fallback, { opacity: 0.2 + 0.8 * strength }]} />
                )}
              </View>
              <Text style={styles.frameLabel} numberOfLines={1} adjustsFontSizeToFit>
                {formatCheckpoint(e.hours)}
              </Text>
              <Text style={styles.frameScore}>{e.score}</Text>
            </View>
          );
        })}
      </View>

      {!!note && (
        <Text style={styles.note} numberOfLines={3}>
          “{note}”
        </Text>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>{new Date(watchedAt).toLocaleDateString(t.dateLocale)}</Text>
        <Text style={styles.footerText}>{t.common.slogan}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: "#0B0B0B",
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 20,
    borderRadius: 4,
    overflow: "hidden",
  },
  logo: { width: 78, height: 30 },
  posterWrap: { alignItems: "center", marginTop: 10 },
  poster: { width: 120, height: 180, borderRadius: 8, backgroundColor: "#151515" },
  fallback: { backgroundColor: "#555555" },
  eyebrow: {
    color: "#6D6D6D",
    fontSize: 11,
    letterSpacing: 2,
    fontFamily: fonts.display,
    marginTop: 18,
    textAlign: "center",
  },
  title: {
    color: "#F4F4F4",
    fontSize: 21,
    lineHeight: 28,
    fontFamily: fonts.semibold,
    textAlign: "center",
    marginTop: 6,
  },
  statement: {
    color: "#A7A7A7",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.regular,
    textAlign: "center",
    marginTop: 6,
  },
  frames: { flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 18 },
  frame: { borderRadius: 3, overflow: "hidden", backgroundColor: "#151515" },
  frameLabel: { color: "#6D6D6D", fontSize: 9, letterSpacing: 0.6, fontFamily: fonts.display, marginTop: 5 },
  frameScore: { color: "#F2F2F2", fontSize: 16, fontFamily: fonts.display },
  note: {
    color: "#D0D0D0",
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.regular,
    textAlign: "center",
    marginTop: 14,
  },
  footer: { marginTop: "auto", alignItems: "center", gap: 2 },
  footerText: { color: "#555", fontSize: 10, fontFamily: fonts.regular },
});
