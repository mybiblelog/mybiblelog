/**
 * Shared shell for the simple modal/dialog stores (`dialog`, `action-sheet`,
 * `achievements`, `feedback-modal`). Each duplicated the same open / close /
 * `$reset` triad around an `open` flag plus a bag of payload fields.
 *
 * This factory owns that triad once. Payload fields are flattened into state
 * (so existing `store.title`, `store.achievementType`, … access is preserved),
 * `openModal(payload)` resets to the initial payload before applying the new
 * one and flips `open` true, and `closeModal()` is a plain `$reset()`.
 *
 * It returns Pinia `state` + `actions` building blocks to spread into a concrete
 * `defineStore`, so a store can add domain-named actions (`openSheet`,
 * `showBookCompleteAchievement`, `alert`/`confirm`) on top of the shared shell.
 */

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

type ModalState<Payload> = { open: boolean } & Payload;

type ModalActions<Payload> = {
  openModal(payload?: Partial<Payload>): void;
  closeModal(): void;
};

export type ModalStoreBlocks<Payload> = {
  state: () => ModalState<Payload>;
  actions: ModalActions<Payload>;
};

type ModalActionContext<Payload> = ModalState<Payload> & { $reset(): void };

export function createModalStore<Payload extends Record<string, unknown>>(
  initialPayload: Payload,
): ModalStoreBlocks<Payload> {
  const actions = {
    openModal(this: ModalActionContext<Payload>, payload?: Partial<Payload>): void {
      Object.assign(this, clone(initialPayload), payload ?? {});
      this.open = true;
    },
    closeModal(this: ModalActionContext<Payload>): void {
      this.$reset();
    },
  };

  return {
    state: (): ModalState<Payload> => ({ open: false, ...clone(initialPayload) }),
    actions: actions as unknown as ModalActions<Payload>,
  };
}
