# Family Hub: Product Requirements Document

**Household:** Vidvei family, Åsveien 34D, 1369 Stabekk
**Owner:** Knut Johannessen Vidvei
**Status:** Draft for review, before design
**Date:** 03.10.2026

This document covers what the product has to do and who it is for. It does not cover visual design, layout, wireframes or mockups. Those come after Knut has reviewed the requirements here.

---

## 1. Summary

Family Hub is a responsive web app for running the Vidvei household day by day, week by week and month by month. It is built mainly for a shared iPad in the hallway, probably with a second iPad in the kitchen. The same app works on the parents' phones and on a desktop for longer planning sessions.

It is for two working parents who carry most of the coordination, and for three daughters who mainly need to know what is happening today and who is picking them up.

**Outcome in one sentence:** anyone in the family can walk past the hallway screen and know, in a few seconds, what today holds for each person, and the parents can plan the week from five shared places: today, the calendar, todos, the shopping list and dinners.

Knut set the v1 core on 03.10.2026. Those five features are the product. Everything else waits.

The product UI will be in Norwegian. This document is in English.

---

## 2. Problem

The Vidveis have a lot of moving parts and no single place where they come together. Two parents both work. Knut is in the office most days, roughly 09–17. We do not yet know Ulla Marie's work pattern. There are three daughters at two schools: the twins Amelia and Hedda are in 8A and 8B at Ringstabekk skole, and Maja is in 6C at Jar skole. Each school has its own messages, forms and holiday calendar.

On top of school come activities. Amelia and Hedda both play handball for Stabekk Jenter 13, Amelia also does theater with Theater Ensemblet, and Maja does cheerleading with Charmers Delight 26/27. Practices, matches, performances and competitions overlap, and each one raises the same questions: who drives, who picks up, and does it clash with something else.

Further out there is a cabin in Flesberg, a car that needs an EU-kontroll, insurance and passports to renew, the skattemelding every April, birthdays that need gifts, and school holidays (høstferie, juleferie, vinterferie, påske) that shape travel. Most of this lives in the parents' heads, scattered calendars and school messages. Things slip because nobody had the full picture at the right moment, not because nobody cared.

The hallway screen adds its own constraint. It is shared, it is glanced at rather than read, and it is often seen while someone is on their way out the door. Whatever it shows has to be readable from a step away and make sense without logging in or tapping around.

---

## 3. Personas

These personas only use facts the family has given us. Where something is unknown, we say so rather than guessing. Ages are as of 03.10.2026.

### 3.1 Knut Johannessen Vidvei, parent, 42

**Context.** Knut handles the main finances, the cars, maintenance, building projects and the household tech. He works as SVP Head of Applications at Cognite, is in the office most days, and usually works 09–17. He prefers short bullet summaries and a morning digest. He does not want messages after 21:00 and avoids meetings before 09:00. He is intolerant to gluten and lactose (not allergic), which affects meal planning. Outside work and family he wants to train three days a week, plays guitar and does home improvement projects.

**Goals.**
- More routine this year. This is his stated goal for the year.
- Get renewals and deadlines (skattemelding, EU-kontroll, insurance, passports) handled before they become urgent.
- Run a short, predictable weekly planning session instead of patching things together day by day.
- Protect time for training, guitar and home projects without it clashing with family logistics.

**Frustrations.**
- Deadlines and forms turning up late.
- Logistics conflicts found the same day.
- Long or noisy notifications, and anything that arrives after 21:00.

**What success looks like.**
- *Hallway iPad:* walking past in the morning, he sees today's plan, who drives where, and anything due soon, without touching the screen.
- *His phone:* one morning digest in short bullets. No messages after 21:00. Quick capture of a task or deadline when it comes up.
- *Desktop:* where he sets up renewals, recurring items and the weekly plan when he wants a bigger screen.

### 3.2 Ulla Marie Vidvei, parent, 42 (partial persona)

**What we know.** Ulla Marie is a parent in the household. Her listed activities are work, family and workout.

