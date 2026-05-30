# Desktop App Design — Hiramekin

**Date:** 2026-05-30
**Status:** Approved

---

## Overview

Wrap the existing Expo web build in Tauri to produce native desktop applications for Windows and macOS. The desktop app distributes as a standard installer (.exe / .dmg) and adds desktop-specific capabilities not available in the web or mobile versions.

Initial release ships without code signing. Mac code signing (Apple Developer Program, $99/year) and Windows code signing (Microsoft Trusted Signing, $9.99/month) can be added later when general distribution is required.

---

## Architecture

```text
hiramekin/
├── (existing Expo/React Native code)
├── src-tauri/
│   ├── src/
│   │   └── main.rs          — window management, tray, shortcuts, IPC handlers
│   ├── icons/               — app icons for all platforms
│   └── tauri.conf.json      — Tauri configuration
└── dist/                    — expo export --platform web output (Tauri loads this)
```

**Build flow:**

```sh
expo export --platform web   # outputs to dist/
tauri build                  # outputs .exe (Windows) / .dmg (macOS)
```

Tauri loads `dist/` as a local file server; no internet connection required at runtime. The WebView used is the OS native engine (WebView2 on Windows, WKWebView on macOS), so no Chromium is bundled. Binary size is approximately 10–20 MB.

---

## Window Configuration

Two windows are used.

### Main Window

The full application. Standard window chrome with resize, minimize, maximize. Launching the app or clicking the tray icon opens this window. Closing the window hides it rather than quitting the process — the app continues running in the system tray.

### Overlay Window

A compact, always-on-top memo input panel for capturing ideas without switching away from the current task.

| Property      | Value                                                    |
| ------------- | -------------------------------------------------------- |
| Size          | 320 × 200 px (resizable by user)                         |
| Position      | Bottom-right corner, above taskbar                       |
| Opacity       | 80% default (user-adjustable in settings)                |
| Always on top | Yes                                                      |
| Decorations   | Minimal (no standard title bar)                          |
| Focus         | Always receives mouse events; toggle via global shortcut |

On mouseover, opacity increases to 95% so the content is clearly readable while editing. On mouse leave, returns to configured opacity. The overlay window shows only the memo input field and a submit button — no navigation or full UI.

Toggled via:

- System tray context menu ("Show Overlay" / "Hide Overlay")
- Global shortcut Ctrl+Shift+O (Windows) / Cmd+Shift+O (macOS)

---

## Desktop-Specific Features

### System Tray

A tray icon is present whenever the app is running. Right-click context menu:

```text
Open Hiramekin
Show/Hide Overlay
────────────────
Launch on Startup  [checkbox]
────────────────
Quit
```

Left-clicking the tray icon toggles the main window (show if hidden, hide if visible).

### Global Shortcuts

| Shortcut                    | Action                    |
| --------------------------- | ------------------------- |
| Ctrl+Shift+H / Cmd+Shift+H  | Show / focus main window  |
| Ctrl+Shift+O / Cmd+Shift+O  | Toggle overlay window     |

Shortcuts are active system-wide even when the app window is not focused.

### Auto-Start on Login

Disabled by default. User can enable via the tray context menu or app settings. Uses Tauri's `autostart` plugin (`tauri-plugin-autostart`).

### File System Export

Users can export memos as `.txt` or `.json` files to a folder of their choice. Implemented via Tauri's `fs` and `dialog` APIs. Entry point is an "Export" button in app settings.

Export formats:

- **Text**: one memo per file, filename = first 40 chars of content + timestamp
- **JSON**: single file containing all memos as an array

### Auto-Update

Uses Tauri's built-in updater plugin (`tauri-plugin-updater`). On app launch, checks a JSON endpoint for new versions. If an update is available, shows a native dialog: "A new version (vX.X.X) is available. Update now?" The download and install happen in the background; the app relaunches to apply.

The update manifest is hosted as a JSON file on GitHub Releases. The public key for signature verification is embedded in `tauri.conf.json` at build time.

---

## IPC (Frontend ↔ Rust Communication)

The web frontend communicates with the Rust backend via Tauri's `invoke` API.

| Command              | Direction  | Purpose                                          |
| -------------------- | ---------- | ------------------------------------------------ |
| `show_overlay`       | JS → Rust  | Show overlay window                              |
| `hide_overlay`       | JS → Rust  | Hide overlay window                              |
| `set_overlay_opacity`| JS → Rust  | Adjust overlay transparency                      |
| `export_memos`       | JS → Rust  | Open save dialog and write file                  |
| `set_autostart`      | JS → Rust  | Enable or disable launch on startup              |
| `memo_submitted`     | JS → Rust  | Notify Rust that a memo was saved (hides overlay)|

---

## Overlay UI

The overlay uses a minimal subset of the existing app UI. A new conditional render mode is added to the web app that activates when a query param `?mode=overlay` is present. Tauri passes this param when opening the overlay window.

In overlay mode:

- Only the text input field and submit button are shown
- Background is slightly transparent (handled by the Tauri window `transparent: true` setting)
- Submitting a memo dispatches `memo_submitted` via IPC, which causes the overlay to auto-hide

---

## Distribution

| Platform | Format                   | Notes                                                                      |
| -------- | ------------------------ | -------------------------------------------------------------------------- |
| Windows  | NSIS installer (`.exe`)  | SmartScreen warning on first run; user clicks "More info → Run anyway"     |
| macOS    | DMG                      | Gatekeeper blocks unsigned app; user right-clicks → Open to bypass         |

Code signing is not included in the initial release. A note in the download page explains the bypass procedure for each OS.

---

## Out of Scope

- App Store distribution (requires separate sandboxing work)
- Linux support (can be added later with minimal effort)
- Native OS widgets or menu bar integration beyond system tray
- Sync between desktop and mobile (uses the same underlying storage mechanism)
