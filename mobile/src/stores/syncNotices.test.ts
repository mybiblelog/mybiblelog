import { consumeDroppedChanges, reportDroppedChanges, useSyncNoticesStore } from "./syncNotices";

beforeEach(() => {
  useSyncNoticesStore.setState({ droppedCount: 0 });
});

describe("syncNotices", () => {
  it("accumulates reports until consumed, then resets", () => {
    reportDroppedChanges(2);
    reportDroppedChanges(1);
    expect(consumeDroppedChanges()).toBe(3);
    expect(consumeDroppedChanges()).toBe(0);
  });

  it("ignores empty reports", () => {
    reportDroppedChanges(0);
    expect(useSyncNoticesStore.getState().droppedCount).toBe(0);
  });
});