**What we do not know.** Her role and work pattern, how she prefers to receive information, any health or dietary needs, her interests, her goals, and which household areas she owns. This persona is deliberately incomplete and needs her input before design. In particular, we cannot assume how coordination is split between the parents.

**Goals (provisional, based only on what is listed).**
- Keep work, family and workout time from crowding each other out.
- See the shared family picture without having to ask Knut or keep it in her head.

**Frustrations.** Unknown. To be gathered from Ulla Marie directly.

**What success looks like (provisional).**
- *Hallway iPad:* the same at-a-glance picture of today and this week as Knut.
- *Her phone:* to be defined once we know her communication preferences. We should not copy Knut's digest and quiet-hours settings onto her by default.

### 3.3 Amelia Vidvei, daughter, 13

**Context.** Amelia is in class 8A at Ringstabekk skole. She plays handball for Stabekk Jenter 13 and does theater with Theater Ensemblet. She is Hedda's twin. We have no information about her personality, health, preferences or milestones, so this persona is based only on her school, her activities and what is normal at 13.

**Goals (age-appropriate, not personal).**
- Know what is happening today: school, handball, theater.
- Know who is driving or picking her up, and when.
- See when handball and theater fall on the same day.

**Frustrations (likely, not confirmed).** Finding out about a change at the last minute. Two activities on the same day without a clear plan.

**What success looks like.**
- *Hallway iPad:* on her way out, she can see her day and her transport without asking a parent.
- *Her phone:* open question. It depends on whether the kids get their own logins (see section 8).

### 3.4 Hedda Vidvei, daughter, 13

**Context.** Hedda is in class 8B at Ringstabekk skole and plays handball for Stabekk Jenter 13. She is Amelia's twin, but they are in different classes, so their school messages and schedules can differ. We have no other details about her and do not assume any.

**Goals (age-appropriate, not personal).**
- Know today's plan and her transport.
- See what is specific to her class, rather than assuming it matches Amelia's.

**Frustrations (likely, not confirmed).** Being lumped together with her twin when her day is actually different.

**What success looks like.**
- *Hallway iPad:* her own line for today, separate from Amelia's even when they are both at handball.
- *Her phone:* open question, same as Amelia.

### 3.5 Maja Vidvei, daughter, 11

**Context.** Maja is in class 6C at Jar skole, so she has a different school, different messages and possibly a different calendar from her sisters. She does cheerleading with Charmers Delight 26/27. We have no other details about her.

**Goals (age-appropriate, not personal).**
- See today's plan and who picks her up.
- Know when there is a cheerleading practice or event.

**Frustrations (likely, not confirmed).** Pickup plans that are unclear, especially on days when her sisters' handball takes up the parents' driving.

**What success looks like.**
- *Hallway iPad:* she can understand her day at a glance at 11. That means plain wording and very little reading.
- *Her phone:* we do not know if she has one or whether she should have a login. Open question.

### 3.6 The hallway iPad (context persona, not a person)

The hallway iPad is a shared surface that whoever walks past uses, usually in a hurry, often with shoes on. It may not have a personal login, so it shows the household view, not one person's view.

**Its job.** Answer three questions in seconds: what is happening today, who is going where with whom, and is anything due or clashing soon.

**What it must avoid.** Showing private or sensitive information (finances, health, personal notes) to anyone who happens to walk past, including guests. It must also avoid needing taps to show the basics.

**Success.** A family member gets what they need from the screen without stopping, and the parents trust it enough to stop repeating the plan out loud each morning.

---

## 4. Jobs to be done

Format: *When [situation], I want to [motivation], so I can [outcome].* Parents are the primary users. Kids are secondary, and are only included where the job is real for them. The checklist item each job relates to is shown in brackets.

The jobs below are the full set we heard. v1 only builds the five features in section 5. A job that does not fit those five is noted there as not in v1.

### 4.1 Daily

