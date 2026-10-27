import { describe, it, expect, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ApiClientError, type ApiClient } from '../src/client';
import { registerTools, runTool, toolDefinitions, type ToolContext } from '../src/tools';

/**
 * Tool behavior against a fake API client: what gets sent, what the agent
 * gets back, and that destructive and bulk tools change nothing without
 * `confirm: true`.
 */

const NOW = new Date('2026-10-27T15:00:00Z');

type Handler = (path: string, payload?: Record<string, unknown>) => unknown;
const makeClient = (routes: Partial<Record<'get' | 'post' | 'patch' | 'delete', Handler>>) => {
  const calls: Array<[string, string, unknown]> = [];
  const call = (method: 'get' | 'post' | 'patch' | 'delete') => vi.fn(async (path: string, payload?: Record<string, unknown>) => {
    calls.push([method, path, payload]);
    const handler = routes[method];
    if (!handler) { throw new Error(`unexpected ${method} ${path}`); }
    return handler(path, payload);
  });
  const client = {
    siteUrl: 'https://example.test',
    get: call('get'),
    post: call('post'),
    patch: call('patch'),
    delete: call('delete'),
  } as unknown as ApiClient;
  return { client, calls, writes: () => calls.filter(([method]) => method !== 'get') };
};

const ctxFor = (client: ApiClient): ToolContext => ({ client, timeZone: 'America/Chicago', now: () => NOW });
const tool = (name: string) => toolDefinitions.find((definition) => definition.name === name)!;
const call = async (name: string, args: unknown, ctx: ToolContext) => {
  const result = await runTool(tool(name), args, ctx);
  const text = (result.content[0] as { text: string }).text;
  return { isError: result.isError === true, text, json: result.isError ? undefined : JSON.parse(text) };
};

const tags = [
  { id: 't1', label: 'Grace', color: '#000', noteCount: 1 },
  { id: 't2', label: 'Prayer', color: '#000', noteCount: 0 },
];

describe('log_reading', () => {
  it('logs each passage for today in the user\'s time zone, as USFM', async () => {
    const { client, writes } = makeClient({
      get: () => ({ data: [] }),
      post: (_path, body) => ({ id: 'e1', ...body, startVerseId: 143003001, endVerseId: 143003036 }),
    });
    const result = await call('log_reading', { passages: ['John 3'] }, ctxFor(client));
    expect(writes()).toEqual([['post', '/log-entries', { date: '2026-10-27', passage: 'JHN.3' }]]);
    expect(result.json.logged[0]).toEqual({ id: 'e1', date: '2026-10-27', usfm: 'JHN.3', passage: 'John 3' });
  });

  it('skips a passage already logged for that date', async () => {
    const { client, writes } = makeClient({
      get: () => ({ data: [{ id: 'e0', date: '2026-10-20', startVerseId: 143003001, endVerseId: 143003036 }] }),
    });
    const result = await call('log_reading', { passages: ['JHN.3'], date: '2026-10-20' }, ctxFor(client));
    expect(writes()).toEqual([]);
    expect(result.json.alreadyLogged).toHaveLength(1);
  });

  it('still logs without logs:read, skipping the duplicate check', async () => {
    const { client, writes } = makeClient({
      get: () => { throw new ApiClientError(403, 'unauthorized'); },
      post: (_path, body) => ({ id: 'e1', ...body, startVerseId: 119023001, endVerseId: 119023006 }),
    });
    const result = await call('log_reading', { passages: ['PSA.23'] }, ctxFor(client));
    expect(result.isError).toBe(false);
    expect(writes()).toHaveLength(1);
  });

  it('logs nothing when any passage is invalid', async () => {
    const { client, calls } = makeClient({});
    const result = await call('log_reading', { passages: ['John 3', 'Genesis 50 - Exodus 2'] }, ctxFor(client));
    expect(result.isError).toBe(true);
    expect(result.text).toMatch(/one passage per book/);
    expect(calls).toEqual([]);
  });

  it('rejects an impossible date', async () => {
    const { client } = makeClient({});
    const result = await call('log_reading', { passages: ['John 3'], date: '2026-02-30' }, ctxFor(client));
    expect(result.text).toMatch(/real date/);
  });

  it('tells the agent which permission is missing', async () => {
    const { client } = makeClient({
      get: () => ({ data: [] }),
      post: () => { throw new ApiClientError(403, 'unauthorized', [{ field: null, code: 'insufficient_scope', properties: { requiredScopes: ['logs:write'] } }]); },
    });
    const result = await call('log_reading', { passages: ['John 3'] }, ctxFor(client));
    expect(result.isError).toBe(true);
    expect(result.text).toMatch(/lacks the logs:write permission/);
  });
});

