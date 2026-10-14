// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import PassageNoteEditorModal from '~/components/popups/PassageNoteEditorModal.vue';
import PassageSelector from '~/components/forms/PassageSelector.vue';
import PassageNoteManageTagsModal from '~/components/popups/PassageNoteManageTagsModal.vue';
import { usePassageNoteEditorStore } from '~/stores/passage-note-editor';
import { useDialogStore } from '~/stores/dialog';
import { ApiError } from '~/helpers/api-error';
import { Bible } from '@mybiblelog/shared';

// A failed save leaves an `ApiErrorDetail` ({ field, code }) on the store, which
// has to be translated before it is rendered — printing the detail directly
// showed users "[object Object]" whenever the API was unreachable.

type HttpMock = { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> };

let http: HttpMock;

// Mirrors the real `$terr` plugin: string errors pass through, error details
// resolve to an `api_error.<code>` message.
const terr = (error: unknown) =>
  typeof error === 'string' ? error : `api_error.${(error as { code: string }).code}`;

function stubNuxtApp(postResult: Promise<unknown>) {
  http = {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockReturnValue(postResult),
  };
  vi.stubGlobal('useNuxtApp', () => ({
    $http: http,
    $terr: terr,
    $i18n: { locale: ref('en'), t: (key: string) => key },
  }));
}

const mountModal = () =>
  mount(PassageNoteEditorModal, {
    global: {
      stubs: { teleport: true, PassageSelector: true, PassageNoteManageTagsModal: true },
    },
  });

const formError = (wrapper: ReturnType<typeof mountModal>) =>
  wrapper.find('.mbl-help--danger');

beforeEach(() => {
  setActivePinia(createPinia());
  vi.stubGlobal('useResolvedPassageNoteTags', () => ref([]));
});

