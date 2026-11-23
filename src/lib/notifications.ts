import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { CHECKPOINTS } from "./checkpoints";
import type { YeounRecord } from "./storage";

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

/** 밤 11시~아침 8시에는 알림이 울리지 않도록 아침 8시로 미룬다. */
function avoidQuietHours(date: Date) {
  const d = new Date(date);
  const hour = d.getHours();
  if (hour >= 23) d.setDate(d.getDate() + 1);
  if (hour >= 23 || hour < 8) d.setHours(8, 0, 0, 0);
  return d;
}

export async function scheduleYeounReminders(
  movieTitle: string,
  watchedAtIso: string,
  recordId: string,
  delayHours = 0,
  options: { note?: string; skipHours?: number[] } = {}
) {
  const allowed = await prepareNotifications();
  if (!allowed) return;

  const watchedAt = new Date(watchedAtIso).getTime();

  for (const checkpoint of CHECKPOINTS) {
    // 첫인상을 남기기 전에 이미 지나간 시점은 건너뛴다.
    if (checkpoint.hours <= delayHours) continue;
    // 이미 기록한 시점은 다시 묻지 않는다.
    if (options.skipHours?.includes(checkpoint.hours)) continue;

    const when = avoidQuietHours(
      new Date(watchedAt + checkpoint.hours * 60 * 60 * 1000)
    );
    if (when.getTime() <= Date.now()) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: checkpoint.notifyTitle,
        body: checkpoint.notifyBody(movieTitle, options.note),
        data: { type: "yeoun-recheck", hours: checkpoint.hours, recordId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: when,
        channelId: "yeoun-reminders",
      },
    });
  }
}

/**
 * 기록에 걸린 리마인더를 취소한다. hours를 주면 그 시점 알림만 취소한다.
 * 기록을 삭제했거나 이미 그 시점의 여운을 남겼을 때 쓴다.
 */
export async function cancelReminders(recordId: string, hours?: number) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();

  await Promise.all(
    scheduled
      .filter((n) => {
        const data = n.content.data as
          | { recordId?: string; hours?: number }
          | undefined;
        return (
          data?.recordId === recordId &&
          (hours === undefined || data.hours === hours)
        );
      })
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

/** 관람 시각이나 한 줄이 바뀌었을 때, 남은 알림을 지우고 다시 건다. */
export async function rescheduleReminders(record: YeounRecord) {
  await cancelReminders(record.id);
  await scheduleYeounReminders(
    record.title,
    record.watchedAt,
    record.id,
    record.firstImpressionDelayHours ?? 0,
    {
      note: record.note,
      skipHours: (record.resonanceHistory ?? []).map((e) => e.hours),
    }
  );
}
