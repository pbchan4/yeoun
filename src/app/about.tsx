import { useState } from "react";
import { Alert, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { exportBackup, importBackup } from "../lib/backup";
import { rescheduleRecentReminders } from "../lib/notifications";
import { fonts } from "../lib/typography";
import { getLanguageSetting, LangSetting, setLanguage, useT } from "../lib/i18n";

const LANG_OPTIONS: { value: LangSetting; label?: string }[] = [
  { value: "system" },
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
];


export default function AboutScreen() {
  const t = useT();
  const [langSetting, setLangSetting] = useState<LangSetting>(getLanguageSetting());
  const [busy, setBusy] = useState(false);

  const runExport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await exportBackup();
    } catch (e) {
      Alert.alert(t.about.backupFailed, e instanceof Error ? e.message : t.about.backupFailedDefault);
    } finally {
      setBusy(false);
    }
  };

  const runImport = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await importBackup();
      if (result) {
        Alert.alert(
          t.about.importDone,
          t.about.importBody(result.added, result.updated) +
            (result.skipped ? t.about.importSkipped(result.skipped) : "")
        );
      }
    } catch (e) {
      Alert.alert(t.about.importFailed, e instanceof Error ? e.message : t.about.importFailedDefault);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>ABOUT</Text>
        <Text style={styles.title}>{t.about.title}</Text>

        <View style={styles.block}>
          <Text style={styles.label}>{t.about.languageLabel}</Text>
          <View style={styles.langRow}>
            {LANG_OPTIONS.map((o) => {
              const active = langSetting === o.value;
              return (
                <Pressable
                  key={o.value}
                  style={[styles.langChip, active && styles.langChipActive]}
                  onPress={() => {
                    setLangSetting(o.value);
                    setLanguage(o.value)
                      .then(rescheduleRecentReminders)
                      .catch(console.warn);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.langText, active && styles.langTextActive]}>
                    {o.label ?? t.about.languageSystem}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>{t.about.dataLabel}</Text>
          <Text style={styles.body}>
            {t.about.dataBody}
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>{t.about.backupLabel}</Text>
          <Text style={styles.body}>
            {t.about.backupBody}
          </Text>
          <View style={styles.buttons}>
            <Pressable style={[styles.button, busy && styles.disabled]} disabled={busy} onPress={runExport}>
              <Text style={styles.buttonText}>{t.about.exportCta}</Text>
            </Pressable>
            <Pressable style={[styles.ghost, busy && styles.disabled]} disabled={busy} onPress={runImport}>
              <Text style={styles.ghostText}>{t.about.importCta}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>{t.about.movieInfoLabel}</Text>
          <Text style={styles.body}>
            {t.about.movieInfoBody}
          </Text>
          <Image
            source={require("../../assets/images/tmdb-logo.png")}
            style={styles.tmdbLogo}
            resizeMode="contain"
            accessibilityLabel="TMDB"
          />
          <Text style={styles.notice}>
            This product uses the TMDB API but is not endorsed or certified by TMDB.
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
  title: { color: "#fff", fontSize: 30, marginTop: 10, marginBottom: 28, fontFamily: fonts.semibold },
  block: { marginBottom: 28, borderTopWidth: 1, borderTopColor: "#242424", paddingTop: 18 },
  label: { color: "#888", fontSize: 12, marginBottom: 8, fontFamily: fonts.medium },
    body: { color: "#d0d0d0", fontSize: 15, lineHeight: 24, fontFamily: fonts.regular },
  langRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  langChip: { borderWidth: 1, borderColor: "#333", borderRadius: 99, paddingHorizontal: 16, paddingVertical: 9 },
  langChipActive: { backgroundColor: "#f2f2f2", borderColor: "#f2f2f2" },
  langText: { color: "#ccc", fontSize: 14, fontFamily: fonts.medium },
  langTextActive: { color: "#111" },
  notice: { color: "#777", fontSize: 14, lineHeight: 21, marginTop: 14, fontFamily: fonts.display },
  buttons: { gap: 10, marginTop: 16 },
  button: { backgroundColor: "#f2f2f2", borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  buttonText: { color: "#111", fontSize: 15, fontFamily: fonts.semibold },
  ghost: { borderWidth: 1, borderColor: "#333", borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  ghostText: { color: "#ddd", fontSize: 15, fontFamily: fonts.semibold },
  disabled: { opacity: 0.4 },
  tmdbLogo: { width: 90, height: 65, marginTop: 14 },
});
