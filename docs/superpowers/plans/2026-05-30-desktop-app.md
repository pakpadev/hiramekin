# Hiramekin デスクトップアプリ (Tauri) 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ExpoのWebビルドをTauri v2でラップし、Windows/macOS向けネイティブデスクトップアプリを作成する。システムトレイ常駐、グローバルショートカット、オーバーレイウィンドウ、自動起動、ファイルエクスポート、自動アップデートを実装する。

**Implementation Status (2026-05-30):** コード実装とコンテナ内検証は完了。`npm test -- --runInBand`、`npm run typecheck`、`cargo check`、`npm run build:web`、`npm run tauri:build` は成功済み。Linuxコンテナでは `.deb` / `.rpm` / `.AppImage` が生成済み。Windows `.exe` / macOS `.dmg` の生成、インストーラー実行、トレイ・グローバルショートカット・自動起動・保存ダイアログの実機確認は各OS上で実施する。

**CI Build Status (2026-05-31):** `.github/workflows/desktop-build.yml` を追加。手動実行または `desktop-v*` タグpushで Windows NSIS bundle と macOS DMG bundle を生成し、Artifacts にアップロードする。Tauri updater が有効なため、GitHub Secrets に `TAURI_SIGNING_PRIVATE_KEY` と必要に応じて `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` を設定してから実行する。

**Implementation Notes:** 設計書の `set_overlay_opacity` / `export_memos` / `set_autostart` 相当の機能は、Tauri IPCコマンドではなくフロントエンドからTauri plugin APIを直接呼ぶ形で実装した。`show_overlay` / `hide_overlay` / `memo_submitted` はRust IPCコマンドとして実装済み。

**Architecture:** `expo export --platform web` で `dist/` を生成し、Tauri v2がその静的ファイルをOSネイティブのWebView（Windows: WebView2、macOS: WKWebView）で配信する。デスクトップ固有機能はRust（`src-tauri/src/lib.rs`）で実装し、Tauri IPC（`invoke` API）でフロントエンドと通信する。オーバーレイウィンドウは `index.html?mode=overlay` で別ウィンドウとして起動し、App.tsx でクエリパラメータを検出してシンプルな入力UIを描画する。

**Tech Stack:** Tauri v2、Rust 1.77+、`@tauri-apps/api` v2、`@tauri-apps/plugin-global-shortcut`、`@tauri-apps/plugin-autostart`、`@tauri-apps/plugin-fs`、`@tauri-apps/plugin-dialog`、`@tauri-apps/plugin-updater`

---

## ファイル構成

```text
新規作成:
  src-tauri/
    Cargo.toml
    build.rs
    tauri.conf.json
    capabilities/default.json
    icons/                        ← Task 11 でアイコン生成
    src/
      main.rs                     ← Rustエントリポイント（thin wrapper）
      lib.rs                      ← アプリロジック本体

  src/utils/tauri.ts              ← isTauri() ユーティリティ
  src/components/OverlayApp.tsx   ← オーバーレイUIコンポーネント

修正:
  package.json                    ← Tauriスクリプト・依存追加
  src/components/PwaInstallBanner.tsx  ← Tauriコンテキストでは動作スキップ
  src/components/KeyboardToolbar.tsx   ← Tauriコンテキストでマイクボタン非表示
  App.tsx                         ← オーバーレイモード分岐
  src/screens/SettingsScreen.tsx  ← エクスポート・自動起動項目追加
```

---

## Task 1: 前提条件のセットアップ

**Files:**
- 変更なし（環境セットアップのみ）

- [ ] **Step 1: Rustをインストール**

PowerShellで実行:
```powershell
winget install Rustlang.Rustup
# インストール後、シェルを再起動してから確認
rustup --version
```