1. **Parent, morning.** When I start the day, I want a short digest of today's plan, transport and anything due, so I can leave the house knowing nothing is about to be missed. *(Weekly plan, Renewals)*
2. **Anyone, hallway.** When I walk past the hallway screen, I want to see today for each family member in a few seconds, so I can act without asking anyone. *(Weekly plan)*
3. **Kid.** When I am heading to school or practice, I want to see who is picking me up and when, so I can be in the right place without texting a parent. *(Weekly plan: who drives)*
4. **Parent.** When a school message or form arrives that needs a reply, I want to capture it with its deadline and which child it is about, so I can answer it in time. *(School messages and forms)*
5. **Parent, kitchen.** When I am deciding what to cook or noticing we are out of something, I want to see tonight's meal and add to the grocery list, so I can shop once and cook without rethinking. *(Grocery list and meal plan)*
6. **Parent, evening.** When it gets to 21:00, I want the app to stay quiet for me, so I can switch off. *(Knut's stated preference. Ulla Marie's to be confirmed.)*

### 4.2 Weekly

7. **Parents, Sunday evening.** When we sit down to plan the week, I want to see every school, activity and work item for all five of us in one place and spot clashes, so I can settle who drives where before Monday. *(Weekly plan)*
8. **Parents.** When two activities overlap (for example handball and cheerleading, or handball and theater), I want the conflict flagged as soon as it appears, so I can sort out transport ahead of time and not on the day. *(Weekly plan: conflicts)*
9. **Parents.** When planning the week, I want to set the meals for the week, taking gluten- and lactose-free needs into account, and turn them into a grocery list, so I can shop once and stop deciding dinner every day. *(Grocery list and meal plan)*
10. **Parent.** When I plan my week, I want to block my training sessions and see them next to family logistics, so I can actually get to three sessions a week. *(Knut's goal, not on the family checklist)*
11. **Family.** When a recurring family moment comes around (Friday might be taco/family night), I want it to show as part of the week, so I can protect it from other plans. *(Placeholder. Only if the family confirms it.)*
12. **Kid.** When the week is planned, I want to see my week on the hallway screen, so I can know which evenings are busy. *(Weekly plan)*

### 4.3 Monthly and longer

13. **Parent.** When a family member's birthday is 14 days away, I want a reminder with time to plan a gift, so I can avoid last-minute shopping. *(Birthday and gift reminders)*
14. **Parent.** When a renewal or deadline is coming up (skattemelding in April, the Tesla's EU-kontroll, insurance, passports), I want to be reminded early enough to act and know who owns it, so I can avoid fees, stress or a passport that has expired before a trip. *(Renewals and deadlines)*
15. **Parents.** When a school holiday is coming up (høstferie, juleferie, vinterferie, påske, following the Bærum kommune calendar), I want to see it well in advance across both schools, so I can plan travel, cabin time and work around it. *(Holiday and travel planning)*
16. **Parents.** When we plan a trip or a stay at the hytte in Flesberg, I want dates, who is coming and what has to be done before we leave in one place, so I can avoid surprises when we get there. *(Holiday and travel planning)*
17. **Parents.** When a family tradition is coming up (17. mai, Christmas, summer at the hytte), I want it to appear early with whatever preparation it needs, so I can plan it calmly. *(Placeholder traditions)*

### 4.4 Jobs we are not taking on in v1

- **Reading school messages automatically.** In v1, forms and messages are entered or forwarded by a parent. We do not connect directly to school platforms.
- **Finances, budgeting and payments.** Knut owns the finances, but tracking money is a separate, sensitive area, and it does not belong on a shared wall screen.
- **Health records, sizes, milestones.** We do not have the data, and it is sensitive.
- **Chore assignment and rewards.** We do not know how chores are split today. See open questions.
- **Home maintenance projects and build tracking.** Recurring maintenance deadlines can live under renewals. Project management does not.
- **Full trip planning (bookings, packing lists, itineraries).** v1 covers dates, holidays and who is going. Nothing more.
- **Messaging or chat between family members.** The family already has ways to talk to each other.

---

## 5. Scope

v1 is five features. The hallway iPad opens on the daily summary. The other four are one tap away, and they work the same on the kitchen iPad, a phone and a desktop. Nothing else ships in the first version.

### 5.1 Daily summary (main page)

The first screen. It shows today, not the week.

- Today's weather for Stabekk (home), so a glance answers whether anyone needs a jacket or whether practice is likely to move.
- Today's activities, per person, taken from the Team Vidvei calendar. School, handball, theater, cheerleading, work and family events that fall today.
- Things to remember, per person. Short notes for today only, not a task system. Examples Knut gave: remember the gym bag, practice after school, a sleepover, homework. Each note belongs to one person and disappears or is cleared after the day.

The page is readable from a step away, with no login, and it shows no sensitive data.

### 5.2 Calendar

One calendar, synced from the Google Calendar named **Team Vidvei** (the family's calendar, Europe/Oslo). The app does not keep a second calendar. Creating, editing or moving an event in the app changes Team Vidvei, and changes made in Google Calendar show up in the app.

The calendar is the source for "today's activities" on the main page and for the weekly dinner planner's sense of which evenings are busy. v1 shows the shared family calendar. It does not merge Knut's work calendar or club feeds.

### 5.3 Todos

One row per family member: Knut, Ulla Marie, Amelia, Hedda and Maja. Each todo has a title, a description and a due date. Nothing else is required in v1 (no priority, assignee-beyond-the-row, or subtasks).

A todo is different from a "thing to remember" on the main page. A remember-note is for today and is ephemeral. A todo has a due date and stays until it is done.

### 5.4 Shopping list

One shared list for the household. Add an item, check it off, clear what is done. It is meant to be used from the kitchen iPad and from a phone in a shop. It is not split per person in v1, and it is not generated automatically from the dinner planner yet. That link can come later.

### 5.5 Weekly dinner planner

A week view of dinners, one meal per day. It has to respect Knut's gluten and lactose intolerance. Other dietary needs are an open question. Planning the week of dinners is a parent job. The hallway and kitchen screens can show tonight's dinner as part of today.

### 5.6 Sign-in

The app is on the web, so it requires a login. Sign-in is Google, not a separate username and password. A parent signs in with their Google account. That is the same Google account world as the Team Vidvei calendar, so calendar access and login are one identity.

On the hallway iPad and the kitchen iPad, the app stays signed in. Nobody should have to type a password while walking out the door. The shared screen still shows the household view and still hides sensitive data. Signing out is a deliberate action, not the default.

Parent phones use the same Google sign-in. There is no kid login in v1.

### 5.7 Explicitly not in v1



These were in the first draft and are parked until the five features are in daily use:

- Morning digest and quiet hours on parent phones.
- Conflict flags and a dedicated Sunday planning flow, beyond what the calendar and dinner planner already show.
- Renewal tracking (skattemelding, EU-kontroll, insurance, passports) and birthday reminders. A birthday or a deadline can be a calendar event or a todo if someone enters it.
- School forms as their own object. A form that needs a reply can be a todo.
- Kid logins.
- Automatic reading of school messages, calendar feeds from clubs, chores, finances, health records, trip planning and traditions.

## 6. Context of use

| Surface | Who | How it is used | Key requirements |
|---|---|---|---|
| **Hallway iPad** | Whoever walks past | Glanced at, mostly on the way out. Probably always on and mounted. | Readable from a step away. Basics visible without touching it. Stays signed in with Google. No sensitive information. Stays current without anyone refreshing it. |
| **Kitchen iPad (probable)** | Parents, kids | Meal plan, grocery list, quick look at today | Fast adding to the grocery list. Same household view as the hallway. |
| **Parent phones** | Knut, Ulla Marie | Morning digest, quick capture, checking on the go | Short summaries. Quiet hours per person. Fast entry of a task, form or deadline. |
| **Desktop** | Parents | Sunday planning, setting up renewals and recurring items | Comfortable for longer sessions and bulk entry. |
| **Kid phones** | Amelia, Hedda, Maja | Unknown | No kid login in v1. They use the shared iPads. |

**Constraints that apply everywhere:**
- Responsive across phone, tablet and desktop. The tablet in landscape or portrait on a wall is the main case.
- 24-hour clock (for example 17:30).
- Dates as DD.MM.YYYY (for example 03.10.2026).
- Time zone Europe/Oslo, including daylight saving changes.
- Norwegian UI language.
- Norwegian calendar context: school holidays from Bærum kommune, and national days such as 17. mai.

---

## 7. Success

We will know v1 works if, after four to six weeks of use:

- The Sunday weekly plan happens most weeks and takes noticeably less time than it does today.
- The hallway iPad is the first place family members look for today's plan, and the parents are asked "who's picking me up?" less often.
- No school form or reply deadline is missed because nobody knew about it.
- Transport clashes are found during the week before, not on the day.
- Every renewal on the list (skattemelding, EU-kontroll, insurance, passports) is handled before its deadline, and each one has a named owner.
- Birthday gifts are sorted before the last few days.
- Knut gets no app messages after 21:00, and the morning digest is something he reads rather than ignores.
- The parents keep the data up to date without it feeling like a second job. If entering data is a chore, nothing else here will work.

---

## 8. Open questions

These are the questions whose answers would change the PRD.

1. **Ulla Marie's role and work.** Her work pattern, how she wants to receive information, any quiet hours, and which household areas she owns. Without this, half the primary users are designed around guesses.
2. **Chore split.** How are household tasks shared today, and should the app track them at all? This decides whether chores belong in v1 or later.
3. **Who drives.** Is there a usual pattern for which parent covers which activities or days, or is it decided week by week? Do other families in the clubs share driving?
4. **Dietary needs beyond Knut's.** Does anyone else have allergies, intolerances or strong preferences? This affects meal planning and the grocery list.
5. **Kids' logins.** Should Amelia, Hedda and Maja have their own logins and phone views, or only use the shared iPads? Is the answer different for Maja at 11 than for the twins at 13?
6. **Household only, or a product?** Is this only for the Vidvei household, or meant to become a product for other families? This changes onboarding, accounts, privacy, data integrations and how much has to be configurable.
7. **What the hallway screen may show.** Is it fine for guests to see the kids' schedules and the family's whereabouts, or should some items be hidden on the shared screens?
8. **Recurring schedule.** The weekly timetable for school, handball, theater and cheerleading has not been provided. Who will enter it, and are there club or school calendar feeds we can use?

---

## 9. Assumptions

These are assumptions made to write this draft. Please correct any that are wrong.

1. Sign-in is Google (a Google account, not an app-specific username and password). The hallway and kitchen iPads stay signed in and show the household view. Sensitive data (finances, health) never appears on them.
2. A second iPad in the kitchen will exist and use the same household view, with meal plan and grocery list easy to reach.
3. Parents enter and maintain the data. Kids only read it in v1.
4. Knut's preferences (morning digest, short bullets, no messages after 21:00) are his settings, not household defaults for Ulla Marie.
5. Sunday evening is the weekly planning moment, and Friday is taco/family night. Both are listed as "might be", so they are treated as configurable, not fixed.
6. School holidays for both Ringstabekk skole and Jar skole follow the Bærum kommune school calendar.
7. The 2018 Tesla Model X is the only car to track for EU-kontroll and insurance.
8. "Two schools" means Ringstabekk skole for the twins and Jar skole for Maja, each with its own messages and forms.
9. School messages and forms are not a feature in v1. If one matters, a parent enters it as a todo or a remember-note.
12. The calendar in the app is a sync of the existing Google Calendar "Team Vidvei" (id a2l1soplp0mmktbtctpsb3o5mc@group.calendar.google.com, time zone Europe/Oslo, description "Familiens kalender"). Confirmed accessible on 03.10.2026. The app does not create a parallel calendar.
13. Weather on the main page is the forecast for home, Stabekk (Åsveien 34D).
14. "Things to remember" are per person and for today. Todos are the durable list, one row per person, with title, description and due date.
15. The shopping list is one shared household list and is not auto-filled from the dinner planner in v1.
10. Birthday reminders cover the five family members first. Birthdays of relatives and friends can be added by parents, but no list of them has been provided.
11. The cabin at Tjennputtvegen 20, 3620 Flesberg appears in v1 only as a place for calendar events and holidays, not as something with its own maintenance or booking features.
