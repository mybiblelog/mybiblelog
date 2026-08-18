import { createTypedStorage, defineKey } from "./typedStorage";

/**
 * The backend is a constructor parameter, so these drive real instances over a
 * fake that can be made to fail — no mocking of the app's singletons.
 */
function makeBackend() {
  const map = new Map<string, string>();
  const state = { failGet: false, failSet: false, failRemove: false };
  return {
    map,
    state,
    backend: {
      async getItem(key: string) {
        if (state.failGet) throw new Error("read failed");
        return map.get(key) ?? null;
      },
      async setItem(key: string, value: string) {
        if (state.failSet) throw new Error("write failed");
        map.set(key, value);
      },
      async removeItem(key: string) {
        if (state.failRemove) throw new Error("remove failed");
        map.delete(key);
      },
    },
  };
}

const schema = { entries: defineKey<number[]>("entries.v1"), other: defineKey<string>("other.v1") };

function setup() {
  const { map, state, backend } = makeBackend();
  return { map, state, storage: createTypedStorage(backend, schema) };
}

describe("read", () => {
  it("reports ok with the parsed value", async () => {
    const { storage } = setup();
    await storage.set("entries", [1, 2]);
    expect(await storage.read("entries")).toEqual({ status: "ok", value: [1, 2] });
  });

  it("reports absent when nothing is stored", async () => {
    const { storage } = setup();
    expect(await storage.read("entries")).toEqual({ status: "absent" });
  });

  it("reports corrupt for bytes that don't parse", async () => {
    const { map, storage } = setup();
    map.set("entries.v1", "<html>not json</html>");
    expect(await storage.read("entries")).toEqual({ status: "corrupt" });
  });

  it("reports unreadable when the backend throws", async () => {
    const { state, storage } = setup();
    state.failGet = true;
    expect(await storage.read("entries")).toEqual({ status: "unreadable" });
  });

  // The old signature: every failure still collapses to null for callers that
  // genuinely can't act on the difference.
  it("get still returns null for all three failure states", async () => {
    const { map, state, storage } = setup();
    expect(await storage.get("entries")).toBeNull();
    map.set("entries.v1", "nope");
    expect(await storage.get("entries")).toBeNull();
    state.failGet = true;
    expect(await storage.get("entries")).toBeNull();
  });
});

describe("derived writes after a failed read", () => {
  /**
   * The bug this whole layer exists to prevent: a loader can't read the key, so
   * it hands the store an empty list, and the store persists that empty list
   * over the user's real data.
   */
  it("refuses to overwrite a key whose read failed", async () => {
    const { map, state, storage } = setup();
    await storage.set("entries", [1, 2, 3]);

    state.failGet = true;
    expect(await storage.get("entries")).toBeNull();
    expect(storage.isUnreadable("entries")).toBe(true);

    expect(await storage.setDerived("entries", [])).toBe(false);
    expect(map.get("entries.v1")).toBe(JSON.stringify([1, 2, 3]));
  });

  it("still allows an authoritative set — that's what keeps login working", async () => {
    const { map, state, storage } = setup();
    state.failGet = true;
    await storage.get("entries");

    expect(await storage.set("entries", [9])).toBe(true);
    expect(map.get("entries.v1")).toBe(JSON.stringify([9]));
  });

  it("quarantines per key, not per instance", async () => {
    const { state, storage } = setup();
    state.failGet = true;
    await storage.get("entries");
    state.failGet = false;

    expect(storage.isUnreadable("entries")).toBe(true);
    expect(storage.isUnreadable("other")).toBe(false);
    expect(await storage.setDerived("other", "fine")).toBe(true);
  });
});

describe("clearing the quarantine", () => {
  it.each([
    ["a successful read", (map: Map<string, string>) => map.set("entries.v1", "[7]")],
    ["an absent read", () => {}],
    [
      "a corrupt read — the bytes are the problem, not the backend",
      (map: Map<string, string>) => map.set("entries.v1", "garbage"),
    ],
  ])("clears on %s", async (_label, seed) => {
    const { map, state, storage } = setup();
    state.failGet = true;
    await storage.read("entries");
    expect(storage.isUnreadable("entries")).toBe(true);

    state.failGet = false;
    seed(map);
    await storage.read("entries");

    expect(storage.isUnreadable("entries")).toBe(false);
    expect(await storage.setDerived("entries", [1])).toBe(true);
  });

  it("clears on a successful remove", async () => {
    const { state, storage } = setup();
    state.failGet = true;
    await storage.read("entries");

    expect(await storage.remove("entries")).toBe(true);
    expect(storage.isUnreadable("entries")).toBe(false);
  });

  // A delete that threw may have left the old bytes in place, so a derived write
  // still must not clobber them.
  it("keeps the quarantine when remove fails", async () => {
    const { state, storage } = setup();
    state.failGet = true;
    await storage.read("entries");

    state.failRemove = true;
    expect(await storage.remove("entries")).toBe(false);
    expect(storage.isUnreadable("entries")).toBe(true);
  });

  // An authoritative set has already replaced the bytes the quarantine was
  // protecting, so there is nothing left to protect.
  it("clears on a successful authoritative set", async () => {
    const { state, storage } = setup();
    state.failGet = true;
    await storage.read("entries");

    await storage.set("entries", [1]);
    expect(storage.isUnreadable("entries")).toBe(false);
  });

  it("is not cleared by a refused derived write", async () => {
    const { state, storage } = setup();
    state.failGet = true;
    await storage.read("entries");

    await storage.setDerived("entries", [1]);
    expect(storage.isUnreadable("entries")).toBe(true);
  });
});

describe("writes", () => {
  it("reports failure without throwing", async () => {
    const { state, storage } = setup();
    state.failSet = true;
    expect(await storage.set("entries", [1])).toBe(false);
    expect(await storage.setDerived("entries", [1])).toBe(false);
  });

  // A failed write leaves disk at the last good value and memory at the new one,
  // so the next write is a legitimate repair — quarantining would block it.
  it("does not quarantine on a failed write", async () => {
    const { map, state, storage } = setup();
    state.failSet = true;
    await storage.set("entries", [1]);
    expect(storage.isUnreadable("entries")).toBe(false);

    state.failSet = false;
    expect(await storage.setDerived("entries", [2])).toBe(true);
    expect(map.get("entries.v1")).toBe(JSON.stringify([2]));
  });
});