describe('list_reading', () => {
  it('defaults to the last 30 days ending today', async () => {
    const { client, calls } = makeClient({ get: () => ({ data: [] }) });
    const result = await call('list_reading', {}, ctxFor(client));
    expect(calls[0]).toEqual(['get', '/log-entries', { startDate: '2026-09-28', endDate: '2026-10-27' }]);
    expect(result.json.count).toBe(0);
  });
});

describe('delete_log_entry', () => {
  it('only previews without confirm', async () => {
    const { client, writes } = makeClient({ get: () => ({ data: { id: 'e1', date: '2026-10-27', startVerseId: 143003001, endVerseId: 143003036 } }) });
    const result = await call('delete_log_entry', { id: 'e1' }, ctxFor(client));
    expect(writes()).toEqual([]);
    expect(result.json).toMatchObject({ preview: true, wouldDelete: { passage: 'John 3', date: '2026-10-27' } });
  });

  it('deletes with confirm', async () => {
    const { client, writes } = makeClient({ delete: () => 1 });
    await call('delete_log_entry', { id: 'e1', confirm: true }, ctxFor(client));
    expect(writes()).toEqual([['delete', '/log-entries/e1', undefined]]);
  });
});

describe('notes', () => {
  it('creates a note with passages as USFM and tags resolved by label', async () => {
    const { client, writes } = makeClient({
      get: () => ({ data: tags }),
      post: (_path, body) => ({ id: 'n1', content: body.content, passages: [{ startVerseId: 143003016, endVerseId: 143003018 }], tags: body.tags }),
    });
    const result = await call('create_note', { content: 'Love', passages: ['John 3:16-18'], tags: ['grace'] }, ctxFor(client));
    expect(writes()).toEqual([['post', '/passage-notes', { content: 'Love', passages: ['JHN.3.16-18'], tags: ['t1'] }]]);
    expect(result.json.created).toMatchObject({ passages: ['John 3:16-18'], tags: ['Grace'] });
  });

  it('refuses an unknown tag label and points to create_tag', async () => {
    const { client, writes } = makeClient({ get: () => ({ data: tags }) });
    const result = await call('create_note', { content: 'x', tags: ['Hope'] }, ctxFor(client));
    expect(result.isError).toBe(true);
    expect(result.text).toMatch(/No tag named "Hope".*create_tag/);
    expect(writes()).toEqual([]);
  });

  it('searches by passage and tag, mapping sort and paging', async () => {
    const { client, calls } = makeClient({
      get: (path) => (path === '/passage-note-tags'
        ? { data: tags }
        : { data: [{ id: 'n1', content: 'c', passages: [], tags: ['t1'] }], meta: { pagination: { size: 7, offset: 0 } } }),
    });
    const result = await call('search_notes', { passage: 'John 3', tags: ['Grace'], sort: 'oldest' }, ctxFor(client));
    expect(calls[1]).toEqual(['get', '/passage-notes', expect.objectContaining({
      filterPassage: 'JHN.3', filterTags: ['t1'], sortOn: 'createdAt', sortDirection: 'ascending', limit: 10, offset: 0,
    })]);
    expect(result.json).toMatchObject({ total: 7, notes: [{ id: 'n1', tags: ['Grace'] }] });
  });

  it('previews deleting a note without deleting it', async () => {
    const { client, writes } = makeClient({
      get: (path) => (path === '/passage-note-tags' ? { data: tags } : { data: { id: 'n1', content: 'A long note', passages: [], tags: [] } }),
    });
    const result = await call('delete_note', { id: 'n1' }, ctxFor(client));
    expect(result.json.preview).toBe(true);
    expect(writes()).toEqual([]);
  });
});

