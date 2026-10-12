import AsyncStorage from "@react-native-async-storage/async-storage";
import { up } from "./0003-pending-push-fields";

const V1_KEY = "userSettings.pendingServerPush.v1";
const V2_KEY = "userSettings.pendingServerPush.v2";

async function readV2(): Promise<unknown> {
  const raw = await AsyncStorage.getItem(V2_KEY);
  return raw ? JSON.parse(raw) : null;
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("migration 0003 (pending settings push fields)", () => {
  it("converts a pending v1 flag into the wizard's fields, never the look-back date", async () => {
    await AsyncStorage.setItem(V1_KEY, "true");
    await up();
    expect(await readV2()).toEqual(["dailyVerseCountGoal", "preferredBibleVersion"]);
    expect(await AsyncStorage.getItem(V1_KEY)).toBeNull();
  });

  it("drops a v1 flag that was already cleared", async () => {
    await AsyncStorage.setItem(V1_KEY, "false");
    await up();
    expect(await readV2()).toBeNull();
    expect(await AsyncStorage.getItem(V1_KEY)).toBeNull();
  });

  it("is a no-op when nothing is stored", async () => {
    await up();
    expect(await readV2()).toBeNull();
  });

  it("is idempotent — does not overwrite an existing v2 value", async () => {
    await AsyncStorage.setItem(V1_KEY, "true");
    await AsyncStorage.setItem(V2_KEY, JSON.stringify(["dailyVerseCountGoal"]));
    await up();
    expect(await readV2()).toEqual(["dailyVerseCountGoal"]);
  });
});
