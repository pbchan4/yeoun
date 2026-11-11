import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export async function prepareNotifications() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("yeoun-reminders", {
      name: "여운 리마인더",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.status === "granted") return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === "granted";
}

export async function scheduleYeounReminders(
  movieTitle: string,
  watchedAtIso: string
) {
  const allowed = await prepareNotifications();
  if (!allowed) return;

  const watchedAt = new Date(watchedAtIso);

  const day3 = new Date(watchedAt);
  day3.setDate(day3.getDate() + 3);
  day3.setHours(20, 0, 0, 0);

  const day14 = new Date(watchedAt);
  day14.setDate(day14.getDate() + 14);
  day14.setHours(20, 0, 0, 0);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "3일이 지났어요.",
      body: `아직 ${movieTitle}이(가) 마음에 남아 있나요?`,
      data: { type: "yeoun-recheck", day: 3 },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: day3,
      channelId: "yeoun-reminders",
    },
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "2주가 지났어요.",
      body: `${movieTitle}의 여운은 지금 얼마나 남아 있나요?`,
      data: { type: "yeoun-recheck", day: 14 },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: day14,
      channelId: "yeoun-reminders",
    },
  });
}
