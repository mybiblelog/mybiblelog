import { describe, expect, it } from "vitest";
import type { PendingLogEntryMutation } from "@/src/storage/logEntries";
import {
  coalesceCreate,
  coalesceDelete,
  coalesceUpdate,
  normalizeMutationQueue,
  removeLocal,
  toStored,
  upsertLocal,
} from "@/src/log-entries/sync";

const entry = { date: "2026-06-27", startVerseId: 43003016, endVerseId: 43003018 };
const entry2 = { date: "2026-06-27", startVerseId: 43003016, endVerseId: 43003020 };

describe("offline mutation queue coalescing", () => {
  it("enqueues a single create", () => {
    const q = coalesceCreate([], "c1", entry);
    expect(q).toHaveLength(1);
    expect(q[0]).toMatchObject({ type: "create", clientId: "c1", entry });
  });

  it("folds an update into an existing unsynced create", () => {
    let q = coalesceCreate([], "c1", entry);
    q = coalesceUpdate(q, "c1", undefined, entry2);
    expect(q).toHaveLength(1);
    expect(q[0]).toMatchObject({ type: "create", clientId: "c1", entry: entry2 });
  });

  it("drops the create entirely when an unsynced entry is deleted", () => {
    let q = coalesceCreate([], "c1", entry);
    q = coalesceDelete(q, "c1", undefined);
    expect(q.filter((m) => m.clientId === "c1")).toHaveLength(0);
  });

  it("keeps a pending delete and ignores subsequent updates", () => {
    let q = coalesceDelete([], "c1", "server-1");
    q = coalesceUpdate(q, "c1", "server-1", entry2);
    expect(q).toHaveLength(1);
    expect(q[0]).toMatchObject({ type: "delete", clientId: "c1", id: "server-1" });
  });

  it("enqueues a delete for a synced (server-id) entry", () => {
    const q = coalesceDelete([], "c1", "server-1");
    expect(q).toHaveLength(1);
    expect(q[0]).toMatchObject({ type: "delete", clientId: "c1", id: "server-1" });
  });

  it("replaces an existing update rather than duplicating it", () => {
    let q = coalesceUpdate([], "c1", "server-1", entry);
    q = coalesceUpdate(q, "c1", "server-1", entry2);
    expect(q).toHaveLength(1);
    expect(q[0]).toMatchObject({ type: "update", entry: entry2 });
  });

  it("normalizeMutationQueue dedupes by clientId+type", () => {
    const dupes: PendingLogEntryMutation[] = [
      { type: "create", clientId: "c1", entry, ts: 1 },
      { type: "create", clientId: "c1", entry: entry2, ts: 2 },
    ];
    expect(normalizeMutationQueue(dupes)).toHaveLength(1);
  });
});

describe("local entry helpers", () => {
  it("toStored preserves clientId or falls back to id then a generated id", () => {
    expect(toStored({ ...entry, clientId: "keep" }).clientId).toBe("keep");
    expect(toStored({ ...entry, id: "srv" }, undefined).clientId).toBe("srv");
    expect(toStored(entry, "fallback").clientId).toBe("fallback");
  });

  it("upsertLocal inserts new entries at the front and updates in place", () => {
    const a = toStored({ ...entry, clientId: "a" });
    const b = toStored({ ...entry, clientId: "b" });
    const inserted = upsertLocal([a], b);
    expect(inserted.map((e) => e.clientId)).toEqual(["b", "a"]);

    const updated = upsertLocal([a, b], { ...b, date: "2026-07-01" });
    expect(updated.find((e) => e.clientId === "b")?.date).toBe("2026-07-01");
    expect(updated).toHaveLength(2);
  });

  it("removeLocal removes by clientId", () => {
    const a = toStored({ ...entry, clientId: "a" });
    const b = toStored({ ...entry, clientId: "b" });
    expect(removeLocal([a, b], "a").map((e) => e.clientId)).toEqual(["b"]);
  });
});
