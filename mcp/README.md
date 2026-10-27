# My Bible Log MCP server

A [Model Context Protocol](https://modelcontextprotocol.io) server that lets an AI agent (Claude Desktop, Claude Code, or any MCP client) log Bible reading, summarize progress, and take and organize notes in a My Bible Log account.

It calls the public HTTP API with a **personal access token**, so it can only do what the user allowed when they created the token, and it can never touch the account itself (email, password, settings, deletion).

## Setup

1. In My Bible Log, open **Settings → Tokens** and create a token. Tick only the permissions the agent needs:

   | To let the agent… | Permission |
   | --- | --- |
   | read the reading log and analyze it | Read my reading log |
   | log reading, or delete log entries | Add, change and delete reading log entries |
   | search and read notes and tags | Read my notes and tags |
   | write notes, create tags, organize or delete notes | Write, organize and delete notes and tags |
   | read passage text | Read Bible passages |

2. Build the server from this repository:

   ```bash
   npm install
   npm run -w mcp build
   ```

3. Add it to your MCP client. For Claude Desktop (`claude_desktop_config.json`):

   ```json
   {
     "mcpServers": {
       "mybiblelog": {
         "command": "node",
         "args": ["/path/to/mybiblelog/mcp/dist/index.js"],
         "env": {
           "MYBIBLELOG_TOKEN": "mbl_pat_…",
           "MYBIBLELOG_TIME_ZONE": "America/Chicago"
         }
       }
     }
   }
   ```

   For Claude Code:

   ```bash
   claude mcp add mybiblelog \
     -e MYBIBLELOG_TOKEN=mbl_pat_… \
     -e MYBIBLELOG_TIME_ZONE=America/Chicago \
     -- node /path/to/mybiblelog/mcp/dist/index.js
   ```

| Variable | Required | Purpose |
| --- | --- | --- |
| `MYBIBLELOG_TOKEN` | yes | The personal access token |
| `MYBIBLELOG_TIME_ZONE` | no | IANA time zone that decides what "today" is (defaults to the machine's) |
| `MYBIBLELOG_URL` | no | Site to talk to (defaults to `https://www.mybiblelog.com`; e.g. `http://localhost:8080` for a local API) |

## Tools

| Tool | What it does | Permission |
| --- | --- | --- |
| `log_reading` | Log one or more passages for a date (today by default), skipping any already logged that day | `logs:write` |
| `list_reading` | Log entries between two dates (last 30 days by default) | `logs:read` |
| `reading_summary` | Today against the daily goal, streak, what was and wasn't read in a period, whole-Bible progress, suggested next readings | `logs:read` |
| `delete_log_entry` | Delete a log entry (preview first) | `logs:write` |
| `search_notes` | Find notes by text, passage and/or tags | `notes:read` |
| `create_note` / `update_note` | Write or change a note, with passages and tags | `notes:write` |
| `delete_note` | Delete a note (preview first) | `notes:write` |
| `list_tags` / `create_tag` | Read or add tags | `notes:read` / `notes:write` |
| `tag_notes` | Add or remove tags on up to 50 notes (preview first) | `notes:read` + `notes:write` |
| `get_passage_text` | Text of a passage, in chunks | `scripture:read` |

Passages can be written as USFM (`JHN.3.16-18`, `PSA.23`) or in English (`John 3:16-18`, `Psalm 23`).

## Safety

- **Least privilege.** The token's scopes are enforced by the API, not by this server. A read-only token cannot write anything, however the agent is prompted.
- **Two-step destructive changes.** Deleting a log entry or note, and bulk tag changes, return a preview unless called with `confirm: true`. The server's instructions tell the agent to show the preview to the user first, and the tools carry MCP `destructiveHint` annotations so clients can ask for approval too.
- **Note content is data.** Notes are the user's own writing; the tool descriptions tell the agent never to follow instructions found in them.
- **Revocable.** Revoking the token in Settings → Tokens, logging out of all sessions, or changing the password cuts the agent off immediately. Tokens also expire (30, 90 or 365 days).
- **Rate limited.** Each token is limited per endpoint, so a looping agent slows down instead of flooding the account.

## Development

```bash
npm run -w mcp test        # unit tests, including an in-memory MCP client
npm run -w mcp type-check
```

The server is a thin layer over the API: tool definitions live in `src/tools.ts`, and reading analysis reuses the web and mobile apps' insights code from `@mybiblelog/shared`.
