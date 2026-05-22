# Hiramekin APK Download Plan

## 方針

v1 は Google Play ではなく、Android APK の直接配布で実機検証を進める。

- 配布対象: Android
- 配布形式: APK
- 配布単位: GitHub Releases のアセット
- 配布ページ: `public/download.html`
- バージョン: `v1.0.5-beta`
- APK名: `hiramekin-v1.0.5-beta.apk`

## APK情報

- ローカル生成元: `android/app/build/outputs/apk/release/app-release.apk`
- ローカル配布ステージ: `artifacts/releases/hiramekin-v1.0.5-beta.apk`
- 配布URL: `https://github.com/pakpadev/hiramekin/releases/download/v1.0.5-beta/hiramekin-v1.0.5-beta.apk`
- サイズ: 58,676,740 bytes
- 表示サイズ: 56 MB
- SHA-256: `AF1EE87FA73D58272F4728310B44F945E175D1FC843B0C80FAEEB6EBA8C35235`

## リリース作業

1. Docker内で release APK をビルドする。

   ```bash
   docker compose exec app bash -lc "cd android && ./gradlew assembleRelease --no-daemon --max-workers=1"
   ```

1. APK をリリース用ファイル名でステージする。

   ```powershell
   Copy-Item -LiteralPath android/app/build/outputs/apk/release/app-release.apk -Destination artifacts/releases/hiramekin-v1.0.5-beta.apk -Force
   Get-FileHash artifacts/releases/hiramekin-v1.0.5-beta.apk -Algorithm SHA256
   ```

1. GitHub Releases に `v1.0.3-beta` を作成し、APKをアップロードする。

   ```powershell
   .\scripts\publish-github-release.ps1 -Tag "v1.0.5-beta" -ApkPath "artifacts/releases/hiramekin-v1.0.5-beta.apk" -ReleaseNotesPath "docs/release/v1.0.5-beta.md"
   ```

1. `https://github.com/pakpadev/hiramekin/releases/download/v1.0.5-beta/hiramekin-v1.0.5-beta.apk` が直接ダウンロードできることを確認する。
1. `https://<site-host>/download.html` からAPKダウンロードできることを確認する。

## 注意事項

- 現在の release APK は debug signing config で署名している。
- v1 の smoke test と直接配布用であり、Google Play 提出用ではない。
- 自動更新はないため、新しいAPKを出す場合はユーザーが再ダウンロードする。
- Android は提供元不明アプリのインストール警告を表示する場合がある。
- iOS はAPK配布できないため、この導線の対象外。
