import { Stack, router } from "expo-router";
import * as Notifications from "expo-notifications";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { InstrumentSerif_400Regular } from "@expo-google-fonts/instrument-serif";

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

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

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

    const last = Notifications.getLastNotificationResponse();
    if (last) open(last);

    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    return () => subscription.remove();
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <Stack
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
          title: "여운",
        }}
      />
      <Stack.Screen name="search" options={{ title: "영화 찾기" }} />
      <Stack.Screen name="record" options={{ title: "첫인상 기록" }} />
      <Stack.Screen name="movie" options={{ title: "여운" }} />
      <Stack.Screen name="recheck" options={{ title: "다시 남은 여운" }} />
      <Stack.Screen name="stats" options={{ title: "나의 여운" }} />
      <Stack.Screen name="archive" options={{ title: "아카이브" }} />
      <Stack.Screen name="edit" options={{ title: "기록 수정" }} />
      <Stack.Screen name="about" options={{ title: "정보" }} />
    </Stack>
  );
}
