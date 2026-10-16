# PRD: Verdi (Family Hub v1.1)

Repo: `knutjoha/agency-jekyll-theme`, branch `gh-pages`, app in `family-hub/` (Next.js).

**Status:** Build-ready for v1.1. Do not implement from the 15.10.2026 sketch; this document replaces it.  
**Date:** 16.10.2026  
**Decisions:** Knut, 16.10.2026 (BASE_NOK filled the same day)  
**Household:** [family-hub-prd.md](family-hub-prd.md) §5.8  
**BASE_NOK:** 50 (same weekly kroner for Amelia, Hedda and Maja).

The product UI is Norwegian. This document is in English.

---

## 1. Summary

Verdi is a fifth nav item. It is the un-parked chores slice: three daughters, one current week, a shared honour-system iPad.

Each daughter has the same obligatory basics, a skip counter, extras with kroner amounts, and a running total:

```
shown = 50 + completed extras − 10 * skips
```

`BASE_NOK` is the named constant **50**. Each skip plus deducts 10 NOK. Only extras marked complete on a daughter’s lane count.

Basics still have no ticks, no daily check-in, no Sunday cron, and no payout in this app. One **Fullfør uke** button locks the week. Money leaves the house in another app.

A fourth **Ledige** lane holds extra tasks anyone can define (title + amount). Kids pick one up by dragging it to their column (phone: **Ta** on that daughter’s view). When the work is done, they mark the extra complete — Todo’s 22×22 checkbox, not a new control.

Match Todo for empty-lane create, complete checkboxes, and phone vs iPad. Match Middag for the week id (Monday, Europe/Oslo) and for pointer-drag on the wide board. Do not invent a third pattern. Reuse Family Hub tiles, type, and primary pills (`Lagre` convex lighting on **Fullfør uke** and extra **Lagre**). Skeletons on route change, never orbs. Nav stays flat.

---

## 2. Personas

Only the three daughters have lanes. Parents use the same screen; they do not get lanes.

| Person | Role on Verdi |
|---|---|
| **Amelia Vidvei**, 13, 8A Ringstabekk | Daughter. Own lane. |
| **Maja Vidvei**, 11, 6C Jar | Daughter. Own lane. |
| **Hedda Vidvei**, 13, 8B Ringstabekk | Daughter. Own lane. |
| **Knut Johannessen Vidvei**, parent | Parent. Same honour-system access as everyone else. |
| **Ulla Marie Vidvei**, parent | Mother. Not a daughter. No lane. Same access as Knut. |

Ulla is the mother. Do not add a fourth daughter lane. Do not put Knut or Ulla on this board.

Lane order on screen follows the existing daughter order in Todo (after the parent lanes): **Amelia, Hedda, Maja**. Person ids: `amelia`, `hedda`, `maja`.

---

## 3. Jobs to be done

1. **Anyone, hallway.** When I walk past the iPad, I want this week’s kroner for Amelia, Hedda and Maja in a few seconds, so I know where each of them stands without asking.
2. **Anyone.** When a basic was skipped, I want to add one skip, so the total drops by 10 NOK without ticking a checklist.
3. **Anyone.** When I tapped plus too many times, I want to step back with minus, so a miss-tap is not stuck.
4. **Anyone.** When extra work is worth money, I want to add a titled extra with an amount on **Ledige** or on a daughter’s lane, so the row exists without a parent approving it.
5. **Daughter.** When I take a spare extra, I want to drag it from **Ledige** onto my column (phone: **Ta**), so it becomes mine.
6. **Daughter.** When I have finished an extra on my lane, I want to mark it complete, so its kroner land in my `shown`.
7. **Anyone.** When the week is done, I want to press **Fullfør uke**, so the numbers freeze and payout can happen in the other app.
8. **Daughter, empty extras.** When her extras list is empty, I want the same create-new control as Todo, so I am not staring at a blank lane with special copy.

---

## 4. Scope

### In v1.1

- Fifth nav item: Lucide money/banknote icon, label **Verdi**, route `/verdi`. Same `navItems` list as Hjem / Kalender / Todo / Middag. Phone uses the existing bottom tab bar; iPad/desktop uses the existing side rail. Five `flex: 1` tabs. Do not add a overflow or “more” menu.
- Current Monday-week only, week id = Monday `YYYY-MM-DD` in Europe/Oslo, same `mondayOf` / `mondayFor` model as Middag (`starts_on` / dinner `week_id`). Not the calendar payload.
- Three daughter lanes plus a fourth **Ledige** extras pool. Shared household basics. Per-kid skip integer. Per-kid extras. Pool extras (title + amount) that a kid claims by drag (wide) or **Ta** (phone). Complete checkbox on extras in a daughter’s lane. One lock for the week.
- Honour system on the unsigned-in hallway iPad.

