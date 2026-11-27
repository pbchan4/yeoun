import { ScrollView, StyleSheet, Text, View } from "react-native";
import { fonts } from "../lib/typography";
import { useT } from "../lib/i18n";

export type BandItem = {
  id: string;
  color: string | null;
  /** 최신 여운 점수 0~100. 낮을수록 색이 옅어진다. */
  score: number;
  label: string;
};

/** 관람한 영화를 시간순으로 이어 붙인 색 띠. 한 칸이 영화 한 편이다. */
export function ColorBand({ items }: { items: BandItem[] }) {
  const t = useT();
  if (!items.length) return null;

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.band}>
        {items.map((item) => {
          const strength = Math.max(0, Math.min(100, item.score)) / 100;
          return (
            <View
              key={item.id}
              style={styles.cell}
              accessibilityLabel={t.band.a11y(item.label, item.score)}
            >
              <View
                style={[
                  styles.fill,
                  {
                    backgroundColor: item.color ?? "#555555",
                    opacity: 0.25 + 0.75 * strength,
                    height: 24 + 36 * strength,
                  },
                ]}
              />
            </View>
          );
        })}
      </ScrollView>
      <Text style={styles.caption}>{t.band.caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  band: { alignItems: "flex-end", gap: 3, paddingVertical: 4 },
  cell: { width: 14, height: 60, justifyContent: "flex-end" },
  fill: { width: 14, borderRadius: 2 },
  caption: {
    color: "#6D6D6D",
    fontSize: 11,
    fontFamily: fonts.regular,
    marginTop: 8,
  },
});
