# Reading Goals — Implementation Prompt

> Build prompt for a Claude agent. Scope: **API + web**. Mobile follows later, so put all calculation logic in `shared/` so it can be reused.

---

## Task

Implement **Reading Goals** in this monorepo. A reading goal is a user-defined plan to read an ordered set of Bible passages (whole books for now) between a start date and a goal (end) date. Users create and manage goals from a new Settings → Goals page. Active goals appear on the Today page. Logging the last verses of a goal shows an achievement modal. Each goal has a detail page with a progress chart.

Before writing code, read the existing patterns named below and follow them. Keep changes focused; add no new dependencies.

---

## 1. Data model

```ts
ReadingGoal {
  id: string;
  owner: ObjectId;            // server-side only
  title: string;              // trimmed, 1–100 chars
  passages: GoalPassage[];    // ordered, length 1–66, non-overlapping
  startDate: string;          // 'YYYY-MM-DD'
  endDate: string;            // 'YYYY-MM-DD', >= startDate
  active: boolean;            // default true
  createdAt: Date;
  updatedAt: Date;
}

GoalPassage {
  startVerseId: number;
  endVerseId: number;
}
```

- **Why passages and not book indexes:** goals will eventually allow arbitrary passages (chapters, verse ranges), so storage uses the same `{ startVerseId, endVerseId }` shape as log entries (see `PassageSubdocument` in `api/mongo/documents.ts`). For now a whole book is stored as **one** passage, `[Bible.getFirstBookVerseId(b), Bible.getLastBookVerseId(b)]`, never split by chapter. Allowing arbitrary passages later only means relaxing validation and the UI; no data migration is needed.
- For now the API and web UI accept **whole books only** (see §3).

- Stored in a **new Mongo collection**, not embedded in the user document.
- Completion and progress are **always derived** from log entries and never stored. Deleting a log entry can make a completed goal incomplete again.

---

## 2. Business rules

| Concept | Rule |
|---|---|
| **Goal verses** | The union of all `passages`. Total = `Bible.countUniqueRangeVerses(passages)`. Calculations work on verse ranges and never assume whole books. |
| **Counted reading** | Only verses where log-entry ranges overlap the goal passages, from log entries dated **on or after `startDate`**. Entries after `endDate` **still count**, so an overdue goal can be finished late. Reading before `startDate` does not count. The reading-tracker `lookBackDate` is ignored. |
| **De-duplication** | A verse counts once, however many log entries cover it (use the unique-range helpers in `shared/bible`). |
| **Complete** | All goal verses are counted. `completedDate` = the first date on which cumulative counted verses reached the total. |
| **Visible on Today** | `active && today >= startDate && (!complete \|\| today <= max(endDate, completedDate))`. An incomplete active goal stays visible after its end date. A completed goal shows with a checkmark until its end date, or until its completion day if it was completed late, and is then hidden. `active` is never changed automatically. |
| **Inclusive day count** | `days(start, end)` counts both endpoints (the start day is day 1). |
| **Default end date** | `startDate + ceil(totalVerses / dailyVerseCountGoal) - 1` days. Example: 100 verses at 50/day → end = the day after the start. |
| **Required pace** | `totalVerses / days(startDate, endDate)`. |
| **Average pace** | `countedVerses / days(startDate, min(today, completedDate ?? today))`. Days without reading lower the average. |
| **Projected finish** | `startDate + ceil(totalVerses / averagePace) - 1`. If the average is 0, show a "Not enough reading yet" state. If complete, show the actual completion date. |
| **Passage order** | Controls display order (editor, detail page) and the **"Next up"** hint: the first unread verse range in the first incomplete passage, in goal order. While passages are whole books, they are labelled with the book name. |

---

## 3. API

Mirror the existing **passage-note-tags** stack exactly:

- `api/mongo/documents.ts` — add `ReadingGoalDocument`.
- `api/mongo/useCollections.ts` — register the `readinggoals` collection and add an index on `owner`.
- `api/validation/schemas/reading-goal.ts` — zod create/update/response schemas.
- `api/repositories/reading-goal.repository.ts` — register it in `useRepositories.ts`.
- `api/http/handlers/reading-goals.ts` and `api/http/routes/reading-goals.ts` (with `docs` for OpenAPI). Register them in `api/http/routes/index.ts`.

Endpoints (all authenticated; 401 otherwise):

