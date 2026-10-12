import UpgradeRequiredScreen from "@/src/upgrade/UpgradeRequiredScreen";
import Constants from "expo-constants";
import { Platform } from "react-native";

export default function UpgradeRequiredRoute() {
  const platform = Platform.OS === "ios" ? "ios" : "android";
  const version = Constants.expoConfig?.version ?? "?";
  const androidPackage = Constants.expoConfig?.android?.package;
  const storeUrl =
    platform === "android" && androidPackage
      ? `https://play.google.com/store/apps/details?id=${androidPackage}`
      : null;

  return (
    <UpgradeRequiredScreen
      status={{
        platform,
        current: { version },
        minimumSupported: { version: "?" },
        storeUrl,
        message: undefined,
      }}
    />
  );
}