### Out of scope

- Payout, Vipps, bank, transfers, running balance across weeks, “pay” buttons.
- Auth, Google login wall, PIN, parent session, kid logins.
- Per-task checkboxes on **basics**, daily check-in, skip-per-day, mapping the skip integer onto individual basics. (Extras in a daughter’s lane *do* have a complete checkbox.)
- Sunday cron, scheduled lock, reminders.
- Week rewind / Forrige–Neste week (Middag has this; Verdi does not in v1.1). If a locked week is ever shown later, **locked stays locked**. There is no unlock.
- Calendar writes. Verdi does not create or edit Team Vidvei events.
- Per-item parent approval of extras. Dragging extras between daughters, or back to **Ledige**.
- Special empty, error, or offline copy. No new error strings for this page.
- Caps on extra count or extra amount. Floor on `shown` (only `skips` is floored at 0).
- Adding or removing basics from the set of four. Titles of those four may be edited.

---

## 5. Rules

1. **Same base.** `BASE_NOK` is **50**, one household number, used for all three. Implementation: a single named constant `BASE_NOK = 50`.
2. **Basics, same list.** Seeded for all three, household-shared (edit title → all three lanes):
   - Ryddig i gangen
   - Ta ut av gymbagen
   - Ta opp matpakke
   - Rydde rommet på fredag
3. **No ticks on basics.** Basics are labels, not a checklist. “Rydde rommet på fredag” is the name of a basic, not a Friday-only check-in. Extras on a daughter’s lane use Todo’s complete checkbox. Pool extras have no checkbox until claimed.
4. **Skip integer.** One persistent integer `skips` per daughter per week. Starts at **0**. Plus adds 1. Minus subtracts 1. **Never below 0.** No product cap on the way up (the four basics are the reference list, not a counter limit).
5. **Skip display.** Show the kroner deduction, not the raw count: `0`, `−10`, `−20`, … (minus sign, then `10 * skips`, no “kr” required if the lane already says NOK; if a unit is shown, use **kr**). Each plus is **−10 NOK**.
6. **Deduction is per skipped task, not per day.** The 10 NOK step is fixed. It is not configurable in v1.1.
7. **Extras.** Anyone adds an extra on **Ledige** or on a daughter’s lane: title + positive integer NOK amount. No cap. A pool extra is claimed onto one daughter (wide: drag the grip onto her column; phone: **Ta** on her view). Claimed extras start incomplete. Completing an extra on her lane adds its amount to `extras` in the formula. Unclaimed and incomplete extras do not count. No per-item approval. The week lock is the only approval. Direct **Ny ekstra** on a daughter’s lane is still allowed and starts incomplete.
8. **Who may edit.** No restrictions. Anyone at the shared iPad may press ±, add/delete extras, edit an extra, edit a basic title, and press **Fullfør uke**. No PIN.
9. **New week.** When Oslo today is in a new Monday-week, `/verdi` shows a new unlocked record: `skips = 0`, extras empty, same four basics. No job copies last week’s extras. No Sunday script.
10. **Lock.** **Fullfør uke** sets `locked = true` on that week id. After lock: ±, extras, basics, and the button are inert. Totals stay visible. Payout is manual elsewhere.
11. **Formula.** `shown = 50 + completed extras − 10 * skips`. `shown` may be below 50. Do not floor `shown` at 0.

---

## 6. Data model

One week record, keyed like Middag, not like the calendar.

**Week id.** Monday of the current Oslo calendar week: `mondayOf(osloDateKey(now))` → `YYYY-MM-DD`. Example: Saturday 11.10.2026 → `2026-10-05`. Display label may reuse Middag’s period (`05.10 – 11.10` / `Uke N`) so the family can see which week they are locking. No week-shift controls.

**Household (not per week)**

| Field | Meaning |
|---|---|
| `BASE_NOK` | Weekly kroner, same for all three. **50.** |
| basics[4] | `{ id, title }` seeded as the four Norwegian strings above. Shared. Title editable. Membership of the four is fixed. |

**Per week**

| Field | Meaning |
|---|---|
| `week_id` | Monday ISO date. Primary key. |
| `locked` | boolean, default `false`. |
| `locked_at` | optional timestamp, set when **Fullfør uke** succeeds. |

**Per week × daughter** (`amelia` \| `hedda` \| `maja`)

| Field | Meaning |
|---|---|
| `skips` | integer ≥ 0. Default 0. |
| extras[] | `{ id, title, amount_nok, done }` with `amount_nok` a positive integer, `done` default false. No cap. Only `done` extras sum into `shown`. |

**Per week × pool** (`person_id = pool`)

| Field | Meaning |
|---|---|
| extras[] | Same shape. `done` is always false while in the pool. Claiming sets `person_id` to a daughter and appends to her extras. |

