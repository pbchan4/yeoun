import {  Image, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { fonts } from "../lib/typography";


export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>ABOUT</Text>
        <Text style={styles.title}>여운에 대해</Text>

        <View style={styles.block}>
          <Text style={styles.label}>데이터</Text>
          <Text style={styles.body}>
            내가 남긴 첫인상과 여운 기록은 이 기기에만 저장돼요. 서버로 보내지 않아요.{"\n\n"}앱을 삭제하거나 기기를 바꾸면 기록이 사라질 수 있어요.
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>영화 정보</Text>
          <Text style={styles.body}>
            영화 제목과 포스터 등 영화 정보는 TMDB에서 가져와요.
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
  notice: { color: "#777", fontSize: 14, lineHeight: 21, marginTop: 14, fontFamily: fonts.display },
  tmdbLogo: { width: 90, height: 65, marginTop: 14 },
});
