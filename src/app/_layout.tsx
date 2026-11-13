import { Stack } from "expo-router";
import * as Notifications from "expo-notifications";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

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
    PretendardRegular: require("../../assets/fonts/Pretendard-Regular.otf"),
    PretendardMedium: require("../../assets/fonts/Pretendard-Medium.otf"),
    PretendardSemiBold: require("../../assets/fonts/Pretendard-SemiBold.otf"),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
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
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name="search" options={{ title: "영화 찾기" }} />
      <Stack.Screen name="record" options={{ title: "첫인상 기록" }} />
      <Stack.Screen name="movie" options={{ title: "여운" }} />
      <Stack.Screen name="recheck" options={{ title: "다시 남은 여운" }} />
      <Stack.Screen name="stats" options={{ title: "나의 여운" }} />
      <Stack.Screen name="archive" options={{ title: "아카이브" }} />
      <Stack.Screen name="edit" options={{ title: "기록 수정" }} />
    </Stack>
  );
}
