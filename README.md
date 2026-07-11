# Yogapratishthan — Iyengar Yoga Center Management System

An internal admin tool that replaces the paper admission register and attendance
book for a single-instructor yoga studio. Students never see this app — it's
built for one person: the instructor, running the whole center from a phone
or tablet between classes.

**Live:** https://yogapratishthan.vercel.app
**Repo:** https://github.com/krishna2700/yogapratishthan

---

## Table of contents

- [What this actually does](#what-this-actually-does)
- [Architecture](#architecture)
- [The Session Engine](#the-session-engine-the-part-that-matters)
- [Data model](#data-model)
- [Project structure](#project-structure)
- [Local development](#local-development)
- [Deployment](#deployment)
- [Desktop and mobile apps](#desktop-and-mobile-apps)
- [Use cases — how the instructor actually uses this](#use-cases--how-the-instructor-actually-uses-this)
- [Known limitations / deliberate simplifications](#known-limitations--deliberate-simplifications)

---

## What this actually does

Every class an instructor teaches, every student's attendance, every make-up
class, every holiday closure, every renewal — all of it used to live in a
physical register. This app digitizes that whole workflow:

- **Admission** — enter a new student's details once; the app generates their
  entire session schedule automatically (e.g. "12 sessions, Mon & Thu" becomes
  12 actual calendar dates).
- **Attendance** — a classroom view showing only today's students, one tap to
  mark present/absent.
- **Make-ups** — add a make-up class for a missed session; it auto-expires
  after 2 months if unused.
- **Vacations** — declare a center closure (Diwali, maintenance, etc.) and
  every affected session automatically reschedules to the next valid class —
  no student loses a session, and no manual per-student work.
- **Reminders & notifications** — low sessions, expired memberships, expiring
  make-ups, birthdays, and consecutive absences surface automatically, with a
  one-tap WhatsApp reminder you can send straight from the app.
- **Renewals** — extend a student's schedule with another batch of sessions
  that continues seamlessly from where they left off.

## Architecture

**Monorepo** (pnpm workspaces):

```
yogapratishthan/
├── apps/web/          Next.js 15 app — the entire product (UI + API routes)
└── packages/db/       Prisma schema, generated client, seed script
```

**Why a separate `db` package** rather than Prisma living inside `apps/web`:
database access is isolated behind one boundary (`@yogapratishthan/db`), so
nothing outside `packages/db` ever imports `@prisma/client` directly. Every
feature reaches the database exclusively through a `services/*.ts` file.

**Tech stack:**

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript (strict) |
| Styling | Tailwind CSS v4, shadcn/ui (Base UI primitives) |
| Forms | React Hook Form + Zod (one schema, shared by client and API) |
| Database | PostgreSQL (Neon in production) |
| ORM | Prisma 6 |
| File storage | Vercel Blob (production) / local disk (dev) |
| Hosting | Vercel |
| Notifications | Sonner (toasts) + an in-app event log (see below) |

**Layering, strictly enforced throughout:**

```
UI component  →  API route (thin)  →  service (business logic)  →  Prisma
```

API routes never contain business logic — they parse/validate the request
with Zod and call a service function. Services never touch `req`/`res` — they
take plain arguments and return plain data, so they're callable from any
route, from each other, or from a script.

## The Session Engine — the part that matters

The single most important architectural decision in this app: **a student's
sessions are never a number you decrement.**

The obvious-but-wrong design is a `remainingSessions` counter on the student
that goes down by one every time they attend. It seems simpler, right up
until you need to handle a missed class, a center holiday, or a renewal — at
which point you're patching counter arithmetic in five different places and
the number silently drifts out of sync with reality.

Instead, purchasing sessions **generates actual `Session` rows up front** —
one per class, each with a real calendar date. Every subsequent event
mutates that table instead of a summary number:

- **Attendance** marks a `Session` `PRESENT` or `ABSENT`.
- **A make-up** creates a *new* `Session` row linked back to the absence it
  replaces (`originalSessionId`), with a 2-month expiry.
- **A vacation** marks every affected `Session` `VACATION` and generates a
  replacement row on the next valid class date — the same linking mechanism
  a make-up uses, because they're the same concept: *"this session replaces
  that one."*
- **A renewal** generates another batch of `Session` rows continuing
  straight on from the student's last one.

Because everything is one source of truth, "how many sessions does this
student have left" is always a live query, never a cached value that can
drift:

```
purchased  = numberOfSessions (admission) + Σ renewals.numberOfSessions
completed  = count(status = PRESENT)
lost       = count(status = EXPIRED)      — make-ups that expired unused
remaining  = max(0, purchased − completed − lost)
```

This is also why deleting or editing a vacation is safe: reverting means
walking the same `originalSessionId` links backward, deleting the
replacement session and restoring the original — but *only* if that
replacement hasn't been attended yet. If it has, the real attendance record
is left alone rather than rewriting history. (See
`packages/db/prisma/schema.prisma` for the full `Session` model and
`apps/web/src/features/session-engine/` for the engine itself.)

**Timezone correctness.** Postgres `@db.Date` columns store pure calendar
dates as UTC midnight; naive local-time date arithmetic (`date-fns`'s
`addDays`/`startOfDay`) silently shifts dates by a day on any server not
running in UTC. Every place that touches a `scheduledDate` or vacation range
goes through `apps/web/src/lib/calendar-date.ts`, which does all date math in
UTC explicitly. This bit us once during development (Monday classes were
landing on Sunday) — see git history if you're curious.

## Data model

```
Batch           A recurring class slot (weekdays, start/end time). Seeded once.
Student         Personal + admission info. joiningDate anchors the schedule start.
Session         The source of truth — see above.
Renewal         A subsequent purchase of sessions.
Vacation        A center-wide closure (start date, end date, reason).
Note            Freeform notes on a student (health, scheduling, payment, etc.)
Event           Append-only activity log — powers both the student Timeline
                and the notification bell. Every notable action writes one.
```

The `Event` model is deliberately the single hook point for anything
event-driven: notifications, the student timeline, and — when it's wired up —
outbound WhatsApp/email triggers all read from (or write to) this one table
instead of each inventing their own mechanism.

Full schema: `packages/db/prisma/schema.prisma`.

## Project structure

```
apps/web/src/
├── app/                        Next.js App Router
│   ├── (pages)                 /, /students, /students/[id], /students/[id]/edit,
│   │                           /students/new, /attendance, /vacations, /reminders
│   └── api/                    Thin route handlers — one per feature, see below
├── features/                   Feature-based modules — the bulk of the app
│   ├── student-admission/      Admission form, its Zod schema, photo upload
│   ├── student-directory/      Card grid, student detail page, edit, delete
│   ├── session-engine/         Schedule generation, attendance, make-ups,
│   │                           vacations, renewals — the core described above
│   ├── attendance/             Today's classroom view
│   ├── vacations/              Vacation CRUD UI
│   ├── notes/                  Per-student notes
│   ├── notifications/          Event log, notification bell, timeline
│   ├── reminders/              Computed (not stored) live reminders
│   ├── whatsapp/               Compose-and-send-via-wa.me dialog
│   └── dashboard/               Operational overview widgets
├── components/
│   ├── ui/                     shadcn/ui primitives (generated, not hand-rolled)
│   ├── form/                   Shared form field wrapper
│   └── layout/                 App shell, sidebar nav
└── lib/                        Cross-cutting utilities (calendar-date, weekday
                                 formatting, API response helpers)

packages/db/
├── prisma/schema.prisma        The whole data model
├── prisma/seed.ts              Seeds the 4 batches
└── src/index.ts                Prisma client singleton + re-exports

apps/desktop/                   Electron wrapper → macOS .dmg (see below)
apps/mobile/                    Capacitor wrapper → Android .apk (see below)
assets/icon/                    Source app icon (icon.svg) + generated .icns
                                 and Android mipmap sets used by both wrappers
```

Every feature folder follows the same internal shape: `components/`,
`services/` (server-only, Prisma access lives here and nowhere else),
`hooks/` (client-side data fetching), and a `schema.ts` (Zod, shared by the
client form and the API route that consumes it).

## Local development

**Prerequisites:** Node 20+, pnpm, a local PostgreSQL instance (or point
`DATABASE_URL` at Neon).

```bash
git clone https://github.com/krishna2700/yogapratishthan.git
cd yogapratishthan
pnpm install                 # also runs `prisma generate` via postinstall
```

Set `DATABASE_URL` in **both**:
- `packages/db/.env` (used by the Prisma CLI)
- `apps/web/.env.local` (used by the running Next.js app — see note below)

```
DATABASE_URL="postgresql://user@localhost:5432/yogapratishthan?schema=public"
```

> **Why both files?** Prisma bakes a relative path to `packages/db/.env` into
> the generated client for CLI use, but the Next.js dev server only loads env
> files from `apps/web/`. Setting it in both avoids ever hitting a live
> database by accident when you only meant to touch local dev — this is why
> local dev and the deployed app use *different* databases (local Postgres
> vs. the deployed Neon instance) unless you deliberately point both at the
> same one.

```bash
pnpm db:push      # sync the schema to your database
pnpm db:seed       # seed the 4 batches (Batch A–D)
pnpm dev           # http://localhost:3000
```

No `BLOB_READ_WRITE_TOKEN` is needed locally — photo uploads fall back to
`apps/web/public/uploads` automatically when that variable isn't set.

**Other useful scripts** (run from the repo root):

```bash
pnpm typecheck     # tsc --noEmit across both packages
pnpm lint          # eslint
pnpm build         # production build (also regenerates the Prisma client)
pnpm db:studio     # Prisma Studio — browse the database visually
```

## Deployment

Deployed on Vercel, database on Neon, photos on Vercel Blob. The only two
environment variables the app needs in production:

| Variable | Purpose | Where it comes from |
|---|---|---|
| `DATABASE_URL` | Postgres connection | Neon dashboard → connection string |
| `BLOB_READ_WRITE_TOKEN` | Photo storage | Auto-injected once a Blob store is linked to the Vercel project |

Nothing else — there's no auth system (single internal user, no accounts) and
the WhatsApp feature uses a zero-credential `wa.me` deep link rather than the
Meta Business API, so it needs no key.

**Monorepo-on-Vercel specifics**, if you're setting this up fresh: the
project's Root Directory must be set to `apps/web`, and
`next.config.ts` uses `@prisma/nextjs-monorepo-workaround-plugin` — without
it, Vercel's build correctly generates the Prisma query engine but the
Next.js bundler's file tracing doesn't discover it (it's loaded via a
dynamically-computed path), so the deployed function crashes with
`PrismaClientInitializationError`. That plugin is the documented fix for
exactly this pnpm-monorepo scenario.

## Desktop and mobile apps

`apps/desktop` (macOS) and `apps/mobile` (Android) are **not** separate
copies of the app — they're thin native shells that open the exact same
production URL (`https://yogapratishthan.vercel.app`) in a native window
instead of a browser tab. There is no bundled web build and no local
database inside either one, so there is nothing to keep in sync: the
desktop app, the Android app, and the web link always show identical data
because they're all hitting the same Neon database through the same API
routes.

| | Desktop | Mobile |
|---|---|---|
| Tooling | [Electron](https://electronjs.org) + electron-builder | [Capacitor](https://capacitorjs.com) |
| Output | `.dmg` (universal — Intel + Apple Silicon) | `.apk` (debug-signed) |
| Points at | `apps/desktop/main.js` → `APP_URL` constant | `apps/mobile/capacitor.config.ts` → `server.url` |
| Icon | `assets/icon/icon.icns` | `assets/icon/android/mipmap-*` |

### Building the macOS app

```bash
cd apps/desktop
pnpm install
pnpm exec electron-builder --mac dmg --universal
# → apps/desktop/dist/Yogapratishthan-1.0.0-universal.dmg
```

The build machine needs Xcode Command Line Tools. `electron-builder` will
auto-sign with any Developer ID certificate it finds in the local keychain;
without one the app is unsigned (Gatekeeper will still allow it via
right-click → Open). It is not notarized — that requires an Apple Developer
account and is a separate, optional step (`electron-builder` supports it
via `afterSign` + Apple ID credentials if you want a plain-double-click
experience with no Gatekeeper prompt at all).

### Building the Android app

Needs a JDK and the Android SDK (`platform-tools`, `platforms;android-34`,
`build-tools;34.0.0`) — install both once via Homebrew + `sdkmanager` if
they're not already on the machine:

```bash
brew install openjdk@17
brew install --cask android-commandlinetools
export JAVA_HOME="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
export ANDROID_HOME="/opt/homebrew/share/android-commandlinetools"
yes | sdkmanager --sdk_root="$ANDROID_HOME" "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

Then:

```bash
cd apps/mobile
pnpm install
pnpm exec cap sync android
cd android && echo "sdk.dir=$ANDROID_HOME" > local.properties
./gradlew assembleDebug
# → apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

This produces a **debug-signed** APK — fine for sideloading directly onto a
device ("install unknown apps" needs to be allowed for whichever app you
use to open it), but not for the Play Store. For that, add a real release
signing config and run `assembleRelease` instead.

> **Installing the APK on a phone:** if the device says something like "you
> may not have an app to open this," it's almost always how the file was
> transferred, not the APK itself — some share sheets (WhatsApp, some cloud
> drive apps) mangle the `.apk` association or don't grant install
> permission to the app you opened it with. The most reliable path is
> `adb install app-debug.apk` over USB, or downloading it directly from a
> plain link in the phone's browser and opening it from the Downloads app.

### Both wrappers share one icon

`assets/icon/icon.svg` is the single source of truth. It's rendered to
every required size with `rsvg-convert`, then packed into `icon.icns`
(via macOS's `iconutil`) for desktop and into `mipmap-*dpi` PNGs for
Android — regenerate both from the SVG if the icon ever changes, rather
than hand-editing the generated files.

## Use cases — how the instructor actually uses this

**Admitting a new student** (`/students/new`): fill in personal info, health
history, payment + number of sessions, pick a batch. Photo is optional. On
save, the app generates every session date up front from the joining date —
"Save & Add Another" clears the form and refocuses the first field so the
next admission starts immediately, no navigation required.

**Taking attendance** (`/attendance`): shows only today's batch(es) — if two
batches meet today at different times, a switcher lets the instructor pick
which one they're currently teaching. Large tap targets, present/absent in
one tap, saves instantly.

**A student misses class**: mark them absent (with an optional reason).
From their profile, "Add Make-up" schedules a replacement class — reason is
optional, date/batch/time are picked explicitly. It auto-expires after 2
months if never attended.

**Declaring a holiday** (`/vacations`): pick a date range and reason. Every
session that falls in that range is automatically moved to the student's
next valid class day — this happens for every affected student across the
whole center in one action. Editing or deleting a vacation later correctly
un-does the reschedule wherever it's still safe to (i.e. the replacement
session hasn't been attended yet).

**A student is running low on sessions**: the moment their remaining count
crosses 3, 2, or 1, a notification appears in the bell automatically — no
one has to remember to check. From there, or from the Reminders page, "Send
WhatsApp" opens a pre-filled, editable message to that student's WhatsApp
number.

**Renewing**: from a student's profile, "Renew" adds another batch of
sessions that continues their schedule from their last currently-scheduled
class — not from today, so an early renewal doesn't create a scheduling gap.

## Known limitations / deliberate simplifications

- **WhatsApp is deep-link, not API.** Sending opens WhatsApp with the message
  pre-filled; the instructor still taps send inside WhatsApp. Fully silent
  background sending needs Meta's WhatsApp Business API — a separate business
  account, phone verification, and template approval process, deliberately
  out of scope until it's actually needed.
- **Vacation revert is best-effort.** If a session's replacement has already
  been attended, deleting or editing the vacation leaves it as-is rather than
  rewriting attendance history. This is the correct trade-off, not a bug.
- **No auth.** This is a single-instructor internal tool; there's no login
  system. If multiple staff ever need separate accounts, that's a real
  addition, not a toggle.
- **Reminders are computed, not stored.** The Reminders page always reflects
  live state (no stale cached reminder rows to clean up), but that means it
  recomputes from scratch on every load rather than being instant. Fine at
  the scale of one studio; would need indexing work at much larger scale.
