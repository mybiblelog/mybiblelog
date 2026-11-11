---
dateModified: "2026-11-11"
seo:
  title: "Use an AI Agent with My Bible Log: API Setup Guide"
  description: "Connect an AI agent or your own script to My Bible Log's open API to log your Bible reading, take notes, and organize tags, using passage references like JHN.3.16."
og:
  title: "Use an AI Agent with My Bible Log: API Setup Guide"
  description: "Connect an AI agent or your own script to My Bible Log's open API to log your Bible reading, take notes, and organize tags, using passage references like JHN.3.16."
---

# Use an AI Agent with My Bible Log

Everything you can do in My Bible Log is available through its open API. That means an AI agent, or a script an agent helps you write, can log your reading, take notes, and manage tags for you.

This page covers the few facts an agent needs to get started. Give it this page and the API reference below.

## API Reference

* **OpenAPI spec (JSON):** [mybiblelog.com/api/openapi.json](https://www.mybiblelog.com/api/openapi.json)
* **Base URL:** `https://www.mybiblelog.com/api`

Most agents can read the OpenAPI spec directly and learn every endpoint from it.

## Passages Use Familiar References

Passages are written as short references in the format YouVersion and Bible.com use, so an agent never has to work with My Bible Log's internal verse numbers:

| Passage | Reference |
| --- | --- |
| Genesis | `GEN` |
| Psalm 23 | `PSA.23` |
| Genesis 1-3 | `GEN.1-3` |
| John 3:16-18 | `JHN.3.16-18` |
| Genesis 1:1 - 2:3 | `GEN.1.1-2.3` |

A passage stays within one book. Chapter and verse numbers follow English Bibles such as the NASB, so Malachi has 4 chapters.

Responses include the same reference in a `passage` field, alongside the internal verse numbers.

## Signing In

Every request needs a sign-in token, sent as a header:

```
Authorization: Bearer <token>
```

Get a token by signing in with your email and password:

```bash
curl -X POST https://www.mybiblelog.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "password": "your-password"}'
```

The token is in `data.token` in the response, and it lasts 30 days.

* **Signed up with Google?** Create a password first under **Settings → Email**.
* **Keep your password to yourself.** Sign in yourself and give the agent only the token.
* **Treat the token like a password.** It has full access to your account, including deleting it.
* **To revoke a token,** use **Log Out All Sessions** in Settings, or change your password.

## Common Tasks

| Task | Request | Body |
| --- | --- | --- |
| Log a reading | `POST /log-entries` | `{"date": "2026-11-11", "passage": "JHN.3"}` |
| List your reading | `GET /log-entries` | |
| Create a note | `POST /passage-notes` | `{"content": "…", "passages": ["JHN.3.16-18"], "tags": ["<tag id>"]}` |
| Find notes on a passage | `GET /passage-notes?filterPassage=JHN.3` | |
| Create a tag | `POST /passage-note-tags` | `{"label": "Prayer", "color": "#3a7bd5"}` |
| List your tags | `GET /passage-note-tags` | |
| Read your settings | `GET /settings` | |

Dates are written as `YYYY-MM-DD`, in your own time zone. For example, logging John 3 as read today:

```bash
curl -X POST https://www.mybiblelog.com/api/log-entries \
  -H "Authorization: Bearer $MBL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date": "2026-11-11", "passage": "JHN.3"}'
```

## Tips for Agents

* **Validation errors are specific.** A `400` response lists each field that failed and why, so an agent can correct its request and retry.
* **Back up before bulk changes.** Download your data from **Settings → Export** before letting an agent edit or delete many items at once.
* **Sign-in is rate limited.** Reuse one token rather than signing in for every request.