Derived, do not persist as source of truth: `extras_sum` (completed extras on that daughter), `deduction = 10 * skips`, `shown = 50 + extras_sum − deduction`.

Persist in Supabase the same way as todos/dinner (service role, no user login). Fixture snapshot may seed an unlocked current week with `skips = 0` and empty extras. Always derive totals from `BASE_NOK` (50), never store a guessed amount.

---

## 7. UI

Norwegian copy only in the UI. Do not add helper paragraphs for empty/error/offline.

### 7.1 Shell

| Surface | Nav | Board |
|---|---|---|
| **Phone** (`max-width: 767px`) | Existing bottom tab bar, fifth item **Verdi**. Hide the side rail (already). | Same principle as Todo: `HallwayPage` + phone column. Avatar chips for Amelia / Hedda / Maja plus a **Ledige** chip. One lane at a time. On a daughter, pool extras appear under **Ledige** with **Ta**. |
| **iPad / desktop** | Existing side rail, fifth item **Verdi**. | Three daughter swim lanes plus **Ledige**, Todo board pattern (person header, tile, nested cards). Pool extras have a Middag-style grip; drag onto a daughter column to claim. |

Do not put parent avatars on Verdi. Phone chips are the three daughters plus **Ledige**. Default selected chip is Amelia.

### 7.2 Page chrome (wide)

- Title **Verdi**.
- Week label for the current Monday-week (Middag-style `Uke N · period` is fine).
- No Forrige / Neste.
- Primary pill **Fullfør uke** (convex `pill-primary`, same recipe as **Lagre**). After lock, replace with inert status **Uken er låst** — not a second accent CTA.

### 7.3 Lane

Header: daughter initial on her colour token, name, `shown` as the running total (the number the family came for).

**Faste oppgaver** — the four basics as text rows. No checkboxes. Tapping a title edits it (shared). Click outside cancels, **Lagre** keeps it, same outside-cancel rule as Todo. No **Avbryt**.

**Hoppet over** — minus, the deduction label (`0` or `−10` or `−20`…), plus. Minus disabled at 0. Plus always enabled while unlocked.

**Ekstra** — list of extras, each showing Todo’s complete checkbox, title and amount. Tap the row to edit (title + **Beløp**). **Slett** / **Lagre** like Todo. Click outside cancels. Phone may keep Todo’s swipe-to-**Slett**. Completing ticks the box, strikes the title, and adds the amount to `shown`. Unticking removes it from `shown`.

**Ledige** (fourth lane, after Maja) — no basics, no skip control, no `shown`. List of unclaimed extras (title + amount, grip on wide). Same **Ny ekstra** create-new as the other lanes. No complete checkbox while in the pool. Wide: drag by the grip onto a daughter column. Phone: extras also list under **Ledige** on each daughter’s view with **Ta** (claims for that daughter).

**Create-new**, always present while unlocked and not already drafting, including when extras is empty. Same dashed/outline Plus row as Todo, same function (opens an inline draft, not a modal, not a special empty state):

| Surface | Label |
|---|---|
| iPad / desktop | **Ny ekstra** |
| Phone | **Ny ekstra til {shortName}** (e.g. `Ny ekstra til Amelia`) |

Draft fields: **Oppgave** (title) and **Beløp** (positive integer NOK). **Lagre** disabled until both are valid. No due date. No cap on amount.

Locked: list stays; create-new, ±, editors, **Slett**, and **Fullfør uke** do not write.

### 7.4 Phone chrome

`PhoneHeader` as on Todo. Then the three daughter chips plus **Ledige**. Then the selected lane (basics, skip control, unclaimed **Ledige** with **Ta**, extras, create-new) — or just extras + create-new when **Ledige** is selected. **Fullfør uke** once, for the week, not per lane — pin it with the week label above the chips or directly under the header, not copied inside each daughter.

---

## 8. Acceptance criteria

### Plus / minus bounds

**Given** Hedda’s `skips` is 0 on the current unlocked week  
**When** anyone taps minus  
**Then** `skips` stays 0, the label stays `0`, and `shown` does not change

**Given** Amelia’s `skips` is 0  
**When** anyone taps plus once  
**Then** `skips` is 1 and the skip label is **−10** and `shown` drops by 10

**Given** Amelia’s `skips` is 2 (label **−20**)  
**When** anyone taps minus  
**Then** `skips` is 1, the label is **−10**, and `shown` rises by 10

**Given** `skips` is 4  
**When** anyone taps plus  
**Then** `skips` is 5 and the label is **−50** (no cap at four basics)

### Add extra with amount

**Given** Maja’s extras list on the current unlocked week  
**When** anyone taps **Ny ekstra** / **Ny ekstra til Maja**, types title `Støvsuge 1. etasje` and beløp `50`, then **Lagre**  
**Then** that extra is on Maja’s lane only, incomplete  
**And** her `shown` does not rise until the extra is marked complete  
**And** Amelia and Hedda are unchanged  
**And** no parent approval step appears

