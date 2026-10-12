import { useEffect } from "react";
import { useT } from "@/src/i18n/LocaleProvider";
import { consumeDroppedChanges, useSyncNoticesStore } from "@/src/stores/syncNotices";
import { useToast } from "./ToastProvider";

/**
 * Tell the user when a sync discarded changes the server permanently rejected
 * (see `stores/syncNotices.ts`). Mounted once, inside `ToastProvider`.
 */
export function useSyncDropToasts(): void {
  const t = useT();
  const { showToast } = useToast();
  const droppedCount = useSyncNoticesStore((s) => s.droppedCount);

  useEffect(() => {
    if (droppedCount === 0) return;
    const count = consumeDroppedChanges();
    if (count === 0) return;
    showToast({
      type: "error",
      prominent: true,
      message:
        count === 1
          ? t("sync_changes_not_saved_one", { count })
          : t("sync_changes_not_saved_other", { count }),
    });
  }, [droppedCount, showToast, t]);
}
