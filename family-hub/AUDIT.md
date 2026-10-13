# Family Hub QA / UX / responsive audit

**Date:** 13. oktober 2026  
**Base:** `gh-pages` @ `1202ec0`  
**Environment:** local `family-hub` on http://localhost:3000, fixture mode (no Supabase / Google / AI keys). Stable views used `?snapshot=1` (frozen lørdag 3. oktober 2026, 07:42).  
**Live check:** https://agency-jekyll-theme.vercel.app (Google calendar + persisted lists; not written to).

## Summary

| Severity | Count | PRs |
|---|---|---|
| P0 crash / data loss | 0 | — |
| P1 broken / unusable | 5 | listed below |
| P2 UX / UI / a11y | 16 | listed below |
| P3 polish | 4 | no PR (see skipped) |

**Fix PRs** (draft, against `gh-pages`):

| PR | Severity | What |
|---|---|---|
| [#20](https://github.com/knutjoha/agency-jekyll-theme/pull/20) | — | This audit |
| [#21](https://github.com/knutjoha/agency-jekyll-theme/pull/21) | P1 | Fluid Hjem layout (A01, A18, A27) |
| [#22](https://github.com/knutjoha/agency-jekyll-theme/pull/22) | P1 | Fluid Middag board + title ellipsis (A02, A05) |
| [#23](https://github.com/knutjoha/agency-jekyll-theme/pull/23) | P1 | Todo lanes scroll / tablet (A03, A04, A25) |
| [#24](https://github.com/knutjoha/agency-jekyll-theme/pull/24) | P2 | Privacy/terms wrap at 320 (A06) |
| [#25](https://github.com/knutjoha/agency-jekyll-theme/pull/25) | P2 | Fixture drag ghost + open editor only in snapshot (A07, A08) |
| [#26](https://github.com/knutjoha/agency-jekyll-theme/pull/26) | P2 | Dinner editor validation + dialog a11y (A10, A11) |
| [#27](https://github.com/knutjoha/agency-jekyll-theme/pull/27) | P2 | Todo undo toast timeout (A13, A14) |
| [#28](https://github.com/knutjoha/agency-jekyll-theme/pull/28) | P2 | 44 px tap targets (A12) |
| [#29](https://github.com/knutjoha/agency-jekyll-theme/pull/29) | P2 | Disable dead Ny hendelse (A09) |
| [#30](https://github.com/knutjoha/agency-jekyll-theme/pull/30) | P2 | Hjem dinner link + pickup tags (A15, A19) |
| [#31](https://github.com/knutjoha/agency-jekyll-theme/pull/31) | P2 | Kalender chip overflow at 768 (A24) |

**Skipped:** no paid AI planner calls; no writes to the live Supabase project; no changes to `family-hub/supabase/*.sql`, Google Calendar credentials, `/api/calendar` lane parsing, `vercel.json` crons, or the *text* of `privacy.html` / `terms.html`. Data-model findings are recorded, not patched.

### Biggest next UX improvements (not in this round)

1. Use the real ukemeny (and shopping count) on the Hjem dinner tile instead of a static fixture dish.
2. Make «Snart» and the calendar come from the same Google week, so Hjem and Kalender never disagree.
3. Raise `--text-muted` (or the tile-2 mix) so secondary copy meets WCAG AA on every surface.
4. Replace the hard 768 px phone/wide cut with a tablet band so the hallway does not jump in one step.
5. Keyboard-complete the boards: focusable task cards, a real dialog focus trap, and visible `:focus-visible` on every control.

---

## App map (coverage)

Routes are App Router pages under `family-hub/src/app`. There is no auth. Snapshot mode is `?snapshot=1`. Middag also takes `?week=YYYY-MM-DD`.

Legend: `[x]` tested at 320, 375, 414, 768, 1024, 1280, 1440, 1920 and 667×375 landscape.

### Shell

- [x] Nav rail (wide ≥768): Hjem, Kalender, Todo, Middag; active state; `snapshot` query preserved
- [x] Mobile tab bar (<768): same four routes, safe-area padding
- [x] Phone header: FAMILIEN VIDVEI, weekday, weather
- [x] Wide header: weekday, weather, week pill, clock
- [x] Back / forward between routes
- [x] Refresh mid-flow
- [x] Console / network on each route (fixture 404 for favicon only)

### `/` Hjem

- [x] Wide: I dag rows, event chips, weather meteogram, dinner tile, Snart
- [x] Phone: person cards, Snart preview, «se alle» / «vis færre»
- [x] Loading: weather fetch fallback to fixture (no spinner; silent)
- [x] Empty: not applicable (fixture always has people)
- [x] Error: weather failure falls back; no error banner
- [x] Logged in / out: no auth

### `/kalender`

- [x] Wide week grid, today outline, notice pill, week chevrons
- [x] Fixture: chevrons `aria-disabled` (Google-only shift) — expected
- [x] Phone: 7-day strip, agenda, warning rows, «Ny hendelse»
- [x] Empty day (søndag in snapshot): 1 hendelse / Pakke til hytta
- [x] Loading: `useCalendar` 60s poll; snapshot stays on fixture

### `/todo`

- [x] Wide: five lanes, filters Alle / Med frist / Fullførte
- [x] Edit task: focus, Enter save, empty title cancels, long title wrap
- [x] Frist picker: shortcuts, month nav, Fjern frist
- [x] Delete + Angre toast
- [x] Ny oppgave draft, double-click Lagre, empty draft
- [x] Toggle done
- [x] Phone: person switcher, swipe-to-delete, editor, toast
- [x] Landscape phone
- [x] Persist: fixture `persisted=false` (local only); live not written

### `/middag`

- [x] Wide: ukemeny, staged snapshot drag, shopping list
- [x] Editor dialog: valid / empty / non-numeric minutes / empty ingredient / long title / Escape
- [x] Backdrop click (does **not** close)
- [x] Focus escape from dialog
- [x] Drag swap between days
- [x] Add shopping item empty / long; toggle bought
- [x] Week chevrons disabled in fixture
- [x] Phone: Ukemeny / Handleliste, editor sheet, small targets
- [x] «Lag et forslag» / per-day refresh: **not** fired against a real AI key (hidden in fixture because `menuPersisted=false`)

### Legal

- [x] `/privacy.html` (layout only; copy out of scope)
- [x] `/terms.html` (layout only)

### Out of scope (not exercised)

- POST `/api/dinner/plan` with `ANTHROPIC_API_KEY` / `XAI_API_KEY`
- Writes to the hosted Supabase project
- Google Calendar OAuth / lane-parsing rules

---

## Issues

### A01 — Hjem wide layout clips below 1366 px

- **Severity:** P1
- **Route:** `/` (wide `HomeScreen`)
- **Viewport:** 768, 1024, 1280
- **Steps:** Open `/?snapshot=1` at 1024×800 or 768×1024.
- **Expected:** Tiles scale or wrap; no horizontal clip.
- **Actual:** Left column is a fixed 786 px and the right column a fixed 400 px (plus 96 px rail and 64 px padding). Content is clipped: dinner / Snart hang off the right, weather hangs off the bottom. `shell-main` is `overflow: hidden`.
- **Screenshot:** [audit-screenshots/A01-home-1024-clip.webp](audit-screenshots/A01-home-1024-clip.webp), [A01-home-768-clip.webp](audit-screenshots/A01-home-768-clip.webp)
- **PR:** [#21](https://github.com/knutjoha/agency-jekyll-theme/pull/21)

### A02 — Middag board clips on tablet

- **Severity:** P1
- **Route:** `/middag`
- **Viewport:** 768, 1024
- **Steps:** Open `/middag?snapshot=1` at 768 or 1024.
- **Expected:** Ukemeny and handleliste share the width; both usable.
- **Actual:** Ukemeny is a fixed 820 px column. Handleliste is shoved off-canvas. At 768 the week title / chevrons / «Dra for å bytte dag» collide.
- **Screenshot:** [audit-screenshots/A02-middag-768-clip.webp](audit-screenshots/A02-middag-768-clip.webp), [A02-middag-1024-clip.webp](audit-screenshots/A02-middag-1024-clip.webp)
- **PR:** [#22](https://github.com/knutjoha/agency-jekyll-theme/pull/22)

### A03 — Todo lanes unreadable at 768

- **Severity:** P1
- **Route:** `/todo`
- **Viewport:** 768
- **Steps:** Open `/todo?snapshot=1` at 768×1024. Open Maja’s editor.
- **Expected:** Five lanes remain readable, or the board scrolls horizontally on purpose.
- **Actual:** Names, titles and editor actions wrap one letter per line. «Lagre» overflows the lane. `MAIN-HCLIP 694>672`.
- **Screenshot:** [audit-screenshots/A03-todo-768-overflow.webp](audit-screenshots/A03-todo-768-overflow.webp)
- **PR:** [#23](https://github.com/knutjoha/agency-jekyll-theme/pull/23)

### A04 — Todo lanes do not scroll; extra tasks are unreachable

- **Severity:** P1
- **Route:** `/todo` (wide)
- **Viewport:** 1366×1024 (also any short laptop)
- **Steps:** In fixture, add ~9 tasks to Knut. Watch the lane grow past the viewport.
- **Expected:** The lane (or the board) scrolls so «Ny oppgave» and later cards stay reachable.
- **Actual:** Lane `overflow: visible`, `shell-main` `overflow: hidden`. Button bottom sat at y=1089 in a 1024-tall window. Tasks below the fold cannot be opened.
- **Screenshot:** [audit-screenshots/A04-todo-clipped-tasks.webp](audit-screenshots/A04-todo-clipped-tasks.webp)
- **PR:** [#23](https://github.com/knutjoha/agency-jekyll-theme/pull/23)

### A05 — Long dinner titles overflow the meal card

- **Severity:** P1
- **Route:** `/middag`
- **Viewport:** 1366 (also 1024)
- **Steps:** Edit mandag, save a long rett name.
- **Expected:** Title truncates or wraps inside the card.
- **Actual:** `whiteSpace: nowrap` with no overflow hidden. Text paints over the handleliste.
- **Screenshot:** [audit-screenshots/A05-middag-long-dish.webp](audit-screenshots/A05-middag-long-dish.webp)
- **PR:** [#22](https://github.com/knutjoha/agency-jekyll-theme/pull/22)

### A06 — Personvernerklæring heading overflows at 320

- **Severity:** P2
- **Route:** `/privacy.html`
- **Viewport:** 320
- **Steps:** Open `/privacy.html` at 320 px.
- **Expected:** No horizontal scroll; heading wraps.
- **Actual:** `h1` «Personvernerklæring for Family Hub» does not wrap (`scrollWidth` 290 in a 235 px article). `documentElement.scrollWidth` 332.
- **Screenshot:** [audit-screenshots/A06-privacy-320.webp](audit-screenshots/A06-privacy-320.webp)
- **PR:** [#24](https://github.com/knutjoha/agency-jekyll-theme/pull/24)

### A07 — Fixture / snapshot leaves a stuck drag ghost on Middag

- **Severity:** P2
- **Route:** `/middag`
- **Viewport:** all (overflow at 320)
- **Steps:** Open `/middag` or `/middag?snapshot=1` without Supabase.
- **Expected:** A clean week, or a staged drag only inside an explicit snapshot for visual tests.
- **Actual:** `MiddagBoard` / `MiddagMobile` seed `lift` with `stagedDrag` whenever `!menuPersisted`. Taco floats over onsdag/fredag and looks like a broken drag. At 320 the 300 px floater at `left: 40` overflows (`article right=356`).
- **Screenshot:** [audit-screenshots/A07-middag-320-floater.webp](audit-screenshots/A07-middag-320-floater.webp)
- **PR:** [#25](https://github.com/knutjoha/agency-jekyll-theme/pull/25)

### A08 — Fixture Todo opens an editor on first paint

- **Severity:** P2
- **Route:** `/todo`
- **Viewport:** phone (wide also seeds `editing` on Maja)
- **Steps:** Open `/todo?snapshot=1` or `/todo` in fixture mode.
- **Expected:** A resting list. Snapshot may freeze one card only if the visual test needs it.
- **Actual:** `todoLanes` marks `maja-rom` as `editing`. Phone then forces `knut-dekk` into edit. Real fixture users land in a half-finished form, with a fake caret (`caretColor: transparent`).
- **Screenshot:** [audit-screenshots/A08-todo-snapshot-edit.webp](audit-screenshots/A08-todo-snapshot-edit.webp)
- **PR:** [#25](https://github.com/knutjoha/agency-jekyll-theme/pull/25)

### A09 — «Ny hendelse» does nothing

- **Severity:** P2
- **Route:** `/kalender` (phone)
- **Viewport:** ≤414
- **Steps:** Tap «Ny hendelse».
- **Expected:** An editor, or a disabled control that says the action is not available (calendar is read-only from Google).
- **Actual:** The button has no `onClick`. URL does not change; no dialog.
- **Screenshot:** [audit-screenshots/A09-kalender-ny-hendelse.webp](audit-screenshots/A09-kalender-ny-hendelse.webp)
- **PR:** [#29](https://github.com/knutjoha/agency-jekyll-theme/pull/29)

### A10 — Dinner editor uses the same copy for validation and save failure

- **Severity:** P2
- **Route:** `/middag` editor
- **Viewport:** 1366 dialog / phone sheet
- **Steps:** Clear Rett, or type `abc` in Minutter, or add an ingredient with empty mengde, then Lagre.
- **Expected:** Field-specific Norwegian validation («Skriv inn en rett», «Minutter må være et tall mellom 1 og 600»).
- **Actual:** Always `Fikk ikke lagret middagen. Prøv igjen.` — a retry message for a client-side validation miss.
- **Screenshot:** [audit-screenshots/A10-editor-error.webp](audit-screenshots/A10-editor-error.webp)
- **PR:** [#26](https://github.com/knutjoha/agency-jekyll-theme/pull/26)

### A11 — Dinner dialog does not trap focus or close on backdrop

- **Severity:** P2
- **Route:** `/middag` dialog
- **Viewport:** ≥768
- **Steps:** Open an editor. Tab 12 times. Click the dimmed board.
- **Expected:** Focus stays in the dialog; backdrop click (or a documented choice) closes it. Escape already works.
- **Actual:** Focus walks into the nav rail and shopping list. Backdrop click leaves the dialog open. No `aria-modal` focus loop.
- **Screenshot:** [audit-screenshots/A10-editor-error.webp](audit-screenshots/A10-editor-error.webp)
- **PR:** [#26](https://github.com/knutjoha/agency-jekyll-theme/pull/26)

### A12 — Touch targets under 44×44 px

- **Severity:** P2
- **Route:** `/middag`, `/todo`, `/kalender`, tab bar
- **Viewport:** 320–414
- **Steps:** Inspect buttons in the running phone UI.
- **Expected:** ≥44×44 px CSS hit area.
- **Actual:** Shopping checkboxes 20×20, middag grip 15×15, pencil 14×14, week chevrons 38×38, Ukemeny/Handleliste switch 34 px tall, tab-bar items ~42 px tall before safe-area, todo checkboxes 26×26, frist calendar cells 32×32.
- **Screenshot:** [audit-screenshots/A07-middag-320-floater.webp](audit-screenshots/A07-middag-320-floater.webp), [A08-todo-snapshot-edit.webp](audit-screenshots/A08-todo-snapshot-edit.webp)
- **PR:** [#28](https://github.com/knutjoha/agency-jekyll-theme/pull/28)

### A13 — Todo undo toast never auto-dismisses

- **Severity:** P2
- **Route:** `/todo`
- **Viewport:** all
- **Steps:** Delete a task. Wait 6+ seconds.
- **Expected:** Toast times out (or offers dismiss) so it does not cover «Ny oppgave».
- **Actual:** `removed` stays until Angre or another delete. After 6 s the toast was still in the DOM.
- **Screenshot:** [audit-screenshots/A13-todo-toast.webp](audit-screenshots/A13-todo-toast.webp)
- **PR:** [#27](https://github.com/knutjoha/agency-jekyll-theme/pull/27)

### A14 — Phone landscape: toast covers the list and the tab bar

- **Severity:** P2
- **Route:** `/todo`
- **Viewport:** 667×375
- **Steps:** Delete a task, rotate to landscape.
- **Expected:** Toast sits above the tab bar without hiding the first tasks.
- **Actual:** Fixed toast at `bottom: calc(72px + env(safe-area-inset-bottom))` covers Ulla’s remaining cards and overlaps the tab bar.
- **Screenshot:** [audit-screenshots/A14-todo-landscape-toast.webp](audit-screenshots/A14-todo-landscape-toast.webp)
- **PR:** [#27](https://github.com/knutjoha/agency-jekyll-theme/pull/27)

### A15 — Hjem dinner tile is not a link

- **Severity:** P2
- **Route:** `/`
- **Viewport:** ≥768
- **Steps:** Click MIDDAG I DAG / «6 varer».
- **Expected:** Goes to `/middag` (the tile is the only dinner surface on Hjem).
- **Actual:** Static `<section>`. Phone Hjem has no dinner entry at all (by design of the phone frame), so the wide tile is the hallway shortcut and it is dead.
- **Screenshot:** [audit-screenshots/A01-home-1920-stretch.webp](audit-screenshots/A01-home-1920-stretch.webp)
- **PR:** [#30](https://github.com/knutjoha/agency-jekyll-theme/pull/30)

### A16 — `--text-muted` on `--tile-2` fails WCAG AA

- **Severity:** P2
- **Route:** all wide tiles
- **Viewport:** all
- **Steps:** Contrast of `#7C838D` on `#1E2126`.
- **Expected:** ≥4.5:1 for 14 px body / 12 px due labels.
- **Actual:** 4.22:1. Due dates and lane details on `tile-2` fail AA. Token change would re-skin the whole app — recorded, not patched in this round.
- **Screenshot:** [audit-screenshots/A03-todo-768-overflow.webp](audit-screenshots/A03-todo-768-overflow.webp)
- **PR:** skipped (design-token; see next improvements)

### A18 — Wide Hjem is clipped vertically at 800 px tall

- **Severity:** P2 (same root as A01)
- **Route:** `/`
- **Viewport:** 1024×800, 1280×800
- **Steps:** Open Hjem at 800 px height.
- **Expected:** Page scrolls or tiles shrink so Været i dag is fully visible.
- **Actual:** `MAIN-VCLIP 992>800`. Weather tile is cut off. Grouped with A01.
- **Screenshot:** [audit-screenshots/A01-home-1024-clip.webp](audit-screenshots/A01-home-1024-clip.webp)
- **PR:** [#21](https://github.com/knutjoha/agency-jekyll-theme/pull/21)

### A19 — Transport / hentepiller missing on Hjem

- **Severity:** P2
- **Route:** `/`
- **Viewport:** all
- **Steps:** Compare Amelia on Hjem vs Kalender. Fixture has `transport: { kind: "missing", label: "Sjåfør mangler" }`.
- **Expected:** The pickup tag from PR #18 still shows on I dag.
- **Actual:** `PersonRow` and `HomeMobile` PersonCard never render `person.transport`. Kalender still warns. Product copy in `privacy.html` still mentions hentenotater.
- **Screenshot:** [audit-screenshots/home-320.webp](audit-screenshots/home-320.webp)
- **PR:** [#30](https://github.com/knutjoha/agency-jekyll-theme/pull/30)

### A24 — Kalender day chips overflow at 768

- **Severity:** P2
- **Route:** `/kalender`
- **Viewport:** 768
- **Steps:** Open the week grid at 768.
- **Expected:** Activity titles wrap or ellipsize inside the cell.
- **Actual:** «Håndballkamp», «Familiekveld», «sjåfør» clip inside 7 columns + 140 px name column.
- **Screenshot:** [audit-screenshots/A24-kalender-768.webp](audit-screenshots/A24-kalender-768.webp)
- **PR:** [#31](https://github.com/knutjoha/agency-jekyll-theme/pull/31)

### A25 — Todo cards are not keyboard-activatable

- **Severity:** P2
- **Route:** `/todo`
- **Viewport:** wide
- **Steps:** Tab from the rail. Try to open a task without a mouse.
- **Expected:** Cards in the tab order; Enter/Space opens edit.
- **Actual:** `<article onClick>` has no `tabIndex`. Filters and «Ny oppgave» are reachable; existing tasks are not. Grouped with the todo responsive PR if a small `role="button"` is enough; otherwise skipped as a larger a11y pass.
- **Screenshot:** [audit-screenshots/todo-frist-open.webp](audit-screenshots/todo-frist-open.webp)
- **PR:** [#23](https://github.com/knutjoha/agency-jekyll-theme/pull/23)

### A26 — Hjem dinner dish is fixture-only, not the ukemeny

- **Severity:** P2 (data wiring)
- **Route:** `/`
- **Viewport:** ≥768
- **Expected:** «MIDDAG I DAG» shows today’s meal from `/api/dinner`.
- **Actual:** `DinnerTile` always reads `dinner` from `src/data/fixture.ts` (`Ovnsbakt laks med poteter`, «6 varer»). Live Vercel shows the same dish while `/middag` is week `2026-10-12`. Needs a read of the dinner API on Hjem — skipped (would couple Hjem to the household store beyond a layout fix).
- **Screenshot:** [audit-screenshots/A01-home-1920-stretch.webp](audit-screenshots/A01-home-1920-stretch.webp)
- **PR:** skipped (data wiring; see next improvements)

### A27 — Hjem looks stretched at 1920

- **Severity:** P3
- **Route:** `/`
- **Viewport:** 1920
- **Expected:** Content max-width / centering so line length and tile proportions hold.
- **Actual:** The 786+400 hallway sits left-aligned in a sea of `--bg`. Grouped as polish with A01 if a `max-width` is cheap; otherwise next.
- **Screenshot:** [audit-screenshots/A01-home-1920-stretch.webp](audit-screenshots/A01-home-1920-stretch.webp)
- **PR:** [#21](https://github.com/knutjoha/agency-jekyll-theme/pull/21) (1400 px cap on the hallway page)

### P3 (no PR)

- **A17** Transparent caret in todo title fields (orange bar is the designed caret).
- **A20** `favicon.ico` 404 on first load of `/` at 320 (only console error in the sweep).
- **A21** Snapshot drag at 320 is the same as A07.
- **A22** `:focus-visible` missing on checkboxes that set `outline: none` when done.

---

## Breakpoints

The app has **one** layout breakpoint: `max-width: 767px` in `globals.css` (phone tab bar + `.only-phone`). Wide layouts then use **fixed pixel widths** (786, 400, 820, 140) instead of the token scale. No `clamp()` on type or spacing. That is why 768–1280 fails and 1920 looks empty.

---

## Issue → PR index

| ID | PR |
|---|---|
| A01 A18 A27 | [#21](https://github.com/knutjoha/agency-jekyll-theme/pull/21) |
| A02 A05 | [#22](https://github.com/knutjoha/agency-jekyll-theme/pull/22) |
| A03 A04 A25 | [#23](https://github.com/knutjoha/agency-jekyll-theme/pull/23) |
| A06 | [#24](https://github.com/knutjoha/agency-jekyll-theme/pull/24) |
| A07 A08 | [#25](https://github.com/knutjoha/agency-jekyll-theme/pull/25) |
| A09 | [#29](https://github.com/knutjoha/agency-jekyll-theme/pull/29) |
| A10 A11 | [#26](https://github.com/knutjoha/agency-jekyll-theme/pull/26) |
| A12 | [#28](https://github.com/knutjoha/agency-jekyll-theme/pull/28) |
| A13 A14 | [#27](https://github.com/knutjoha/agency-jekyll-theme/pull/27) |
| A15 A19 | [#30](https://github.com/knutjoha/agency-jekyll-theme/pull/30) |
| A24 | [#31](https://github.com/knutjoha/agency-jekyll-theme/pull/31) |
| A16 A26 | skipped |
