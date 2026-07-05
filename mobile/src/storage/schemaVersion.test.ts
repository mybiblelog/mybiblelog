import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SCHEMA_VERSION_KEY,
  getStoredSchemaVersion,
  setStoredSchemaVersion,
} from "./schemaVersion";

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("getStoredSchemaVersion", () => {
  it("reads 0 when nothing is stored (fresh install / pre-framework build)", async () => {
    expect(await getStoredSchemaVersion()).toBe(0);
  });

  it("reads 0 for a non-numeric / garbage value", async () => {
    await AsyncStorage.setItem(SCHEMA_VERSION_KEY, "not-a-number");
    expect(await getStoredSchemaVersion()).toBe(0);
  });

  it("reads 0 for a negative value", async () => {
    await AsyncStorage.setItem(SCHEMA_VERSION_KEY, "-3");
    expect(await getStoredSchemaVersion()).toBe(0);
  });

  it("round-trips a stored version", async () => {
    await setStoredSchemaVersion(4);
    expect(await getStoredSchemaVersion()).toBe(4);
  });
});