### Pool extra, claim, complete

**Given** the current unlocked week and an empty **Ledige** lane  
**When** anyone taps **Ny ekstra** on **Ledige**, types title `Tømme oppvaskmaskin` and beløp `20`, then **Lagre**  
**Then** that extra is in the pool only, `done` is false, and no daughter’s `shown` changes

**Given** that pool extra on the wide board  
**When** anyone drags it by the grip onto Amelia’s column  
**Then** it leaves **Ledige** and sits on Amelia’s extras, still incomplete  
**And** Amelia’s `shown` is still 50

**Given** that extra on Amelia’s lane  
**When** anyone marks it complete  
**Then** Amelia’s `shown` is 70  
**And** Hedda and Maja are unchanged

**Given** that pool extra on the phone, Amelia’s chip selected  
**When** anyone taps **Ta** on it  
**Then** it is claimed onto Amelia the same way as a wide drag

**Given** an extra draft with an empty title or a non-positive amount  
**When** anyone taps **Lagre**  
**Then** it is not saved

### Complete-week lock

**Given** the current week is unlocked  
**When** anyone taps **Fullfør uke**  
**Then** `locked` is true for that `week_id`  
**And** ±, extra create/edit/delete, basic title edit, and **Fullfør uke** no longer write  
**And** each `shown` stays on screen  
**And** the UI shows **Uken er låst**  
**And** the app does not pay out, open Vipps, or write the calendar

### Empty lane create

**Given** Hedda has no extras this week (basics and skip control still show)  
**When** the lane is on screen and unlocked  
**Then** there is no empty-state sentence  
**And** the Todo-style create-new control is there (**Ny ekstra** / **Ny ekstra til Hedda**) and opens the same inline draft as a lane that already has extras

### Honour-system anyone-can-edit

**Given** the hallway iPad with no login and no PIN  
**When** anyone (parent or daughter) edits a basic title, changes a skip, adds or deletes an extra, or presses **Fullfør uke**  
**Then** the write is accepted  
**And** a basic title change is the same four titles on all three lanes  
**And** the app does not ask who is acting

### Week rewind (not in v1.1)

**Given** v1.1  
**Then** there are no Forrige / Neste week controls on Verdi  
**And** `/verdi` is the current Monday-week only

**Given** a week that is already `locked`  
**When** that week is shown (now, or in a later rewind)  
**Then** it stays locked — no unlock control in this PRD

---

## 9. Norwegian labels

| Role | Copy |
|---|---|
| Nav + page title | Verdi |
| Basics section | Faste oppgaver |
| Basic 1 | Ryddig i gangen |
| Basic 2 | Ta ut av gymbagen |
| Basic 3 | Ta opp matpakke |
| Basic 4 | Rydde rommet på fredag |
| Skip section | Hoppet over |
| Skip at 0 | 0 |
| Skip at n>0 | −{10n} (example: −10, −20) |
| Extras section | Ekstra |
| Pool lane + phone chip | Ledige |
| Pool extras on a daughter (phone) | Ledige |
| Claim (phone) | Ta |
| Extra title field | Oppgave |
| Extra amount field | Beløp |
| Create (wide) | Ny ekstra |
| Create (phone) | Ny ekstra til {shortName} |
| Create (phone, Ledige) | Ny ekstra |
| Save | Lagre |
| Delete | Slett |
| Complete week | Fullfør uke |
| Locked status | Uken er låst |

Reuse Todo **Lagre** / **Slett**. Do not add **Avbryt**. Amounts already in context may omit a unit; if a unit is needed, **kr**.

---

## 10. Build notes (for the implementer, not extra product)

- Route `/verdi`. Add `{ href: "/verdi", label: "Verdi", icon: Banknote }` (or the closest Lucide money icon) to `navItems`. Add `"/verdi"` to `APP_PATHS`. Skeleton `loading.tsx` like Todo/Middag.
- Phone vs wide: `TodoScreen` / `HallwayPage` split, not a new breakpoint.
- Week key: `mondayFor(null, now)` / `mondayOf(osloDateKey(now))`, same as dinner `week_id`.
- Named constant `BASE_NOK = 50`. Skip step `SKIP_NOK = 10`.
- Greenfield SQL: `family-hub/supabase/verdi.sql` (`person_id` includes `pool`, extras have `done`). If an earlier Verdi schema already ran, `family-hub/supabase/verdi-pool.sql` is the additive alter.
- Wide drag: pointer-drag from the pool grip onto `[data-person]`, same hit-testing idea as Middag. Phone does not drag; it uses **Ta**.
- Complete control: reuse Todo `CheckBox` (22×22). Do not tick basics.
