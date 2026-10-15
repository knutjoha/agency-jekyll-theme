# PRD: Allowance page (Family Hub)

Repo: `knutjoha/agency-jekyll-theme`, branch `gh-pages`, app in `family-hub/` (Next.js).

## Overview
This is a new Allowance page in Family Hub for our three daughters. Each week has obligatory basic tasks, tracked in a daily checklist. Completing the basics earns a base allowance, and extra tasks earn more. Every Sunday there is a summary and a payout.

## Goals
- Make each daughter's weekly basic tasks visible, along with the extra tasks she has done.
- Calculate the weekly payout automatically: the base amount, plus approved extras, minus deductions for basics that were skipped.
- Keep a record for each week, so totals can be queried later.
- Match the existing design patterns in the repo. Add no features beyond this document.

## Users
- **Parents** set the base allowance amount, add extra tasks to the shared pool, approve each week on Sunday and pay out.
- **Daughters (3)** check off their own tasks, drag extra tasks from the pool into their own lane, and can add extra tasks of their own with their own amounts.

## Features
1. **Weekly basic tasks in a daily checklist.** The basics are obligatory every week, and every task must be listed. Whether there is also an optional daily check-in is still undecided (see Open Questions).
2. **Base allowance.** Completing the basics earns the base amount. The base amount is configurable.
3. **Extra tasks pool.** This is a separate pool of extra tasks that parents add, such as laundry, the dishwasher or vacuuming, and each one has a payout amount. A daughter drags a task into her lane and then marks it done.
4. **Kid-added extras.** The daughters can add their own extra tasks with their own amounts.
5. **One unified add-task form**, used by both parents and kids.
6. **Self check-off.** The daughters check off their own tasks. Extras need no proof.
7. **Sunday summary and payout.** Each week ends with a summary and payout for each daughter. Amounts lock once a parent approves the week on Sunday.
8. **Week navigation.** You can step from week to week, the same way as in the calendar and dinner planner.
9. **Running total.** The bottom of each lane shows that daughter's running total.

## Data Model
Storage is batched by week, the same way as the calendar and dinner planner, with one record per week.

- **Settings:** the base allowance amount and the deduction amount for each missed basic task.
- **Week record:** the week identifier, plus approval status (open or approved and locked) and when it was approved. For each daughter it holds:
  - the basic tasks and their daily checks
  - the extra tasks taken, with title, amount, who added the task (parent or kid) and whether it is done or approved
  - the computed totals: base, extras, deductions and total
- **Extra task pool:** the tasks that parents add, each with a title and an amount.

Per-week records allow totals to be queried later, for example per daughter across several weeks.

## UI/UX
- This is a new page laid out in swim lanes, with one lane for each daughter.
- Each lane is split into a **Base** section and an **Additions** section.
- The extra task pool sits separately, and tasks are dragged from it into a lane.
- The bottom of each lane shows that daughter's running total.
- Week-to-week navigation follows the calendar and dinner planner.
- The page reuses the existing design patterns and components in the repo.

## Rules
- If all basics are done, the daughter gets the base amount.
- Approved extras are added on top.
- Each skipped basic task is a deduction of one fixed amount.
- The daughters check off their own tasks, and extras need no proof.
- All amounts lock once a parent approves the week on Sunday.
- Kid-added extras carry the amount the kid sets.

## Open Questions
- Should there be an optional daily check-in? This is undecided.