describe('tag_notes', () => {
  const notes: Record<string, { id: string; content: string; passages: never[]; tags: string[] }> = {
    n1: { id: 'n1', content: 'one', passages: [], tags: ['t2'] },
    n2: { id: 'n2', content: 'two', passages: [], tags: ['t1'] },
  };
  const routes = {
    get: (path: string) => (path === '/passage-note-tags' ? { data: tags } : { data: notes[path.split('/').pop()!] }),
    patch: () => ({}),
  };

  it('previews the change without writing', async () => {
    const { client, writes } = makeClient(routes);
    const result = await call('tag_notes', { noteIds: ['n1', 'n2'], add: ['Grace'] }, ctxFor(client));
    expect(writes()).toEqual([]);
    expect(result.json.wouldChange).toEqual([{ id: 'n1', note: 'one', tagsBefore: ['Prayer'], tagsAfter: ['Prayer', 'Grace'] }]);
    expect(result.json.unchanged).toBe(1);
  });

  it('applies only the changed notes once confirmed, keeping other tags', async () => {
    const { client, writes } = makeClient(routes);
    await call('tag_notes', { noteIds: ['n1', 'n2'], add: ['Grace'], remove: ['Prayer'], confirm: true }, ctxFor(client));
    expect(writes()).toEqual([['patch', '/passage-notes/n1', { tags: ['t1'] }]]);
  });
});

describe('get_passage_text', () => {
  it('renders verses as text and says how to continue', async () => {
    const { client, calls } = makeClient({
      get: () => ({
        data: {
          blocks: [
            { type: 'section_heading', chapter: 1, text: 'The Creation' },
            { type: 'verse', chapter: 1, number: 1, segments: [{ kind: 'text', text: 'In the beginning God created the heavens and the earth.' }] },
          ],
          translation: { name: 'NASB 2020', licenseUrl: 'https://example.test/license' },
          next: { startVerseId: 101002001, endVerseId: 101002025 },
        },
      }),
    });
    const result = await call('get_passage_text', { passage: 'Genesis 1-2' }, ctxFor(client));
    expect(calls[0]![2]).toMatchObject({ startVerseId: 101001001, endVerseId: 101002025 });
    expect(result.json.text).toContain('[1:1] In the beginning God created');
    expect(result.json.continueWith).toBe('GEN.2');
  });
});

describe('MCP registration', () => {
  it('exposes every tool with schemas and safety annotations over the protocol', async () => {
    const { client: api } = makeClient({ get: () => ({ data: tags }) });
    const server = new McpServer({ name: 'mybiblelog', version: 'test' });
    registerTools(server, ctxFor(api));
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'test', version: '0' });
    await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);

    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(toolDefinitions.map((t) => t.name).sort());
    const byName = Object.fromEntries(tools.map((t) => [t.name, t]));
    expect(byName.delete_note!.annotations?.destructiveHint).toBe(true);
    expect(byName.reading_summary!.annotations?.readOnlyHint).toBe(true);
    expect(byName.log_reading!.inputSchema.required).toEqual(['passages']);

    const result = await client.callTool({ name: 'list_tags', arguments: {} });
    expect(JSON.parse((result.content as Array<{ text: string }>)[0]!.text).tags).toHaveLength(2);

    const invalid = await client.callTool({ name: 'log_reading', arguments: { passages: [] } });
    expect(invalid.isError).toBe(true);
    await client.close();
  });
});
