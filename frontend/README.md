# Frontend

This folder contains the Expo / React Native frontend for the Environmental Agent app.

## Prerequisites

- Node.js 18+ installed
- npm available
- Expo CLI installed globally if you want to run the app locally with the Expo developer tools:
  ```bash
  npm install --global expo-cli
  ```

## Install dependencies

From the `frontend` folder:

```bash
npm install
```

## Run locally

Start the Expo development server:

```bash
npm start
```

This opens the Expo dev tools where you can run on:

- Android emulator or device
- iOS simulator or device
- Web browser

## Run on web only

```bash
npm run web
```

## Build for web

```bash
npm run build
```

## Lint

```bash
npm run lint
```

## Helpful scripts

- `npm start` — start Expo dev server
- `npm run android` — run on Android device/emulator
- `npm run ios` — run on iOS simulator/device
- `npm run web` — run the web version
- `npm run build` — export web build for deployment
- `npm run lint` — run ESLint
- `npm run reset-project` — reset local project configuration

## Environment variables

The frontend reads these environment variables from Expo:

- `EXPO_PUBLIC_API_URL` — backend API base URL
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key

Set these in your local Expo environment or `.env` file if your setup supports it.

## Notes

- The app uses `expo-router` for navigation.
- The root `frontend/app/_layout.tsx` file controls auth-based navigation and screen registration.
- If you change environment variables, restart the Expo server.
