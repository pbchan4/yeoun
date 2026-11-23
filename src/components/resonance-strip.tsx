import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { CHECKPOINTS, formatCheckpoint } from "../lib/checkpoints";
import type { ResonanceEntry } from "../lib/storage";
import { fonts } from "../lib/typography";

type Props = {
  history: ResonanceEntry[];
  posterUri: string | null;
  /** 영화가 끝난 뒤 첫인상까지 걸린 시간. 이 시간 이전의 시점은 빈 프레임으로 보여주지 않는다. */
  delayHours?: number;
};

type Frame =
  | { kind: "done"; hours: number; label: string; score: number }
  | { kind: "pending"; hours: number; label: string; ko: string };

/**
 * 여운이 시간에 따라 어떻게 옅어지는지 포스터 한 장으로 보여준다.
 * 점수가 낮을수록 같은 포스터가 더 흐리고 투명해진다.
 * 아직 기록하지 않은 시점은 빈 프레임으로 남긴다.
 */
export function ResonanceStrip({ history, posterUri, delayHours = 0 }: Props) {
  const done = new Set(history.map((e) => e.hours));

  const frames: Frame[] = [
    ...history.map<Frame>((e) => ({
      kind: "done",
      hours: e.hours,
      label: formatCheckpoint(e.hours),
      score: e.score,
    })),
    ...CHECKPOINTS.filter((c) => !done.has(c.hours) && c.hours > delayHours).map<Frame>((c) => ({
      kind: "pending",
      hours: c.hours,
      label: formatCheckpoint(c.hours),
      ko: c.label,
    })),
  ].sort((a, b) => a.hours - b.hours);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.strip}
    >
      {frames.map((frame) => {
        if (frame.kind === "pending") {
          return (
            <View
              key={frame.hours}
              style={styles.item}
              accessibilityLabel={`${frame.ko} 여운 아직 기록하지 않음`}
            >
              <View style={[styles.frame, styles.pendingFrame]} />
              <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit>
                {frame.label}
              </Text>
              <Text style={styles.score}>—</Text>
            </View>
          );
        }

        const strength = Math.max(0, Math.min(100, frame.score)) / 100;
        const opacity = 0.2 + 0.8 * strength;
        const blur = Math.round((1 - strength) * 10);

        return (
          <View
            key={frame.hours}
            style={styles.item}
            accessibilityLabel={`${frame.label} 여운 ${frame.score}`}
          >
            <View style={styles.frame}>
              {posterUri ? (
                <Image
                  source={{ uri: posterUri }}
                  style={[StyleSheet.absoluteFill, { opacity }]}
                  blurRadius={blur}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[StyleSheet.absoluteFill, styles.fallback, { opacity }]}
                />
              )}
            </View>
            <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit>
              {frame.label}
            </Text>
            <Text style={styles.score}>{frame.score}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: {
    gap: 12,
    paddingVertical: 4,
  },
  item: {
    width: 84,
  },
  frame: {
    width: 84,
    height: 126,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#151515",
  },
  pendingFrame: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderStyle: "dashed",
  },
  fallback: {
    backgroundColor: "#8D8D8D",
  },
  label: {
    color: "#929292",
    fontSize: 12,
    fontFamily: fonts.display,
    letterSpacing: 0.8,
    marginTop: 8,
  },
  score: {
    color: "#F2F2F2",
    fontSize: 21,
    fontFamily: fonts.display,
    marginTop: 2,
  },
});
