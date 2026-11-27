import type { ComponentRef, RefObject } from "react";
import type { View } from "react-native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { getT } from "./i18n";

/** 캡처할 View의 인스턴스 타입. (새 RN 타입에서는 `View` 자체가 컴포넌트 함수 타입이다.) */
export type CaptureView = ComponentRef<typeof View>;

/** 화면의 View를 PNG로 찍어 공유 시트를 연다. (인스타 스토리, 메시지, 사진 저장 등) */
export async function shareViewAsImage(ref: RefObject<CaptureView | null>, dialogTitle = getT().dialogs.share) {
  if (!ref.current) throw new Error(getT().errors.cardNotFound);

  const uri = await captureRef(ref as Parameters<typeof captureRef>[0], { format: "png", quality: 1, result: "tmpfile" });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error(getT().errors.shareUnavailable);
  }
  await Sharing.shareAsync(uri, { mimeType: "image/png", UTI: "public.png", dialogTitle });
}
