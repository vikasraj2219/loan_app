# Loan Manager (Mobile)

React Native / Expo companion app for the Loan & Interest Management System.
Talks to your existing backend at:

```
https://loan-management-backend-adb5.onrender.com/api/v1
```

## Phase 1 includes

- Project scaffold (Expo + React Native Paper + React Navigation)
- Secure token storage (`expo-secure-store`)
- API client with automatic 401 → refresh-token → retry, same logic as the web app
- Login, Register
- Bottom-tab shell: Dashboard, Borrowers, Loans, Payments, More (profile + logout)

## Phase 2 (this drop) adds

- **Dashboard**: live summary stat cards (active loans, borrowers, outstanding principal, overdue, today's/monthly collection, pending/overdue interest), loan status distribution, overdue loans list, recent payments, top borrowers — pull-to-refresh, tap-through to a borrower
- **Borrowers**: searchable/filterable list (active/inactive/all) with pagination, pending-interest badges, add/edit form matching every field your backend accepts, full details screen (contact info, interest summary, guarantor, linked loans), deactivate (admin only)

Loans, Payments, Documents, Reports/Analytics are still placeholders — see each screen for its phase label.

## Phase 3 (this drop) adds

- **Loans**: list with status filter (Active/Overdue/Closed/All) and pagination; create a loan (pick an active borrower, amount, monthly rate, dates); details screen (principal outstanding, this month's interest, pending/total outstanding, payment history); Close Loan (once principal is fully repaid) and Mark Overdue (admin) actions; edit (rate/tenure/due date/notes — matches your backend's rule that principal only changes via payments); full month-by-month interest schedule
- Borrower Details now deep-links into real loan details, and has a **+** to start a new loan for that borrower

## Phase 4 (this drop) adds

- **Payments**: list of recent payments with mode filter (Cash/UPI/Bank/All); record a payment by picking a borrower → an open loan (only shows loans that can still accept a payment) → amount(s) + mode + reference/remarks; attach a receipt photo (camera or gallery) at recording time or afterwards
- Payment details: full breakdown, receipt preview with "open full size", admin-only **Edit** (re-runs the same FIFO interest allocation your backend uses) and **Delete** (reverses the loan/interest effects, with a confirmation dialog since it's irreversible)
- Loan Details now has a **Record Payment** shortcut that jumps straight into the payment form for that loan

**New native dependency**: `expo-image-picker` (for the receipt camera/gallery picker) — this is the one addition since Phase 1. Run `npx expo install --fix` again after pulling this update, since a new native module needs to be linked. If you hit another Gradle error, run `npx expo-doctor` first and share the output.

## Phase 5 (this drop) adds

- **Documents**, reached via **More → Documents** (kept off the bottom tab bar to avoid crowding it): global searchable list with Active/Archived/All filter, upload flow (pick Borrower or Loan → category from your backend's suggested list → optional name/description → photo), details view with image preview / "Open" for other file types, Archive/Restore, and admin-only permanent delete
- Borrower Details and Loan Details now have a **Documents** shortcut that jumps straight into an upload pre-scoped to that borrower/loan
- **Scope note:** mobile document uploads are photos only (camera/gallery) — no PDF picker was added, to avoid another native dependency. Use the web dashboard for PDF uploads. Bulk multi-select actions (available on web) were also left out of this phase to keep the mobile flow simple — single-document actions cover the common case.

## Phase 6 (this drop, final phase) adds

- **Reports & Analytics**, under **More → Reports & Analytics**: Collection Report (date range, summary cards, payment list, export to CSV/Excel/PDF), Pending Interest (by-borrower breakdown, CSV export), Overdue Interest (days-overdue list), and Interest Collection History (generated vs. collected, 3/6/12-month toggle)
- Exports save to the device and open the native share sheet (AirDrop, email, "Save to Files", WhatsApp, etc.) rather than downloading silently — this is the standard mobile pattern for a file coming from an API

**New native dependencies**: `expo-file-system` and `expo-sharing` (both needed to save an exported report to disk and hand it to the share sheet). Run `npx expo install --fix` again after pulling this update.

This completes all 6 feature phases.

## Phase 7 (this drop, final) — polish

- Real app icon, Android adaptive icon, and splash screen (simple navy/green "LM" monogram) — no more default Expo icon
- `eas.json` is now included with a `preview` profile pre-configured for `"buildType": "apk"`, so `eas build:configure` isn't needed — go straight to the build command below
- Full pass through every screen/navigator for stray imports, missing exports, and structural issues — everything checked out clean

## 1. Install dependencies

You'll need [Node.js](https://nodejs.org) (18+) and the Expo CLI (no global install needed — `npx` handles it).

```bash
cd LoanManagementApp
npm install
```

Since I couldn't run `npm install` myself in this environment, versions may need a quick auto-fix the first time:

```bash
npx expo install --fix
```

This snaps every package to the version your installed Expo SDK expects.

## 2. Run it in Expo Go (fastest way to test on your phone)

```bash
npx expo start
```

This prints a QR code in the terminal.

1. Install **Expo Go** from the Play Store (or App Store) on your phone.
2. Scan the QR code (Android: use the Expo Go app's scanner; iOS: use the Camera app).
3. The app loads on your phone, connected live to your Render backend.

Since you're already logged into Expo Go, this is the quickest way to try each phase as it's built — no rebuild needed, just reload.

> **Render cold start:** the very first request after the backend has been idle can take 30-60 seconds. That's the Render free tier waking up, not a bug — subsequent requests are fast.

## 3. Building a real APK (installable outside Expo Go)

Expo Go is great for development, but to get an `.apk` you can install like a normal Android app, use **EAS Build** (Expo's free-tier cloud build service — no Android Studio needed).

```bash
npm install -g eas-cli
eas login
```

`eas.json` is already set up in this project with a `preview` profile that produces an installable `.apk` (rather than the Play-Store-only `.aab`), so you can skip `eas build:configure` and go straight to:

```bash
eas build --platform android --profile preview
```

Since three native modules (`expo-image-picker`, `expo-file-system`, `expo-sharing`) have been added since Phase 1, run this first if you haven't recently:

```bash
npx expo install --fix
npx expo-doctor
```

Fix anything `expo-doctor` flags before building — it's much faster to catch a version mismatch locally than after a 10+ minute cloud build fails.

The build runs on Expo's servers (free tier: a limited number of builds/month). When it finishes, EAS gives you a download link — open it on your Android phone (or download and transfer the `.apk`) and install it directly (you'll need to allow "install from unknown sources" once).

## Fix — Branding, Delete Loan, Button Visibility

**Logo & branding.** App icon, Android adaptive icon, splash screen, and web favicon are now generated from your uploaded Waghmare Vikas logo (the circular monogram, cropped from the full lockup). App name changed from "Loan Manager" to "Waghmare Vikas" throughout — splash screen, login screen, `app.json`.

**Delete Loan — real backend change, needs your action.** Your backend had no delete endpoint for loans at all (by design — it uses `close` to preserve the audit trail). Since you confirmed you want a genuine permanent-delete feature, I added:

- `DELETE /api/v1/loans/:id` (admin-only) — cascades to permanently delete every `Payment` and `MonthlyInterest` record for that loan, and every loan-scoped `Document` (including its Cloudinary file), then the loan itself. Logged to your activity log as `loan.delete.permanent`.
- Mobile: **Delete Loan** in the Loan Detail menu (admin-only), behind a "type DELETE to confirm" dialog that also tells you exactly how many payments will go with it.

**This backend change is not live yet.** I can only edit your backend's source code here, not deploy it — you'll need to apply the two changed files (`src/controllers/loanController.js`, `src/routes/loanRoutes.js`, provided as a separate download) to your backend repo and redeploy to Render yourself. Until you do, tapping "Delete Loan" in the app will fail with a 404, since the endpoint won't exist on the live server yet.

**Button visibility audit.** Found a real bug: every `FAB` (the floating "+" button on Borrowers/Loans/Payments/Documents) was rendering its label using React Native Paper's default `onPrimaryContainer` color, which I'd never overridden in the theme — so it was falling back to Paper's stock near-black color on our dark indigo button, making the label hard to read. Fixed by setting an explicit white color on all 4 FABs, and added the missing `onPrimaryContainer`/`onSecondaryContainer`/`onTertiaryContainer`/`onErrorContainer` theme tokens so no other Paper component (segmented buttons, tonal buttons, etc.) can fall back to an off-brand color like that again.

## Project structure

```
src/
  api/          - axios client + per-module API calls
  context/      - AuthContext (session state)
  navigation/   - Root/Auth/App navigators
  screens/      - one folder per module (auth, dashboard, borrowers, loans, payments, ...)
  theme/        - React Native Paper theme
  utils/        - secureStorage, helpers
  config.js     - API base URL
```

## Roadmap

| Phase | Status | Scope |
|---|---|---|
| 1 | ✅ Done | Setup, auth, navigation shell |
| 2 | ✅ Done | Dashboard + Borrowers |
| 3 | ✅ Done | Loans |
| 4 | ✅ Done | Payments |
| 5 | ✅ Done | Documents |
| 6 | ✅ Done | Reports & Analytics |
| 7 | ✅ Done | Polish + final APK build |

## UI/UX Redesign — Round 2

A full visual redesign is now underway, separate from the feature roadmap above. New foundation in place:

- **`src/theme/tokens.js`** — the new design system: colors (deep midnight indigo brand, royal indigo accent, teal/amber/coral status palette), typography scale, spacing scale, radius scale, shadow presets. This is the single source of truth going forward — new components read from here, not hardcoded hex values.
- **New premium components**: `MetricCard` (redesigned KPI card), `PortfolioHero` (gradient hero summary), `AttentionCenter` (collection-priority list), `QuickActions`, and a fully rebuilt `StatusChip` (now an icon+label badge, not just a colored chip — same import path, so every existing screen using it picked up the new look automatically).
- **New floating pill navigation** (`FloatingTabBar`) — replaces the standard Material bottom tabs with an animated floating indigo bar, active-tab pill indicator, and midnight color. It auto-hides once you drill into a detail/form screen so it never covers content, and reappears at each tab's root.
- **Dashboard fully rebuilt** using all of the above: time-based greeting, gradient portfolio hero, attention-required section, quick actions, and a KPI grid — matching the design brief.
- Every screen's headers and accent colors were migrated to the new palette in one pass (old navy `#1E3A5F` → indigo/midnight, old green/amber/red → new teal/amber/coral), so the whole app is visually consistent with the new direction even before each screen gets its own structural redesign.

- **Borrowers rebuilt**: new `BorrowerCard` (avatar, status badge, pending-interest highlight pill) and pill-style filter chips replacing the segmented control.
- **Borrower Profile rebuilt**: header card with avatar/status, a 5-action quick-action row (Call, Message, Add Loan, Record Payment, Documents), and a real tabbed interface — **Overview** (loan counts, total borrowed/outstanding, pending interest, additional details), **Loans**, **Payments** (fetched live, not fabricated), and **Documents** (fetched live, filtered to this borrower) — all backed by your existing endpoints (`borrower`/`loan` filter params on payments and documents), no backend changes needed.
- **Loans rebuilt**: new `LoanCard` (original amount vs. outstanding side-by-side, interest-rate pill, pending-interest pill), pill filters, and a real sort menu (Newest/Oldest, Highest/Lowest Outstanding, Highest Interest, Most Overdue) — all backed by your existing generic `sort` query param, no backend changes.
- **Loan Detail rebuilt** — the screen your brief called out as needing the most attention: a `RepaymentProgress` bar (% repaid, computed from `loanAmount`/`principalOutstanding`), a clean info grid, and a `RepaymentTimeline` — a vertical timeline from "Loan Issued" through every payment down to "Remaining", matching your brief's spec exactly.
- **Interest Schedule rebuilt**: each month is now its own card with a tinted month badge, status badge, principal/rate at time of charge, and due/paid dates — the "monthly interest tracking" section from your brief.

- **Payments rebuilt**: `PaymentCard` list rows, a collections summary card (Total/Principal/Interest/Count) with time-range pill filters, and a genuine **4-step Add Payment wizard** — Amount → Allocate (with a smart auto-split against pending interest first, live "unallocated/over-allocated" balance check) → Method (+ receipt photo) → Review — plus a **receipt-style Payment Detail** screen: dashed-divider layout, big success badge, Share Receipt (native share sheet with a formatted text receipt).
- The **Add Loan flow** is a matching 3-step wizard: Select Borrower → Loan Details → Review, with a full summary before submit.
- Swept the remaining borrower/loan picker screens (`SelectBorrowerScreen`, `SelectBorrowerForPaymentScreen`, `SelectLoanForPaymentScreen`) and `PaymentEditScreen`/`BorrowerFormScreen` onto the new design tokens for full visual consistency — every borrower/loan picker in the app now renders the same premium `BorrowerCard`/`LoanCard`.

**Still ahead** (per the 16-phase brief): Documents screen redesign, global search experience, skeleton loading states, and animation/micro-interaction polish. Reports & Analytics (added after your original brief) could also get the same treatment if you'd like. Say "next phase" to continue.

## Fixes — Payment Records, Dashboard Notch, Navigation

**Payment Records on Loan Detail.** The repayment timeline now has full record management, matching the Interest Records pattern:
- Tap any payment to open its full detail (receipt, share, everything already built in Payments)
- Admin-only inline **pencil/trash** icons directly on each timeline entry — edit or delete without leaving the loan
- A **"Record Payment"** shortcut in the section header, same pattern as "Add Record" on Interest Schedule

**Dashboard content merging into the notch.** The Dashboard tab has no native header (by design, for the custom hero), so it wasn't accounting for the status bar / notch / Dynamic Island area — the greeting text was rendering underneath it. Fixed by adding proper top safe-area padding.

**Navigation trap (the real "not working properly" bug).** The floating tab bar was set to auto-hide once you opened any detail or form screen — meant to avoid covering content, but it meant that once you drilled into e.g. a Loan Detail page, **the tab bar disappeared and there was no way to jump to another tab** except backing out screen-by-screen first. That's fixed:
- The tab bar is now **always visible**, on every screen
- Every screen's bottom padding was increased so the bar never covers content or buttons
- Tapping the **already-active tab's icon now pops that tab's stack back to its list/root screen** — the standard behavior you'd expect (e.g., deep inside Loan Detail, tapping the Loans icon takes you straight back to the Loans list, not just "do nothing since already on Loans")

## Fix — Manual Interest Generation & Record Management

The web app's Interest Summary screen has an "Add Record" button and a Pending Interest Table with edit/delete on each row — this existed on your backend (`POST /interest/generate`, and full CRUD at `/interest-records`) but was never wired into the mobile app. Fixed on the Loan Detail → Interest Schedule screen (admin-only, matching your backend's `authorize('admin')` on these routes):

- **"Generate Missing Interest Records"** button — backfills every month owed for that loan up to today in one tap (e.g., a loan created Jan 10 2026 with no interest generated yet). Safe to tap repeatedly — the backend skips months that already exist rather than duplicating them, and shows you a summary (created / skipped / failed) afterward.
- **Add Record** — manually add a specific month's interest record (for historical/migration entries). Amount, principal, and rate can be left blank to auto-calculate from the loan, exactly like the backend does.
- **Edit / Delete** on each month row, matching the web app's pending interest table exactly.

**New native dependency**: `expo-linear-gradient` (for the hero gradient). Run `npx expo install --fix` after pulling this update.
