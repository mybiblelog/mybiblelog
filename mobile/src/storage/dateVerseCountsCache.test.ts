import AsyncStorage from "@react-native-async-storage/async-storage";
import { deleteCache, getCache, setCache } from "./dateVerseCountsCache";

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.useRealTimers();
});

describe("dateVerseCountsCache", () => {
  it("returns null on a miss", async () => {
    expect(await getCache("k")).toBeNull();
  });

  it("returns the value before expiry", async () => {
    await setCache("k", { a: 1 }, 5);
    expect(await getCache("k")).toEqual({ a: 1 });
  });

  it("returns null and evicts the key after expiry", async () => {
    await setCache("k", { a: 1 }, 5);
    // Advance wall clock past the 5-minute TTL.
    const realNow = Date.now;
    jest.spyOn(Date, "now").mockReturnValue(realNow() + 6 * 60 * 1000);
    expect(await getCache("k")).toBeNull();
    (Date.now as jest.Mock).mockRestore();
    // The expired entry was removed from storage.
    expect(await AsyncStorage.getItem("cache.k")).toBeNull();
  });

  it("returns null for a malformed envelope", async () => {
    await AsyncStorage.setItem("cache.k", JSON.stringify({ value: 1 })); // no expiresAt
    expect(await getCache("k")).toBeNull();
  });

  it("deleteCache removes a stored value", async () => {
    await setCache("k", 1, 5);
    await deleteCache("k");
    expect(await getCache("k")).toBeNull();
  });
});
