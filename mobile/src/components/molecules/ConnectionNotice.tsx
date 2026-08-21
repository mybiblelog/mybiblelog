import { useConnectionStatus } from "@/src/stores/connectivity";
import { InlineHint } from "./InlineHint";

type Props = {
  /** Caption shown when the device itself has no network. */
  offlineText: string;
  /** Caption shown when the device is online but our API can't be reached. */
  unreachableText: string;
  testID?: string;
};

/**
 * Explains why a server-only action isn't available right now, and renders
 * nothing while the server is reachable. Pairs with a hidden or disabled
 * control: a control the user can't use needs a stated reason, or it reads as
 * a bug.
 *
 * The two messages are separate props because "you're offline" and "we can't
 * reach My Bible Log" call for different user actions.
 */
export function ConnectionNotice({ offlineText, unreachableText, testID }: Props) {
  const status = useConnectionStatus();
  if (status === "online" || status === "unknown") return null;

  const isDeviceOffline = status === "device-offline";
  return (
    <InlineHint
      testID={testID}
      icon={isDeviceOffline ? "cloud-offline-outline" : "alert-circle-outline"}
      text={isDeviceOffline ? offlineText : unreachableText}
    />
  );
}
