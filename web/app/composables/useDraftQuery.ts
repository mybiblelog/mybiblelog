import type { Ref } from 'vue';

/**
 * Manages the "draft vs. applied" editing model shared by the query-manager
 * components (log entries, passage notes). A `draft` is edited freely; it is
 * only pushed to the parent via `emit('apply', …)` when the user applies it,
 * and reset via `emit('cancel')` on cancel. `isDirty` compares the draft to the
 * last-applied `baseline` with a stable JSON deep-equal.
 *
 * `normalize` turns a (possibly partial) applied query into a fully-populated,
 * canonically-ordered draft object. It must be idempotent — it is the single
 * source of truth for defaults, key order, and per-field coercion, so the
 * JSON deep-equal stays reliable.
 */
export function useDraftQuery<T extends object>(
  getAppliedQuery: () => Partial<T> | null | undefined,
  normalize: (query: Partial<T> | null | undefined) => T,
  emit: {
    (event: 'apply', value: T): void;
    (event: 'cancel'): void;
  },
) {
  const baseline = ref(normalize(getAppliedQuery())) as Ref<T>;
  const draft = ref(normalize(getAppliedQuery())) as Ref<T>;

  const isDirty = computed(() => JSON.stringify(draft.value) !== JSON.stringify(baseline.value));

  function setDraft(update: Partial<T>) {
    draft.value = { ...draft.value, ...update };
  }

  function resetDraftToApplied() {
    baseline.value = normalize(getAppliedQuery());
    draft.value = normalize(getAppliedQuery());
  }

  // Keep the draft in sync when the parent pushes a new applied query, but only
  // while the user has no in-progress edits — otherwise their draft is clobbered.
  watch(getAppliedQuery, () => {
    if (isDirty.value) { return; }
    resetDraftToApplied();
  }, { deep: true });

  function applyDraft() {
    const update = normalize(draft.value);
    baseline.value = normalize(update);
    draft.value = normalize(update);
    emit('apply', update);
  }

  function cancelDraft() {
    resetDraftToApplied();
    emit('cancel');
  }

  return { draft, isDirty, applyDraft, cancelDraft, setDraft, resetDraftToApplied };
}
