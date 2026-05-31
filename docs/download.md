# Hiramekin Download Plan

## 方針

Hiramekin のファイル保管先は GitHub Releases に統一し、ユーザーの導線は `public/download.html` に集約する。

- デスクトップ版: ダウンロードページから Windows / macOS インストーラーを直接ダウンロード
- Android beta: ダウンロードページから既存の GitHub Releases APK を直接ダウンロード
- 配布ページ: `public/download.html`
- デスクトップ版タグ: `desktop-v1.0.9`
- Android betaタグ: `v1.0.9-beta`

## デスクトップ版

### 対象

- Windows 10 / 11
- macOS

### 配布形式

- Windows: `.exe` / `.msi`
- macOS: `.dmg`
- 自動更新用: `.app.tar.gz` と `.sig`

### 配布URL

Desktop Build の成果物を GitHub Release に添付後、ダウンロードページにOS別の直接リンクを載せる。

```text
https://github.com/pakpadev/hiramekin/releases/download/desktop-v1.0.9/Hiramekin_1.0.9_x64-setup.exe
https://github.com/pakpadev/hiramekin/releases/download/desktop-v1.0.9/Hiramekin_1.0.9_x64_en-US.msi
https://github.com/pakpadev/hiramekin/releases/download/desktop-v1.0.9/Hiramekin_1.0.9_x64.dmg
https://github.com/pakpadev/hiramekin/releases/download/desktop-v1.0.9/Hiramekin.app.tar.gz
```

ユーザーにはGitHub Releases画面へ遷移させず、ダウンロードページ上のボタンから直接取得させる。
Release asset名がActions成果物と異なる場合は、上記のファイル名に揃えてReleaseへアップロードする。

## Android beta

- 配布形式: APK
- バージョン: `v1.0.9-beta`
- APK名: `hiramekin-v1.0.9-beta.apk`
- 配布URL: `https://github.com/pakpadev/hiramekin/releases/download/v1.0.9-beta/hiramekin-v1.0.9-beta.apk`
- サイズ: 61,113,544 bytes
- 表示サイズ: 58 MB
- SHA-256: `1EAFC8B559AC57CEC83256DF505D8736314B10D703D0E25C070D738EF09866BF`

## Desktop Build 手順

1. GitHub Actions の `Desktop Build` を手動実行する。
1. `hiramekin-windows-bundle` と `hiramekin-macos-bundle` をArtifactsから取得する。
1. Windows / macOS 実機で以下を確認する。
   - 起動
   - アプリアイコン
   - 通常画面のマイク
   - システムトレイ
   - hide-on-close
   - グローバルショートカット
   - オーバーレイ表示 / ドラッグ / 透明度調整
   - 自動起動設定
   - ファイルエクスポート
1. GitHub Releases に `desktop-v1.0.9` を作成する。
1. Artifacts内のインストーラー、自動更新用アーカイブ、署名ファイルをRelease assetsとしてアップロードする。
1. `public/download.html` のOS別ボタンから直接ダウンロードできることを確認する。

## 自動アップデート

Tauri updater は `public/latest.json` を参照する。

署名付きアップデートを有効にするには、GitHub Actions のビルド時に以下のSecretsが必要。

- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`（必要な場合）

Release assets と `.sig` が確定した後、`public/latest.json` の `platforms` にURLと署名を入れる。

注意:

- 現在のアプリバージョンは `1.0.9`。
- `latest.json` に `1.0.9` を指定しても同一バージョンなので更新通知は出ない。
- 自動アップデート検証は `1.0.10` 以降のReleaseで行う。
- 不正なURLや署名を入れるとアップデーターが失敗するため、Release前は `platforms: {}` のままにする。

## 注意事項

- macOSではネイティブウィンドウの完全透明化を使っていないため、オーバーレイの透過はReact UI側の表現になる。
- macOSのショートカットやマイクは、OS側の権限許可が必要になる場合がある。
- Android APK は debug signing config 署名のため、Google Play 提出用ではない。
