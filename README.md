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
eas build:configure
```

This generates an `eas.json`. Then run a **preview** build (produces an installable `.apk` rather than the Play-Store-only `.aab`):

```bash
eas build --platform android --profile preview
```

If `eas.json` doesn't already have a `preview` profile with `"buildType": "apk"`, add this:

```json
{
  "build": {
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" }
    }
  }
}
```

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
| 4 | Next | Payments |
| 5 |  | Documents |
| 6 |  | Reports & Analytics |
| 7 |  | Polish + final APK build |
