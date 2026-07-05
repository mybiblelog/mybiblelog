import AsyncStorage from "@react-native-async-storage/async-storage";
import { reportHandledError } from "@/src/observability/sentry";
import { getStoredSchemaVersion, setStoredSchemaVersion } from "@/src/storage/schemaVersion";
import { runStorageMigrations } from "./runner";
import type { Migration } from "./index";

jest.mock("@/src/observability/sentry", () => ({
  reportHandledError: jest.fn(),
}));

const reportHandledErrorMock = reportHandledError as jest.Mock;

/** Build a migration that records the order it ran in and applies a marker key. */
function step(version: number, order: number[], onUp?: () => Promise<void>): Migration {
  return {
    version,
    name: `test-${version}`,
    up: jest.fn(async () => {
      order.push(version);
      if (onUp) await onUp();
      await AsyncStorage.setItem(`applied.${version}`, "1");
    }),
  };
}

beforeEach(async () => {
  await AsyncStorage.clear();
  reportHandledErrorMock.mockClear();
});

describe("runStorageMigrations", () => {
  it("runs every step on a fresh install and lands on the target version", async () => {
    const order: number[] = [];
    const migrations = [step(1, order), step(2, order), step(3, order)];

    await runStorageMigrations(migrations, 3);

    expect(order).toEqual([1, 2, 3]);
    expect(await getStoredSchemaVersion()).toBe(3);
  });

  it("runs nothing when already up to date", async () => {
    const order: number[] = [];
    const migrations = [step(1, order), step(2, order)];
    await setStoredSchemaVersion(2);

    await runStorageMigrations(migrations, 2);

    expect(order).toEqual([]);
    expect(migrations[0].up).not.toHaveBeenCalled();
  });

  it("runs only the missing subset on a partial upgrade", async () => {
    const order: number[] = [];
    const migrations = [step(1, order), step(2, order), step(3, order)];
    await setStoredSchemaVersion(1);

    await runStorageMigrations(migrations, 3);

    expect(order).toEqual([2, 3]);
    expect(migrations[0].up).not.toHaveBeenCalled();
    expect(await getStoredSchemaVersion()).toBe(3);
  });

  it("advances the version after each individual step", async () => {
    const order: number[] = [];
    const seen: number[] = [];
    const migrations = [
      step(1, order),
      step(2, order, async () => {
        // By the time step 2 runs, step 1's version must be persisted.
        seen.push(await getStoredSchemaVersion());
      }),
    ];

    await runStorageMigrations(migrations, 2);

    expect(seen).toEqual([1]);
  });

  it("is idempotent: a second run does nothing and leaves storage identical", async () => {
    const order: number[] = [];
    const migrations = [step(1, order), step(2, order)];

    await runStorageMigrations(migrations, 2);
    order.length = 0;
    await runStorageMigrations(migrations, 2);

    expect(order).toEqual([]);
    expect(await getStoredSchemaVersion()).toBe(2);
  });

  it("stops on a failing step, leaves version at the last good step, and reports", async () => {
    const order: number[] = [];
    const migrations = [
      step(1, order),
      step(2, order, async () => {
        throw new Error("boom");
      }),
      step(3, order),
    ];

    await runStorageMigrations(migrations, 3);

    expect(order).toEqual([1, 2]); // step 3 never ran
    expect(await getStoredSchemaVersion()).toBe(1); // stayed at last success
    expect(migrations[2].up).not.toHaveBeenCalled();
    expect(reportHandledErrorMock).toHaveBeenCalledTimes(1);
    expect(reportHandledErrorMock.mock.calls[0][1]).toMatchObject({ version: 2, name: "test-2" });
  });

  it("resumes and completes on the next run after a failure is fixed", async () => {
    const order: number[] = [];
    let shouldFail = true;
    const migrations = [
      step(1, order),
      step(2, order, async () => {
        if (shouldFail) throw new Error("boom");
      }),
      step(3, order),
    ];

    await runStorageMigrations(migrations, 3);
    expect(await getStoredSchemaVersion()).toBe(1);

    shouldFail = false;
    order.length = 0;
    await runStorageMigrations(migrations, 3);

    expect(order).toEqual([2, 3]);
    expect(await getStoredSchemaVersion()).toBe(3);
  });
});
