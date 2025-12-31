# PyCourse Universal (Web + Mobile)

This is the Universal Expo version of PyCourse, migrated from the original Vite + Express web app.

## Prerequisites

- Node.js (v18+)
- npm or yarn

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npx expo start
   ```

   - Press `a` for Android (requires Android Studio / Emulator).
   - Press `w` for Web.
   - Scan the QR code with the **Expo Go** app on your physical device.

## Build for Web

To export the static web version:
```bash
npx expo export -p web
```
The output will be in the `dist` folder.

## Build for Android (APK)

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Login to your Expo account:
   ```bash
   eas login
   ```

3. Build the APK (Preview profile):
   ```bash
   eas build -p android --profile preview
   ```

## Project Structure

- **app/**: Expo Router pages.
  - `(tabs)/`: Tab navigation (Home, Profile).
  - `module/[id].tsx`: Dynamic module page (Materi, Code, Quiz).
  - `auth.tsx`: Login/Register page.
- **components/**: Reusable UI components (Quiz, Typewriter).
- **constants/**: Data and config (Api.js, modules.js).
- **assets/**: Images and the Code Editor HTML (`editor.html`).

## Configuration

- **API URL**: Update `constants/Api.js` to point to your backend URL (e.g., Render, Railway, or local IP).
