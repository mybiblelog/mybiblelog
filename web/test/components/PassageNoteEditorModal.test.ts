// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { setActivePinia, createPinia } from 'pinia';
import PassageNoteEditorModal from '~/components/popups/PassageNoteEditorModal.vue';
import { usePassageNoteEditorStore } from '~/stores/passage-note-editor';
import { ApiError } from '~/helpers/api-error';

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
});