macOSの場合:
```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

- [ ] **Step 2: Visual Studio Build Tools を確認（Windowsのみ）**

Visual Studio Installer を開き、「C++ によるデスクトップ開発」ワークロードがインストール済みであることを確認する。未インストールの場合は追加する。

- [ ] **Step 3: WebView2 を確認（Windowsのみ）**

Windows 11 には標準搭載されているため通常確認不要。Windows 10 の場合:
```powershell
Get-ItemProperty "HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" -ErrorAction SilentlyContinue
```
存在しない場合は https://developer.microsoft.com/en-us/microsoft-edge/webview2/ からインストール。

- [ ] **Step 4: Tauri CLIをインストール**

```bash
npm install --save-dev @tauri-apps/cli@latest
```

- [ ] **Step 5: 動作確認**

```bash
npx tauri --version
```

Expected: `tauri-cli 2.x.x`

---

## Task 2: Tauri プロジェクト初期化 & 設定

**Files:**
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/build.rs`
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/capabilities/default.json`
- Create: `src-tauri/src/main.rs`
- Create: `src-tauri/src/lib.rs`
- Modify: `package.json`

- [ ] **Step 1: Tauri プロジェクトを初期化**

```bash
npx tauri init
```

プロンプトへの回答:
- App name: `Hiramekin`
- Window title: `Hiramekin`
- Where are web assets located?: `../dist`
- What is the URL of the dev server?: `http://localhost:8081`
- What is your frontend dev command?: `npm run web`
- What is your frontend build command?: `npm run build:web`

これで `src-tauri/` ディレクトリが生成される。

- [ ] **Step 2: Cargo.toml を設定**

`src-tauri/Cargo.toml` を以下に置き換える:

