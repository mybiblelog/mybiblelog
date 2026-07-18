import { ApiError, UnknownApiError } from '~/helpers/api-error';
import type { ApiErrorDetail } from '~/helpers/api-error';
import mapFormErrors from '~/helpers/map-form-errors';
import { confirmDiscardIfDirty } from '~/helpers/confirm-discard';

/**
 * Shared shell for the editor stores (`log-entry-editor`, `passage-note-editor`,
 * `passage-note-tag-editor`). Each of those wraps a small domain state machine
 * but hand-rolled the same open / dirty-check / close / submit / `$reset` shell
 * around it — including subtly divergent error handling on save. This factory
 * owns that shell once, with a single error contract: **save never throws**, it
 * always populates `.errors` and returns `null` on failure.
 *
 * It returns Pinia `state` + `actions` building blocks to spread into a concrete
 * `defineStore` call, so each store can still add its own domain getters/actions
 * (e.g. `selectBook`, `updatePassageNote`) alongside the shared shell.
 */

export type EditorErrors = Record<string, ApiErrorDetail>;

export type EditorCloseOptions = { force?: boolean; confirmMessage?: string };

export type EditorStoreConfig<Model, Result, Payload> = {
  /** The blank model used for the initial state and after a reset. */
  empty: () => Model;
  /** Builds a complete model from an open payload (edit vs. create). */
  build: (payload: Payload) => Model;
  /** Persists the model (API call plus any post-save side effects). */
  save: (model: Model) => Promise<Result | null>;
  /** Opt-in validity derivation. Omit for editors that never read `isValid`. */
  validate?: (model: Model) => boolean;
};

type BaseEditorState<Model> = {
  open: boolean;
  cleanFormValue: string | null;
  model: Model;
  errors: EditorErrors;
  submitting: boolean;
};

type ValidatedEditorState<Model> = BaseEditorState<Model> & { isValid: boolean };

type EditorActions<Model, Result, Payload> = {
  openEditor(payload?: Payload): void;
  closeEditor(options?: EditorCloseOptions): Promise<boolean>;
  updateModel(model: Model): void;
  setErrors(errors: EditorErrors): void;
  save(): Promise<Result | null>;
};

type ValidatedEditorActions<Model, Result, Payload> = EditorActions<Model, Result, Payload> & {
  setValid(isValid: boolean): void;
};

export type EditorStoreBlocks<Model, Result, Payload> = {
  state: () => BaseEditorState<Model>;
  actions: EditorActions<Model, Result, Payload>;
};

export type ValidatedEditorStoreBlocks<Model, Result, Payload> = {
  state: () => ValidatedEditorState<Model>;
  actions: ValidatedEditorActions<Model, Result, Payload>;
};

/** The `this` context the shared actions run against once spread into a store. */
type EditorActionContext<Model> = {
  open: boolean;
  cleanFormValue: string | null;
  model: Model;
  errors: EditorErrors;
  submitting: boolean;
  isValid?: boolean;
  setErrors(errors: EditorErrors): void;
  $reset(): void;
};

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createEditorStore<Model, Result, Payload>(
  config: EditorStoreConfig<Model, Result, Payload> & { validate: (model: Model) => boolean },
): ValidatedEditorStoreBlocks<Model, Result, Payload>;
export function createEditorStore<Model, Result, Payload>(
  config: EditorStoreConfig<Model, Result, Payload>,
): EditorStoreBlocks<Model, Result, Payload>;
export function createEditorStore<Model, Result, Payload>(
  config: EditorStoreConfig<Model, Result, Payload>,
) {
  const { validate } = config;

  const state = (): BaseEditorState<Model> | ValidatedEditorState<Model> => {
    const base: BaseEditorState<Model> = {
      open: false,
      cleanFormValue: null,
      model: config.empty(),
      errors: {},
      submitting: false,
    };
    return validate ? { ...base, isValid: validate(config.empty()) } : base;
  };

  const actions = {
    openEditor(this: EditorActionContext<Model>, payload?: Payload): void {
      this.model = config.build(payload as Payload);
      this.cleanFormValue = JSON.stringify(this.model);
      this.errors = {};
      if (validate) {
        this.isValid = validate(this.model);
      }
      this.open = true;
    },

    async closeEditor(this: EditorActionContext<Model>, options: EditorCloseOptions = {}): Promise<boolean> {
      const { force = false, confirmMessage } = options;
      const isDirty = Boolean(this.cleanFormValue) && JSON.stringify(this.model) !== this.cleanFormValue;
      if (!force) {
        const proceed = await confirmDiscardIfDirty(isDirty, confirmMessage);
        if (!proceed) {
          return false;
        }
      }

      this.$reset();
      return true;
    },

    updateModel(this: EditorActionContext<Model>, model: Model): void {
      this.model = clone(model);
      if (validate) {
        this.isValid = validate(this.model);
      }
    },

    setErrors(this: EditorActionContext<Model>, errors: EditorErrors): void {
      this.errors = errors || {};
    },

    async save(this: EditorActionContext<Model>): Promise<Result | null> {
      if (this.submitting) {
        return null;
      }
      this.submitting = true;
      try {
        const result = await config.save(this.model);
        if (result) {
          this.$reset();
          return result;
        }
        return null;
      }
      catch (err: unknown) {
        this.setErrors(err instanceof ApiError ? mapFormErrors(err) : mapFormErrors(new UnknownApiError()));
        return null;
      }
      finally {
        this.submitting = false;
      }
    },
  };

  if (validate) {
    (actions as Record<string, unknown>).setValid = function setValid(
      this: EditorActionContext<Model>,
      isValid: boolean,
    ): void {
      this.isValid = Boolean(isValid);
    };
  }

  return { state, actions } as unknown as ValidatedEditorStoreBlocks<Model, Result, Payload>;
}
