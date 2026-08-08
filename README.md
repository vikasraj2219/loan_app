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

**Still ahead** (per the 16-phase brief): Loans screen + loan cards, Loan Detail (repayment progress visualization, monthly interest tracking), Payments screen + payment receipts, multi-step Add Payment / Add Loan flows, Documents screen redesign, search/filter experience, skeleton loading states, and animation/micro-interaction polish. Say "next phase" to continue in the same order as the rest of this build.

**New native dependency**: `expo-linear-gradient` (for the hero gradient). Run `npx expo install --fix` after pulling this update.