describe('PassageNoteEditorModal', () => {
  it('shows a translated message when the API is unreachable', async () => {
    // No `{ error }` envelope to parse: the http plugin rethrows the raw fetch
    // failure, which the editor store maps to `unknown_error`.
    stubNuxtApp(Promise.reject(new Error('fetch failed')));
    usePassageNoteEditorStore().openEditor({ content: 'A note' });
    const wrapper = mountModal();

    await wrapper.get('[data-testid="note-editor-submit"]').trigger('click');
    await flushPromises();

    expect(formError(wrapper).text()).toBe('api_error.unknown_error');
  });

  it('shows the API error code when the request fails with one', async () => {
    stubNuxtApp(Promise.reject(new ApiError({ code: 'validation_error', errors: [{ field: null, code: 'review' }] })));
    usePassageNoteEditorStore().openEditor({ content: 'A note' });
    const wrapper = mountModal();

    await wrapper.get('[data-testid="note-editor-submit"]').trigger('click');
    await flushPromises();

    expect(formError(wrapper).text()).toBe('api_error.review');
  });

  it('falls back to the local message for codes with no translation', async () => {
    stubNuxtApp(Promise.reject(new ApiError({ code: 'teapot', errors: [] })));
    vi.stubGlobal('useI18n', () => ({
      t: (key: string) => key,
      te: (key: string) => key !== 'api_error.teapot',
      locale: ref('en'),
      locales: ref([]),
    }));
    usePassageNoteEditorStore().openEditor({ content: 'A note' });
    const wrapper = mountModal();

    await wrapper.get('[data-testid="note-editor-submit"]').trigger('click');
    await flushPromises();

    expect(formError(wrapper).text()).toBe('could_not_save');
  });

  it('saves and clears the form error when the store save resolves successfully', async () => {
    stubNuxtApp(Promise.resolve({ data: { id: 1, content: 'A note', passages: [], tags: [] } }));
    usePassageNoteEditorStore().openEditor({ content: 'A note' });
    const wrapper = mountModal();

    await wrapper.get('[data-testid="note-editor-submit"]').trigger('click');
    await flushPromises();

    expect(formError(wrapper).exists()).toBe(false);
    // A successful save resets the editor store, which closes the modal.
    expect(usePassageNoteEditorStore().open).toBe(false);
  });

  describe('passage add/edit/remove', () => {
    beforeEach(() => {
      stubNuxtApp(Promise.resolve({ data: [] }));
    });

    it('adds a passage, edits it via PassageSelector, and clears editing state on Done', async () => {
      usePassageNoteEditorStore().openEditor({ content: 'A note' });
      const wrapper = mountModal();
      const store = usePassageNoteEditorStore();

      await wrapper.get('[data-testid="note-editor-add-passage"]').trigger('click');

      expect(store.passageNote.passages).toHaveLength(1);
      expect(store.passageNote.passages[0]).toEqual({ empty: true });

      const selector = wrapper.findComponent(PassageSelector);
      expect(selector.exists()).toBe(true);
      const genesis1v1 = Bible.makeVerseId(1, 1, 1);
      selector.vm.$emit('change', { startVerseId: genesis1v1, endVerseId: genesis1v1 });
      await wrapper.vm.$nextTick();

      expect(store.passageNote.passages[0]).toEqual({ startVerseId: genesis1v1, endVerseId: genesis1v1 });

      const doneButton = wrapper.findAll('button').find(b => b.text() === 'done');
      expect(doneButton).toBeTruthy();
      await doneButton!.trigger('click');

      // Editing state clears: the passage is now rendered as a button showing
      // the display range rather than the PassageSelector.
      expect(wrapper.findComponent(PassageSelector).exists()).toBe(false);
    });

    it('edits an existing passage via startEditPassage, then discards the edit on Cancel', async () => {
      const genesis1v1 = Bible.makeVerseId(1, 1, 1);
      const genesis1v2 = Bible.makeVerseId(1, 1, 2);
      usePassageNoteEditorStore().openEditor({
        content: 'A note',
        passages: [{ startVerseId: genesis1v1, endVerseId: genesis1v1 }],
      });
      const wrapper = mountModal();
      const store = usePassageNoteEditorStore();

      const editButton = wrapper.get('.passage-line .passage button');
      await editButton.trigger('click');

      expect(wrapper.findComponent(PassageSelector).exists()).toBe(true);

      const selector = wrapper.findComponent(PassageSelector);
      await selector.vm.$emit('change', { startVerseId: genesis1v2, endVerseId: genesis1v2 });
      expect(store.passageNote.passages[0]).toEqual({ startVerseId: genesis1v2, endVerseId: genesis1v2 });

      const cancelButton = wrapper.findAll('button').find(b => b.text() === 'cancel');
      expect(cancelButton).toBeTruthy();
      await cancelButton!.trigger('click');

      // Cancelling restores the original passage value and exits edit mode.
      expect(store.passageNote.passages[0]).toEqual({ startVerseId: genesis1v1, endVerseId: genesis1v1 });
      expect(wrapper.findComponent(PassageSelector).exists()).toBe(false);
    });

    it('blocks removal when the confirm dialog is cancelled, and allows it when confirmed', async () => {
      const genesis1v1 = Bible.makeVerseId(1, 1, 1);
      usePassageNoteEditorStore().openEditor({
        content: 'A note',
        passages: [{ startVerseId: genesis1v1, endVerseId: genesis1v1 }],
      });
      const wrapper = mountModal();
      const store = usePassageNoteEditorStore();

      const confirmSpy = vi.spyOn(useDialogStore(), 'confirm').mockResolvedValueOnce(false);
      const removeButton = wrapper.findAll('button').find(b => b.text() === 'remove')!;
      expect(removeButton).toBeTruthy();
      await removeButton.trigger('click');
      await flushPromises();

      expect(confirmSpy).toHaveBeenCalledTimes(1);
      expect(store.passageNote.passages).toHaveLength(1);

      confirmSpy.mockResolvedValueOnce(true);
      await removeButton.trigger('click');
      await flushPromises();

      expect(confirmSpy).toHaveBeenCalledTimes(2);
      expect(store.passageNote.passages).toHaveLength(0);
    });
  });

  // openManageTags/applyManageTags is the "Choose Tags" flow: it seeds a draft
  // selection from the note's current tags and only writes back to the note
  // when the nested modal reports 'done'; 'cancel' must leave tags untouched.
  describe('manage tags flow', () => {
    it("seeds the draft selection from the note's current tags and applies changes on done", async () => {
      stubNuxtApp(Promise.resolve({ data: {} }));
      usePassageNoteEditorStore().openEditor({ content: 'A note', tags: ['a', 'b'] });
      const wrapper = mountModal();

      await wrapper.get('[data-testid="note-editor-manage-tags"]').trigger('click');

      const manageTagsModal = wrapper.findComponent(PassageNoteManageTagsModal);
      expect(manageTagsModal.props('open')).toBe(true);
      expect(manageTagsModal.props('selectedTagIds')).toEqual(['a', 'b']);

      manageTagsModal.vm.$emit('done', ['b', 'c']);
      await flushPromises();

      expect(usePassageNoteEditorStore().passageNote.tags).toEqual(['b', 'c']);
      expect(wrapper.findComponent(PassageNoteManageTagsModal).props('open')).toBe(false);
    });

    it("leaves the note's tags unchanged when the manage-tags modal is cancelled", async () => {
      stubNuxtApp(Promise.resolve({ data: {} }));
      usePassageNoteEditorStore().openEditor({ content: 'A note', tags: ['a'] });
      const wrapper = mountModal();

      await wrapper.get('[data-testid="note-editor-manage-tags"]').trigger('click');
      const manageTagsModal = wrapper.findComponent(PassageNoteManageTagsModal);

      manageTagsModal.vm.$emit('cancel');
      await flushPromises();

      expect(usePassageNoteEditorStore().passageNote.tags).toEqual(['a']);
      expect(wrapper.findComponent(PassageNoteManageTagsModal).props('open')).toBe(false);
    });
  });
});
