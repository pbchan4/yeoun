import { Stack } from "expo-router";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0b0b0b" },
        headerTintColor: "#ffffff",
        headerShadowVisible: false,
        contentStyle: { backgroundColor: "#0b0b0b" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "YEOUN" }} />
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
