import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { exportData, importData } from "./storage";
import { rescheduleReminders } from "./notifications";
import { getT } from "./i18n";

function stamp(date = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}`;
}

/** 모든 기록을 JSON 파일로 만들어 공유 시트를 연다. (파일 앱, 드라이브, 메일 등에 저장) */
export async function exportBackup() {
  const data = await exportData();
  const file = new File(Paths.cache, `yeoun-backup-${stamp()}.json`);
  if (file.exists) file.delete();
  file.create();
  await file.write(JSON.stringify(data, null, 2));

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error(getT().errors.fileShareUnavailable);
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: "application/json",
    UTI: "public.json",
    dialogTitle: getT().dialogs.backup,
  });
  return data.records.length;
}

/** 백업 파일을 골라 지금 기록과 합친다. 취소하면 null. */
export async function importBackup() {
  const picked = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/plain", "*/*"],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (picked.canceled || !picked.assets?.length) return null;

  const text = await new File(picked.assets[0].uri).text();
  const result = await importData(text);

  // 가져온 기록 중 아직 오지 않은 시점이 있으면 알림을 다시 건다.
  await Promise.all(result.added.map((r) => rescheduleReminders(r).catch(console.warn)));

  return { added: result.added.length, updated: result.updated, skipped: result.skipped };
}
