import UpgradeRequiredScreen from "@/src/upgrade/UpgradeRequiredScreen";
import Constants from "expo-constants";
import { Platform } from "react-native";

export default function UpgradeRequiredRoute() {
  const platform = Platform.OS === "ios" ? "ios" : "android";
  const version = Constants.expoConfig?.version ?? "?";

  return (
    <UpgradeRequiredScreen
      status={{
        platform,
        current: { version },
        minimumSupported: { version: "?" },
        storeUrl: null,
        message: undefined,
      }}
    />
  );
}