| Method | Path | Notes |
|---|---|---|
| GET | `/reading-goals` | All of the current user's goals |
| GET | `/reading-goals/:id` | 404 if the goal is missing or belongs to another user |
| POST | `/reading-goals` | Create |
| PUT | `/reading-goals/:id` | Full update (title, books, order, dates, active) |
| DELETE | `/reading-goals/:id` | Delete |

Validation (reject with the repo's standard validation error response):
- `title` is trimmed and 1–100 chars.
- `passages` has 1–66 items, and each item is a valid range (`Bible.validateRange`).
- No two passages may overlap (`Bible.checkRangeOverlap`). This also rules out duplicate books.
- **Whole-book restriction (for now):** each passage must exactly match one book: `startVerseId === getFirstBookVerseId(b)` and `endVerseId === getLastBookVerseId(b)` for the same book `b`. Put this check in its own clearly named zod refinement so it can be removed when arbitrary passages are allowed.
- Dates are valid `YYYY-MM-DD` strings and `endDate >= startDate`. `startDate` may be in the past.

Also:
- Delete a user's goals when their account is deleted (follow how passage notes and tags are cleaned up).
- Add the collection to `api/scripts/delete-stranded-data.ts`.
- Tests: `api/test/reading-goals.test.ts`, modeled on `passage-note-tags.test.ts`. Cover CRUD, owner scoping, rejection of a partial-book passage, rejection of overlapping or duplicate passages, and date-order rejection.

---

## 4. Shared logic — `shared/reading-goals/`

Pure, framework-free functions with vitest coverage, exported from `shared/index.ts`:

- `getGoalTotalVerses(passages)`
- `bookToPassage(bookIndex)` and `isWholeBookPassage(passage)`, which convert between the whole-book UI and the stored passage format
- `computeGoalProgress(goal, logEntries, today)` → `{ versesRead, totalVerses, percent, isComplete, completedDate, averagePerDay, requiredPerDay, projectedFinishDate, nextUp }`
- `isGoalVisibleToday(goal, progress, today)`
- `getDefaultEndDate(startDate, totalVerses, dailyVerseCountGoal)`
- `getRequiredVersesPerDay(totalVerses, startDate, endDate)`
- `computeGoalChartSeries(goal, logEntries, today)` → one `{ date, count }` per date from `startDate` to `max(endDate, today)`, where `count` is the **cumulative** unique goal verses read
- `evaluateGoalCompletions(goals, logEntriesBefore, logEntriesAfter, today)` → the goals that changed from incomplete to complete

Reuse the following:
- `Bible.getBookVerseCount`
- `filterRangesByBook`
- `countUniqueBookRangeVerses`
- the UTC date-walk and range-union approach in `shared/insights/date-verse-counts.ts`

Goal templates live in **`shared/reading-goals/templates.ts`** so mobile can reuse them. `READING_GOAL_TEMPLATES` is an ordered list of `{ id, bookIndexes }` (book indexes here only *define* the template; goals created from it store `passages`), and `getTemplatePassages(id)` converts a template to passages.

| id | Books |
|---|---|
| `whole_bible` | 1–66 (Genesis–Revelation) |
| `old_testament` | 1–39 (Genesis–Malachi) |
| `new_testament` | 40–66 (Matthew–Revelation) |
| `gospels` | 40–43 (Matthew–John) |
| `wisdom` | 18–22 (Job, Psalms, Proverbs, Ecclesiastes, Song of Songs) |

Edge cases to test (in addition, test each template's book list and verse total):
- no reading
- reading before the start date (ignored)
- duplicate and overlapping entries
- an entry spanning a goal book and a non-goal book
- an overdue goal
- late completion
- `dailyVerseCountGoal` larger than the total
- a goal starting today

---

## 5. Web

### Store
- `web/app/stores/reading-goals.ts` (Pinia), modeled on `stores/passage-note-tags.ts`. Load goals with the other app-init data.

### Achievement
- Add `ACHIEVEMENT.GOAL_COMPLETE` (payload: goal id/title) to `stores/achievements.ts`, with title and message copy in `components/popups/AppAchievements.vue`.
- In `stores/log-entries.ts` → `applyAchievement`, also run `evaluateGoalCompletions` on log entry **create and update**.
- Only one modal shows at a time. If a single entry completes both a book/Bible and a goal, **the goal modal wins**.

### Today page (`pages/today.vue`)
- Add a vertical list of goal cards **below the daily progress bar and above the log entries** (above `<reading-tracker-reset-card>`). Sort them by end date.
- Each card shows:
  - the title
  - a progress bar (reuse an existing `components/ui` bar)
  - `versesRead / totalVerses`
  - required vs. average pace
  - the "Next up" passage
  - days remaining or an "overdue" label
- Completed cards show `CheckmarkIcon`.
- Clicking or tapping a card goes to `/goals/[id]`.

### Settings
- Add a **Goals** tab and dropdown item in `pages/settings.vue`, and a new page `pages/settings/goals.vue`.
- **Active / Inactive** tabs. Each goal row has an active toggle, Edit, and Delete, and links to the detail page.
- Deleting asks for confirmation through the existing dialog store (`stores/dialog.ts`).
- A **New goal** button opens the wizard.

### Create / edit wizard

**Step 0: Choose a starting point** (create only). Show a card for each of the five templates in §4, with its translated name and total verse count, plus a **Custom goal** card.

- **Template path:** go straight to the **Dates** step (step 4 below), which for a template goal also shows:
  - the title field, prefilled with the template's name in the user's current language and editable. It is saved as a normal title; the template is not stored on the goal.
  - the template's books as a read-only list, in order.

  Template → Dates → Save. To change a template goal's books, the user edits the goal later.
- **Custom path:** steps 1–4 below.

**Editing** an existing goal always uses the full custom flow (steps 1–4), prefilled with the goal's values. This includes goals created from a template.

The book step works with book indexes and converts to and from `passages` with `bookToPassage` / `isWholeBookPassage` when loading and saving.

1. **Name** — title input.
2. **Books** — a checkbox grid/list of all 66 books (consider `components/forms/GridSelector.vue`) with a live **total selected verses** count.
3. **Order** — reorder the selected books with accessible up/down controls (no drag-and-drop dependency).
4. **Dates**
   - Start date: defaults to today; past dates allowed.
   - End date: defaults to the rule in §2.
   - Show live **required verses/day** as the end date changes, and the user's current **daily verse count goal** for reference.
   - Block saving if end < start.

### Goal detail page — `pages/goals/[id].vue`
Reached from the Today page cards and from Settings → Goals.

- **Chart**: SVG, using the geometry helpers in `shared/insights/charts.ts`. Match the style of `components/insights/DailyVersesChart.vue`.
  - x-axis: one tick per day from `startDate` to `endDate`, **extended to today** if the goal is overdue.
  - y-axis: 0 → total goal verses.
  - **Bars**: cumulative unique goal verses read through each date, shown up to today.
  - **Dotted target line**: from (start, 0) to (end, total).
  - **Dotted projection line**: from (start, 0) with slope = average verses/day, clipped to the chart area.
  - Include a legend and an accessible text summary.
- Below the chart:
  - projected finish date (or completion date)
  - average verses/day
  - required verses/day
  - the books in goal order, each with its own progress

### i18n
- Put every new string (including the five template names) in the page or component `<i18n lang="json">` blocks, translated for **all locales** the repo ships (see `docs/i18n/overview.md`).
- Run `npm run i18n:verify-keys` in `web/`.

---

## 6. Out of scope (follow-ups)

- Mobile app UI
- Partial-book, chapter or verse-range goals in the UI and API validation. The storage format already supports them (§1).
- Any template behavior beyond prefilling the wizard (templates are not stored on goals)
- Goal reminders/emails
- Including goals in Settings → Export/Import

---

## 7. Acceptance checklist

- [ ] API tests pass (`api` vitest), including the new `reading-goals.test.ts`.
- [ ] Shared unit tests cover every edge case in §4.
- [ ] `web`: lint, stylelint, type-check and unit tests pass.
- [ ] OpenAPI generation test passes with the new routes.
- [ ] An e2e spec in `e2e/tests/app/` covers this flow:
  1. Create a goal for a short book (e.g. Jude).
  2. See the goal on Today.
  3. Log the whole book.
  4. The goal achievement modal appears.
  5. The card shows a checkmark.
  6. The detail page renders the chart, projected finish and average.
- [ ] An e2e spec creates a goal from the **Gospels** template: it skips straight to Dates with the title prefilled and saves with Matthew–John as whole-book passages.
- [ ] Deleting a goal requires confirmation. The API rejects overlapping/duplicate passages and partial-book passages.

---

## 8. Assumptions (override if wrong)

- No cap on the number of goals per user.
- An inactive goal's detail page still works. Inactive goals never appear on Today.
- Editing a goal's books or dates recalculates everything; the achievement is not re-fired retroactively by an edit.
- Goal completion is evaluated only on log entry create/update, not on page load.
