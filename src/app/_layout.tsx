import { Stack, router } from "expo-router";
import * as Notifications from "expo-notifications";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { InstrumentSerif_400Regular } from "@expo-google-fonts/instrument-serif";
import Storage from "expo-sqlite/kv-store";
import { getRecords } from "../lib/storage";
import { rescheduleReminders } from "../lib/notifications";
import { initLanguage, useLanguage, useT } from "../lib/i18n";

const LETTER_MIGRATION_KEY = "yeoun.migration.letter720.v1";

/**
 * 1.1.0에서 "한 달 뒤" 시점이 생겼다. 업데이트 전에 남긴 기록에는 그 알림이 걸려 있지 않으니
 * 처음 한 번만, 아직 한 달이 안 지난 기록의 알림을 다시 건다. (권한이 없으면 조용히 넘어간다.)
 */
async function migrateLetterReminders() {
  if (await Storage.getItem(LETTER_MIGRATION_KEY)) return;
  const monthAgo = Date.now() - 720 * 60 * 60 * 1000;
  const records = await getRecords();
  for (const r of records) {
    if (new Date(r.watchedAt).getTime() > monthAgo) {
      await rescheduleReminders(r).catch(console.warn);
    }
  }
  await Storage.setItem(LETTER_MIGRATION_KEY, new Date().toISOString());
}

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    InstrumentSerif: InstrumentSerif_400Regular,
    PretendardRegular: require("../../assets/fonts/Pretendard-Regular.otf"),
    PretendardMedium: require("../../assets/fonts/Pretendard-Medium.otf"),
    PretendardSemiBold: require("../../assets/fonts/Pretendard-SemiBold.otf"),
  });

  const [langReady, setLangReady] = useState(false);
  const lang = useLanguage();
  const t = useT();

  useEffect(() => {
    initLanguage().finally(() => setLangReady(true));
  }, []);

  useEffect(() => {
    if ((loaded || error) && langReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, langReady]);

  // 알림을 누르면 해당 영화의 상세 화면으로 이동한다. (앱이 꺼져 있다가 열린 경우 포함)
  useEffect(() => {
    if (!loaded && !error) return;

    const open = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as
        | { type?: string; recordId?: string }
        | undefined;
      if (data?.type === "yeoun-recheck" && data.recordId) {
        router.push({ pathname: "/movie", params: { id: data.recordId } });
      }
    };

    migrateLetterReminders().catch(console.warn);

    const last = Notifications.getLastNotificationResponse();
    if (last) open(last);

    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    return () => subscription.remove();
  }, [loaded, error]);

  if ((!loaded && !error) || !langReady) {
    return null;
  }

  return (
    // 언어를 바꾸면 화면 전체를 새 언어로 다시 그린다. (홈으로 돌아간다)
    <Stack
      key={lang}
      screenOptions={{
        headerStyle: { backgroundColor: "#0B0B0B" },
        headerTintColor: "#FFFFFF",
        headerShadowVisible: false,
        contentStyle: { backgroundColor: "#0B0B0B" },
        headerTitleStyle: {
          fontFamily: "PretendardSemiBold",
        },
        // iOS 뒤로가기 버튼에 이전 화면 이름("index")이 보이지 않게 한다.
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          title: t.titles.home,
        }}
      />
      <Stack.Screen name="search" options={{ title: t.titles.search }} />
      <Stack.Screen name="record" options={{ title: t.titles.record }} />
      <Stack.Screen name="movie" options={{ title: t.titles.movie }} />
      <Stack.Screen name="recheck" options={{ title: t.titles.recheck }} />
      <Stack.Screen name="stats" options={{ title: t.titles.stats }} />
      <Stack.Screen name="archive" options={{ title: t.titles.archive }} />
      <Stack.Screen name="edit" options={{ title: t.titles.edit }} />
      <Stack.Screen name="about" options={{ title: t.titles.about }} />
      <Stack.Screen name="share" options={{ title: t.titles.share }} />
      <Stack.Screen name="recap" options={{ title: t.titles.recap }} />
      <Stack.Screen name="compare" options={{ title: t.titles.compare }} />
    </Stack>
  );
}
