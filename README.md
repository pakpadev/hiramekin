# Hiramekin

閃筋 is an Expo bare workflow app for the fastest possible idea capture.

## Desktop App

Hiramekin supports Windows and macOS desktop builds through Tauri.

Desktop features:

- System tray with hide-on-close behavior
- Global shortcut for the overlay
  - Windows / Linux: `Ctrl + Shift + Space`
  - macOS: `Command + Shift + Space`
- Overlay memo window with time insertion, calculation preview, meeting template, microphone input, autosave, opacity control, and new memo creation
- Auto-start setting
- Markdown / JSON / CSV export
- Tauri updater support through signed GitHub Release assets
- Desktop app icon using the single character `閃`

Build desktop bundles through GitHub Actions:

```text
Actions → Desktop Build → Run workflow
```

Release notes:

```text
docs/release/v1.0.9-desktop.md
```

Download page for direct installers:

```text
public/download.html
```

Known desktop limitation:

- On macOS, native full-window transparency is disabled for build stability. The overlay uses React-side opacity for the translucent UI effect.

## APK Download

The Android v1.0.9 beta APK is distributed through GitHub Releases and linked
from the static download page:

```text
public/download.html
```

Release asset URL:

```text
https://github.com/pakpadev/hiramekin/releases/download/v1.0.9-beta/hiramekin-v1.0.9-beta.apk
```

See `docs/download.md` and `docs/release/v1.0.9-beta.md` for the release
checklist, APK hash, and installation notes.

## Docker Development

Build the container:

```bash
docker compose build
```

Install dependencies inside Docker:

```bash
docker compose run --rm app npm install
```

Start the web development server:

```bash
docker compose up -d app
```

The Expo web server is available at:

```text
http://localhost:8081
```

Run checks:

```bash
docker compose run --rm app npm run typecheck
docker compose run --rm test npx jest --watchAll=false --passWithNoTests
docker compose run --rm app npx expo export --platform web
```

Visual smoke checks use Playwright with Chromium installed in the Docker image.

## Android Debug Build

The Docker image includes JDK 17 and Android SDK packages needed for the Expo
bare Android build.

Build the debug APK:

```bash
docker compose exec app bash -lc "cd android && ./gradlew assembleDebug --no-daemon --max-workers=1"
```

The APK is generated at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Build a local release APK for sideload distribution:

```bash
docker compose exec app bash -lc "cd android && ./gradlew assembleRelease --no-daemon --max-workers=1"
```

The release APK is generated at:

```text
android/app/build/outputs/apk/release/app-release.apk
```

This local release APK is signed with the debug signing config and is intended
only for v1 smoke testing and direct sideload distribution, not store release.

Check connected Android devices:

```bash
docker compose exec app adb devices -l
```

Install the debug APK when a device is connected:

```bash
docker compose exec app adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Manual Android smoke checks:

- App launches and the memo input is focused.
- Memo creation, save, search, pin, and archive work.
- `100+200`, `=100+200`, and `１００＋２００` show `300`.
- Microphone permission appears and voice input inserts recognized text.
- Notification permission appears and a scheduled memo notification fires.
