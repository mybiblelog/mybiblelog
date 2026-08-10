import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import * as Vue from 'vue';
import { usePassageNotesStore } from '~/stores/passage-notes';
import { usePassageNoteTagsStore } from '~/stores/passage-note-tags';

beforeEach(() => setActivePinia(createPinia()));

// The default setup.ts stub hands out a fresh http mock per `useNuxtApp()` call,
// so pin a single one here to assert on the requests the store makes.
function stubHttp() {
  const http = {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    patch: vi.fn().mockResolvedValue({ data: { id: 1 } }),
    delete: vi.fn().mockResolvedValue({ data: 1 }),
  };
  vi.stubGlobal('useNuxtApp', () => ({
    $http: http,
    $terr: (error: unknown) => String(error),
    $i18n: { locale: Vue.ref('en'), t: (key: string) => key },
  }));
  return http;
}

describe('passage-notes store — tag count invalidation', () => {
  // Tag `noteCount` is computed per request by the API and cached in the tags
  // store, so a note write that changes a tag set must force a tag reload.
  // Regression: removing a tag from a note left /tags showing a stale count
  // and refusing to delete the tag until a full page reload.

  it('updatePassageNote force-reloads the tags when they are loaded', async () => {
    stubHttp();
    const tags = usePassageNoteTagsStore();
    tags.isLoaded = true;
    const load = vi.spyOn(tags, 'loadPassageNoteTags').mockResolvedValue(undefined);

    await usePassageNotesStore().updatePassageNote({ id: 1, tags: [] });

    expect(load).toHaveBeenCalledWith({ force: true });
  });

  it('createPassageNote force-reloads the tags when they are loaded', async () => {
    stubHttp();
    const tags = usePassageNoteTagsStore();
    tags.isLoaded = true;
    const load = vi.spyOn(tags, 'loadPassageNoteTags').mockResolvedValue(undefined);

    await usePassageNotesStore().createPassageNote({ content: 'note', tags: [] });

    expect(load).toHaveBeenCalledWith({ force: true });
  });

  it('deletePassageNote force-reloads the tags when they are loaded', async () => {
    stubHttp();
    const tags = usePassageNoteTagsStore();
    tags.isLoaded = true;
    const load = vi.spyOn(tags, 'loadPassageNoteTags').mockResolvedValue(undefined);
    const notes = usePassageNotesStore();
    vi.spyOn(notes, 'loadPassageNotesPage').mockResolvedValue(undefined);

    await notes.deletePassageNote(1);

    expect(load).toHaveBeenCalledWith({ force: true });
  });

  it('skips the tag reload when the tags were never loaded', async () => {
    stubHttp();
    const tags = usePassageNoteTagsStore();
    tags.isLoaded = false;
    const load = vi.spyOn(tags, 'loadPassageNoteTags').mockResolvedValue(undefined);

    await usePassageNotesStore().updatePassageNote({ id: 1, tags: [] });

    expect(load).not.toHaveBeenCalled();
  });

  it('skips the tag reload when the write returns no data', async () => {
    const http = stubHttp();
    http.patch.mockResolvedValue({ data: null });
    const tags = usePassageNoteTagsStore();
    tags.isLoaded = true;
    const load = vi.spyOn(tags, 'loadPassageNoteTags').mockResolvedValue(undefined);

    await usePassageNotesStore().updatePassageNote({ id: 1, tags: [] });

    expect(load).not.toHaveBeenCalled();
  });
});