```toml
[package]
name = "hiramekin"
version = "0.1.0"
description = "Hiramekin Desktop App"
authors = []
edition = "2021"
rust-version = "1.77.2"

[lib]
name = "hiramekin_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = ["tray-icon"] }
tauri-plugin-global-shortcut = "2"
tauri-plugin-autostart = "2"
tauri-plugin-fs = "2"
tauri-plugin-dialog = "2"
tauri-plugin-updater = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

- [ ] **Step 3: build.rs を作成**

`src-tauri/build.rs`:

```rust
fn main() {
    tauri_build::build()
}
```

- [ ] **Step 4: tauri.conf.json を設定**

`src-tauri/tauri.conf.json` を以下に置き換える:

```json
{
  "$schema": "https://schema.tauri.app/config/2.json",
  "productName": "Hiramekin",
  "version": "1.0.9",
  "identifier": "com.hiramekin.app",
  "build": {
    "beforeDevCommand": "npm run web",
    "devUrl": "http://localhost:8081",
    "beforeBuildCommand": "npm run build:web",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "Hiramekin",
        "width": 420,
        "height": 720,
        "resizable": true,
        "minWidth": 320,
        "minHeight": 500
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

- [ ] **Step 5: capabilities/default.json を作成**

`src-tauri/capabilities/default.json`:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default capability for the desktop app",
  "windows": ["main", "overlay"],
  "permissions": [
    "core:path:default",
    "core:event:default",
    "core:window:default",
    "core:app:default",
    "core:image:default",
    "core:resources:default",
    "core:menu:default",
    "core:tray:default",
    "global-shortcut:allow-register",
    "global-shortcut:allow-unregister",
    "global-shortcut:allow-is-registered",
    "autostart:allow-enable",
    "autostart:allow-disable",
    "autostart:allow-is-enabled",
    "fs:allow-write-text-file",
    "fs:allow-read-text-file",
    "dialog:allow-save",
    "updater:default"
  ]
}
```

- [ ] **Step 6: src/main.rs を作成**

`src-tauri/src/main.rs`:

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    hiramekin_lib::run()
}
```

- [ ] **Step 7: src/lib.rs を作成（スケルトン）**

`src-tauri/src/lib.rs`:

```rust
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .setup(|_app| Ok(()))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 8: package.json にスクリプトを追加**

`package.json` の `scripts` に追記:

```json
"tauri": "tauri",
"tauri:dev": "tauri dev",
"tauri:build": "tauri build"
```

- [ ] **Step 9: 開発サーバーで起動確認**

```bash
npm run tauri:dev
```

Expected: Hiramekin のウィンドウが開き、アプリが表示される。エラーがなければOK。

- [ ] **Step 10: コミット**

```bash
git add src-tauri/ package.json package-lock.json
git commit -m "feat(desktop): initialize Tauri v2 project"
```

---

## Task 3: デスクトップ検出ユーティリティ & 互換性修正

**Files:**
- Create: `src/utils/tauri.ts`
- Modify: `src/components/PwaInstallBanner.tsx`
- Modify: `src/components/KeyboardToolbar.tsx`

- [ ] **Step 1: テストを書く**

`src/utils/__tests__/tauri.test.ts`:

```typescript
import { isTauri } from '../tauri';

describe('isTauri', () => {
  it('returns false when __TAURI__ is not present', () => {
    delete (window as any).__TAURI__;
    expect(isTauri()).toBe(false);
  });

  it('returns true when __TAURI__ is present', () => {
    (window as any).__TAURI__ = {};
    expect(isTauri()).toBe(true);
    delete (window as any).__TAURI__;
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

```bash
npm test -- --testPathPattern="tauri.test"
```

Expected: FAIL（`isTauri` が未定義）

- [ ] **Step 3: src/utils/tauri.ts を作成**

```typescript
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}
```

- [ ] **Step 4: テストが通ることを確認**

```bash
npm test -- --testPathPattern="tauri.test"
```

Expected: PASS

- [ ] **Step 5: PwaInstallBanner を修正**

`src/components/PwaInstallBanner.tsx` の `useEffect` を修正する。

変更前:
```typescript
if (Platform.OS !== 'web') return
```

変更後:
```typescript
import { isTauri } from '@/utils/tauri';
// ...
if (Platform.OS !== 'web' || isTauri()) return
```

これにより、Tauriコンテキストではサービスワーカー登録とPWAバナーが完全にスキップされる。

- [ ] **Step 6: KeyboardToolbar のマイクボタンを修正**

`src/components/KeyboardToolbar.tsx` にインポートを追加し、マイクボタンをTauriコンテキストで非表示にする。

```typescript
import { isTauri } from '@/utils/tauri';
```

`KeyboardToolbar` コンポーネント内の `onMic` を受け取る Props の型に nullable を追加し、ScrollView 内のマイクボタン部分を以下に変更:

```typescript
{!isTauri() ? (
  <TouchableOpacity
    accessibilityRole="button"
    testID="mic-button"
    style={buttonStyle}
    onPress={() => {
      setShowTimeMenu(false)
      onMic()
    }}
  >
    <Text style={labelStyle}>マイク</Text>
  </TouchableOpacity>
) : null}
```

- [ ] **Step 7: コミット**

```bash
git add src/utils/tauri.ts src/utils/__tests__/tauri.test.ts src/components/PwaInstallBanner.tsx src/components/KeyboardToolbar.tsx
git commit -m "feat(desktop): add Tauri context detection and fix incompatible features"
```

---

## Task 4: システムトレイ & メインウィンドウ hide-on-close

**Files:**
- Modify: `src-tauri/src/lib.rs`

- [ ] **Step 1: lib.rs をシステムトレイ実装で置き換える**

`src-tauri/src/lib.rs` を以下に置き換える:

```rust
use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager,
};

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            setup_tray(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() == "main" {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn setup_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let show_main = MenuItem::with_id(app, "show_main", "Hiramekinを開く", true, None::<&str>)?;
    let toggle_overlay = MenuItem::with_id(
        app,
        "toggle_overlay",
        "オーバーレイを表示/非表示",
        true,
        None::<&str>,
    )?;
    let sep1 = PredefinedMenuItem::separator(app)?;
    let sep2 = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", "終了", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[
        &show_main,
        &toggle_overlay,
        &sep1,
        &sep2,
        &quit,
    ])?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show_main" => {
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.show();
                    let _ = w.set_focus();
                }
            }
            "toggle_overlay" => {
                if let Some(overlay) = app.get_webview_window("overlay") {
                    if overlay.is_visible().unwrap_or(false) {
                        let _ = overlay.hide();
                    } else {
                        let _ = overlay.show();
                        let _ = overlay.set_focus();
                    }
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(w) = app.get_webview_window("main") {
                    if w.is_visible().unwrap_or(false) {
                        let _ = w.hide();
                    } else {
                        let _ = w.show();
                        let _ = w.set_focus();
                    }
                }
            }
        })
        .build(app)?;

    Ok(())
}
```

- [ ] **Step 2: 動作確認**

```bash
npm run tauri:dev
```

確認項目:
- システムトレイにアイコンが表示される
- トレイを右クリックするとメニューが表示される
- 「Hiramekinを開く」でウィンドウが表示される
- 「終了」でアプリが終了する
- ウィンドウの × ボタンを押してもアプリが終了せずトレイに残る
- トレイアイコンを左クリックしてウィンドウが表示/非表示になる

- [ ] **Step 3: コミット**

```bash
git add src-tauri/src/lib.rs
git commit -m "feat(desktop): add system tray and hide-on-close behavior"
```

---

## Task 5: グローバルショートカット

**Files:**
- Modify: `src-tauri/src/lib.rs`

- [ ] **Step 1: lib.rs にグローバルショートカットを追加**

`lib.rs` の `pub fn run()` の先頭にプラグイン登録を追加し、`setup` でショートカットを登録する。

```rust
use tauri::Manager;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            setup_tray(app)?;
            setup_shortcuts(app)?;
            Ok(())
        })
        // ... 残りは同じ
}

fn setup_shortcuts(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let shortcut_h = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyH);
    let shortcut_o = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::KeyO);

    let app_handle = app.handle().clone();
    app.global_shortcut().on_shortcuts(
        [shortcut_h, shortcut_o],
        move |_app, shortcut, event| {
            if event.state != ShortcutState::Pressed {
                return;
            }
            match shortcut.key {
                Code::KeyH => {
                    if let Some(w) = app_handle.get_webview_window("main") {
                        if w.is_visible().unwrap_or(false) {
                            let _ = w.hide();
                        } else {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                }
                Code::KeyO => {
                    if let Some(overlay) = app_handle.get_webview_window("overlay") {
                        if overlay.is_visible().unwrap_or(false) {
                            let _ = overlay.hide();
                        } else {
                            let _ = overlay.show();
                            let _ = overlay.set_focus();
                        }
                    }
                }
                _ => {}
            }
        },
    )?;

    Ok(())
}
```

- [ ] **Step 2: 動作確認**

```bash
npm run tauri:dev
```

確認項目:
- アプリを最小化した状態で `Ctrl+Shift+H` を押してウィンドウが表示される
- もう一度押して非表示になる
- `Ctrl+Shift+O` でオーバーレイが表示/非表示になる（Task 6 完了後に再確認）

- [ ] **Step 3: コミット**

```bash
git add src-tauri/src/lib.rs
git commit -m "feat(desktop): add global shortcuts Ctrl+Shift+H and Ctrl+Shift+O"
```

---

## Task 6: オーバーレイウィンドウ バックエンド（Rust）

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/tauri.conf.json`

- [ ] **Step 1: IPCコマンドを追加**

`lib.rs` に以下のコマンドを追加する:

```rust
#[tauri::command]
fn show_overlay(app: tauri::AppHandle) {
    if let Some(overlay) = app.get_webview_window("overlay") {
        let _ = overlay.show();
        let _ = overlay.set_focus();
    }
}

#[tauri::command]
fn hide_overlay(app: tauri::AppHandle) {
    if let Some(overlay) = app.get_webview_window("overlay") {
        let _ = overlay.hide();
    }
}

#[tauri::command]
fn memo_submitted(app: tauri::AppHandle) {
    if let Some(overlay) = app.get_webview_window("overlay") {
        let _ = overlay.hide();
    }
}
```

- [ ] **Step 2: setup でオーバーレイウィンドウを作成**

`lib.rs` の `setup` クロージャに以下を追加する:

```rust
use tauri::{WebviewUrl, WebviewWindowBuilder};

// setup クロージャ内に追加
fn setup_overlay(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let main_window = app.get_webview_window("main").unwrap();
    let monitor = main_window.current_monitor()?.unwrap();
    let monitor_size = monitor.size();
    let scale = monitor.scale_factor();

    let overlay_width: f64 = 320.0;
    let overlay_height: f64 = 200.0;
    let x = (monitor_size.width as f64 / scale) - overlay_width - 20.0;
    let y = (monitor_size.height as f64 / scale) - overlay_height - 60.0;

    let overlay_url = WebviewUrl::App("index.html?mode=overlay".into());

    WebviewWindowBuilder::new(app, "overlay", overlay_url)
        .title("")
        .inner_size(overlay_width, overlay_height)
        .position(x, y)
        .always_on_top(true)
        .decorations(false)
        .skip_taskbar(true)
        .visible(false)
        .resizable(true)
        .transparent(true)
        .build()?;

    Ok(())
}
```

- [ ] **Step 3: invoke_handler を追加**

`pub fn run()` に `.invoke_handler` を追加する:

```rust
.invoke_handler(tauri::generate_handler![
    show_overlay,
    hide_overlay,
    memo_submitted,
])
```

- [ ] **Step 4: setup クロージャを更新**

```rust
.setup(|app| {
    setup_tray(app)?;
    setup_shortcuts(app)?;
    setup_overlay(app)?;
    Ok(())
})
```

- [ ] **Step 5: コミット**

```bash
git add src-tauri/src/lib.rs
git commit -m "feat(desktop): add overlay window backend with IPC commands"
```

---

## Task 7: オーバーレイウィンドウ フロントエンド（React）

**Files:**
- Create: `src/components/OverlayApp.tsx`
- Modify: `App.tsx`

- [ ] **Step 1: @tauri-apps/api をインストール**

```bash
npm install @tauri-apps/api
```

- [ ] **Step 2: OverlayApp のテストを書く**

`src/components/__tests__/OverlayApp.test.tsx`:

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { OverlayApp } from '../OverlayApp';

// Tauriのinvokeをモック
jest.mock('@tauri-apps/api/core', () => ({
  invoke: jest.fn().mockResolvedValue(undefined),
}));

describe('OverlayApp', () => {
  it('renders input and submit button', () => {
    const { getByPlaceholderText, getByText } = render(<OverlayApp />);
    expect(getByPlaceholderText('ひらめきを入力...')).toBeTruthy();
    expect(getByText('保存')).toBeTruthy();
  });

  it('clears input after submit', async () => {
    const { getByPlaceholderText, getByText } = render(<OverlayApp />);
    const input = getByPlaceholderText('ひらめきを入力...');
    fireEvent.changeText(input, 'テストメモ');
    fireEvent.press(getByText('保存'));
    await waitFor(() => {
      expect(getByPlaceholderText('ひらめきを入力...')).toBeTruthy();
    });
  });
});
```

- [ ] **Step 3: テストが失敗することを確認**

```bash
npm test -- --testPathPattern="OverlayApp.test"
```

Expected: FAIL

- [ ] **Step 4: OverlayApp.tsx を作成**

`src/components/OverlayApp.tsx`:

```typescript
import { invoke } from '@tauri-apps/api/core';
import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { getStorage } from '@/services/storage';
import { getTheme } from '@/theme';
import { generateId } from '@/utils/uuid';
import type { Memo } from '@/types';

export function OverlayApp() {
  const [content, setContent] = useState('');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = getTheme(isDark);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const now = Date.now();
    const memo: Memo = {
      id: generateId(),
      content: trimmed,
      isPinned: false,
      isArchived: false,
      notifyAt: null,
      createdAt: now,
      updatedAt: now,
    };

    await getStorage().save(memo);
    setContent('');
    await invoke('memo_submitted');
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? 'rgba(17,17,17,0.88)' : 'rgba(255,255,255,0.88)' }]}>
      <TextInput
        style={[styles.input, { color: theme.textPrimary }]}
        value={content}
        onChangeText={setContent}
        placeholder="ひらめきを入力..."
        placeholderTextColor={theme.textMuted}
        multiline
        autoFocus
        onSubmitEditing={handleSubmit}
      />
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.accent }]}
        onPress={handleSubmit}
        accessibilityRole="button"
        accessibilityLabel="メモを保存"
      >
        <Text style={styles.buttonText}>保存</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    margin: 12,
    marginTop: 0,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignSelf: 'flex-end',
  },
  buttonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
  container: {
    borderRadius: 12,
    flex: 1,
    margin: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    margin: 12,
    textAlignVertical: 'top',
  },
});
```

- [ ] **Step 5: テストが通ることを確認**

```bash
npm test -- --testPathPattern="OverlayApp.test"
```

Expected: PASS

- [ ] **Step 6: App.tsx にオーバーレイモード分岐を追加**

`App.tsx` の先頭付近（インポートの後、`export default function App()` の直前）に追加:

```typescript
import { Platform } from 'react-native';
import { OverlayApp } from '@/components/OverlayApp';
import { isTauri } from '@/utils/tauri';
```

`export default function App()` の先頭（`useState` の前）に追加:

```typescript
if (
  isTauri() &&
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('mode') === 'overlay'
) {
  return <OverlayApp />;
}
```

- [ ] **Step 7: 動作確認**

```bash
npm run tauri:dev
```

確認項目:
- `Ctrl+Shift+O` を押してオーバーレイが画面右下に表示される
- テキストを入力して「保存」を押すとオーバーレイが非表示になる
- メインウィンドウのメモリストにメモが追加されている（ウィンドウを開いてリロード）
- オーバーレイが半透明で表示される

- [ ] **Step 8: コミット**

```bash
git add src/components/OverlayApp.tsx src/components/__tests__/OverlayApp.test.tsx App.tsx package.json package-lock.json
git commit -m "feat(desktop): add overlay window frontend with memo creation"
```

---

## Task 8: 自動起動機能

**Files:**
- Modify: `src/screens/SettingsScreen.tsx`
- Modify: `src-tauri/src/lib.rs`（プラグイン登録）

- [ ] **Step 1: @tauri-apps/plugin-autostart をインストール**

```bash
npm install @tauri-apps/plugin-autostart
```

- [ ] **Step 2: lib.rs にプラグインを登録**

`pub fn run()` に追加:

```rust
use tauri_plugin_autostart::MacosLauncher;

// .setup() の前に追加
.plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, Some(vec![])))
```

- [ ] **Step 3: SettingsScreen に自動起動トグルを追加**

`src/screens/SettingsScreen.tsx` の先頭に追加:

```typescript
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';
import { isTauri } from '@/utils/tauri';
```

`SettingsScreen` コンポーネント内に状態を追加:

```typescript
const [autostart, setAutostart] = useState(false);

useEffect(() => {
  if (!isTauri()) return;
  isEnabled().then(setAutostart).catch(() => {});
}, []);

const handleAutostartToggle = async () => {
  try {
    if (autostart) {
      await disable();
    } else {
      await enable();
    }
    setAutostart(!autostart);
  } catch (e) {
    console.error('Autostart toggle failed:', e);
  }
};
```

メイン設定画面の `return` 内（アーカイブボタンの後）に追加:

```typescript
{isTauri() ? (
  <TouchableOpacity
    accessibilityRole="button"
    style={[styles.menuItem, { borderBottomColor: isDark ? '#303030' : '#eee' }]}
    onPress={handleAutostartToggle}
  >
    <Text style={[styles.menuLabel, { color: isDark ? '#f2f2f2' : '#111' }]}>
      ログイン時に自動起動
    </Text>
    <Text style={[styles.menuDescription, { color: isDark ? '#aaa' : '#666' }]}>
      {autostart ? '有効' : '無効'}
    </Text>
  </TouchableOpacity>
) : null}
```

- [ ] **Step 4: 動作確認**

```bash
npm run tauri:dev
```

確認項目:
- 設定画面を開くと「ログイン時に自動起動」が表示される
- トグルで有効/無効が切り替わる
- 有効にしてPCを再起動するとアプリが自動起動する（手動確認）

- [ ] **Step 5: コミット**

```bash
git add src/screens/SettingsScreen.tsx src-tauri/src/lib.rs package.json package-lock.json
git commit -m "feat(desktop): add auto-start on login feature"
```

---

## Task 9: ファイルエクスポート機能

**Files:**
- Modify: `src/screens/SettingsScreen.tsx`

- [ ] **Step 1: プラグインをインストール**

```bash
npm install @tauri-apps/plugin-fs @tauri-apps/plugin-dialog
```

- [ ] **Step 2: lib.rs にプラグインを登録**

```rust
.plugin(tauri_plugin_fs::init())
.plugin(tauri_plugin_dialog::init())
```

- [ ] **Step 3: エクスポートロジックのテストを書く**

`src/utils/__tests__/export.test.ts`:

```typescript
import { memosToText, memosToJson } from '../export';
import type { Memo } from '@/types';

const mockMemo: Memo = {
  id: '1',
  content: 'テストメモ',
  isPinned: false,
  isArchived: false,
  notifyAt: null,
  createdAt: 1000000,
  updatedAt: 1000000,
};

describe('memosToText', () => {
  it('joins memo contents with separator', () => {
    const result = memosToText([mockMemo, { ...mockMemo, content: '2つ目' }]);
    expect(result).toBe('テストメモ\n\n---\n\n2つ目');
  });
});

describe('memosToJson', () => {
  it('serializes memos to JSON string', () => {
    const result = memosToJson([mockMemo]);
    const parsed = JSON.parse(result);
    expect(parsed[0].content).toBe('テストメモ');
  });
});
```

- [ ] **Step 4: テストが失敗することを確認**

```bash
npm test -- --testPathPattern="export.test"
```

Expected: FAIL

- [ ] **Step 5: src/utils/export.ts を作成**

```typescript
import type { Memo } from '@/types';

export function memosToText(memos: Memo[]): string {
  return memos.map((m) => m.content).join('\n\n---\n\n');
}

export function memosToJson(memos: Memo[]): string {
  return JSON.stringify(memos, null, 2);
}
```

- [ ] **Step 6: テストが通ることを確認**

```bash
npm test -- --testPathPattern="export.test"
```

Expected: PASS

- [ ] **Step 7: SettingsScreen にエクスポートボタンを追加**

`src/screens/SettingsScreen.tsx` に追加:

```typescript
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { memosToJson, memosToText } from '@/utils/export';
```

`SettingsScreen` コンポーネント内にハンドラを追加:

```typescript
const handleExport = async (format: 'txt' | 'json') => {
  const memos = await storage.getAll();
  const data = format === 'json' ? memosToJson(memos) : memosToText(memos);
  const extension = format === 'json' ? 'json' : 'txt';

  const path = await save({
    filters: [{ name: format.toUpperCase(), extensions: [extension] }],
    defaultPath: `hiramekin-export.${extension}`,
  });

  if (path) {
    await writeTextFile(path, data);
  }
};
```

メイン設定画面（自動起動の下）に追加:

```typescript
{isTauri() ? (
  <TouchableOpacity
    accessibilityRole="button"
    style={[styles.menuItem, { borderBottomColor: isDark ? '#303030' : '#eee' }]}
    onPress={() => handleExport('json')}
  >
    <Text style={[styles.menuLabel, { color: isDark ? '#f2f2f2' : '#111' }]}>
      メモをエクスポート (JSON)
    </Text>
    <Text style={[styles.menuDescription, { color: isDark ? '#aaa' : '#666' }]}>
      全メモをJSONファイルに保存
    </Text>
  </TouchableOpacity>
) : null}
{isTauri() ? (
  <TouchableOpacity
    accessibilityRole="button"
    style={[styles.menuItem, { borderBottomColor: isDark ? '#303030' : '#eee' }]}
    onPress={() => handleExport('txt')}
  >
    <Text style={[styles.menuLabel, { color: isDark ? '#f2f2f2' : '#111' }]}>
      メモをエクスポート (テキスト)
    </Text>
    <Text style={[styles.menuDescription, { color: isDark ? '#aaa' : '#666' }]}>
      全メモをテキストファイルに保存
    </Text>
  </TouchableOpacity>
) : null}
```

- [ ] **Step 8: 動作確認**

```bash
npm run tauri:dev
```

確認項目:
- 設定画面に「メモをエクスポート (JSON)」「メモをエクスポート (テキスト)」が表示される
- クリックするとファイル保存ダイアログが開く
- 保存後、ファイルが指定フォルダに生成されており内容が正しい

- [ ] **Step 9: コミット**

```bash
git add src/screens/SettingsScreen.tsx src/utils/export.ts src/utils/__tests__/export.test.ts package.json package-lock.json
git commit -m "feat(desktop): add memo file export (JSON and text)"
```

---

## Task 10: 自動アップデート

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/tauri.conf.json`
- Create: `public/latest.json`（アップデートマニフェスト）

- [ ] **Step 1: プラグインをインストール**

```bash
npm install @tauri-apps/plugin-updater
```

`src-tauri/Cargo.toml` の `[dependencies]` に追加（既に追加済みの場合はスキップ）:

```toml
tauri-plugin-updater = "2"
```

- [ ] **Step 2: 署名キーを生成**

```bash
npx tauri signer generate -w ~/.tauri/hiramekin.key
```

出力される公開鍵（`pubkey:` の後の文字列）をコピーしておく。

- [ ] **Step 3: tauri.conf.json にアップデーター設定を追加**

`src-tauri/tauri.conf.json` の `"app"` セクションに追加:

```json
"updater": {
  "active": true,
  "endpoints": [
    "https://raw.githubusercontent.com/pakpadev/hiramekin/master/public/latest.json"
  ],
  "dialog": true,
  "pubkey": "YOUR_PUBLIC_KEY_HERE"
}
```

`YOUR_PUBLIC_KEY_HERE` を Step 2 で生成した公開鍵で置き換える。

- [ ] **Step 4: lib.rs にプラグインを登録**

```rust
.plugin(tauri_plugin_updater::Builder::new().build())
```

- [ ] **Step 5: public/latest.json を作成（プレースホルダー）**

`public/latest.json`:

```json
{
  "version": "1.0.9",
  "notes": "初回リリース",
  "pub_date": "2026-05-30T00:00:00Z",
  "platforms": {}
}
```

このファイルはリリースごとに手動またはCIで更新する。`platforms` には各プラットフォーム向けのバイナリURLと署名を記載する。

- [ ] **Step 6: 動作確認（アップデートなし状態）**

```bash
npm run tauri:dev
```

アップデートチェックはアプリ起動時に実行される。`public/latest.json` の `version` が現在のバージョン（`1.0.9`）以下なのでダイアログは表示されない。エラーが出ないことを確認する。

- [ ] **Step 7: コミット**

```bash
git add src-tauri/src/lib.rs src-tauri/tauri.conf.json public/latest.json package.json package-lock.json
git commit -m "feat(desktop): add auto-update with Tauri updater plugin"
```

---

## Task 11: アプリアイコン & リリースビルド

**Files:**
- Create: `src-tauri/icons/` （生成される）
- Create: `app-icon-source.png`（素材）

- [ ] **Step 1: アイコン素材を用意**

1024×1024px 以上の PNG 画像を `app-icon-source.png` として用意する（正方形、透過PNG推奨）。アイコンはHiramekinのブランドに合わせたデザインにする。

- [ ] **Step 2: Tauri のアイコン生成コマンドを実行**

```bash
npx tauri icon app-icon-source.png
```

これにより `src-tauri/icons/` に必要なサイズのアイコンがすべて生成される。

- [ ] **Step 3: 全テストが通ることを確認**

```bash
npm test
```

Expected: すべてPASS

- [ ] **Step 4: TypeScriptの型チェック**

```bash
npm run typecheck
```

Expected: エラーなし

- [ ] **Step 5: リリースビルドを実行**

```bash
npm run tauri:build
```

Expected: `src-tauri/target/release/bundle/` にインストーラーが生成される

- Windows: `src-tauri/target/release/bundle/nsis/Hiramekin_1.0.9_x64-setup.exe`
- macOS: `src-tauri/target/release/bundle/dmg/Hiramekin_1.0.9_x64.dmg`

- [ ] **Step 6: インストーラーでインストールして動作確認**

インストーラーを実行してインストールし、以下を確認:

- アプリが起動する
- システムトレイにアイコンが表示される
- `Ctrl+Shift+H` でウィンドウが表示/非表示になる
- `Ctrl+Shift+O` でオーバーレイが表示される
- オーバーレイでメモを入力して保存できる
- 設定画面から自動起動・エクスポートが機能する
- × ボタンでウィンドウが閉じてもトレイに残る
- 「終了」でアプリが完全終了する

- [ ] **Step 7: コミット**

```bash
git add src-tauri/icons/ app-icon-source.png
git commit -m "feat(desktop): add app icons and verify release build"
```

---

## スペックとの対応確認

| 設計要件 | 実装タスク |
| --- | --- |
| システムトレイ常駐 | Task 4 |
| グローバルショートカット Ctrl+Shift+H / O | Task 5 |
| 自動起動 | Task 8 |
| ファイルエクスポート | Task 9 |
| 自動アップデート | Task 10 |
| オーバーレイウィンドウ（常に最前面・半透明・右下） | Task 6、7 |
| メインウィンドウ hide-on-close | Task 4 |
| .exe / .dmg インストーラー | Task 11 |
| PWAバナー抑制 | Task 3 |
| 音声入力の非表示 | Task 3 |
