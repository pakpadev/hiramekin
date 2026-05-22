# Hiramekin APK Download Plan

## 方針

v1 は Google Play ではなく、Android APK の直接配布で実機検証を進める。

- 配布対象: Android
- 配布形式: APK
- 配布単位: GitHub Releases のアセット
- 配布ページ: `public/download.html`
- バージョン: `v1.0.2-beta`
- APK名: `hiramekin-v1.0.2-beta.apk`

## APK情報

- ローカル生成元: `android/app/build/outputs/apk/release/app-release.apk`
- ローカル配布ステージ: `artifacts/releases/hiramekin-v1.0.2-beta.apk`
- 配布URL: `https://github.com/pakpadev/hiramekin/releases/download/v1.0.2-beta/hiramekin-v1.0.2-beta.apk`
- サイズ: 58,652,468 bytes
- 表示サイズ: 56 MB
- SHA-256: `0311ED5DFCEF8E89A065D27EA6F52FEE4A311B621729DA4F4D8EAB5F161E372D`

## リリース作業

1. Docker内で release APK をビルドする。

   ```bash
   docker compose exec app bash -lc "cd android && ./gradlew assembleRelease --no-daemon --max-workers=1"
   ```

1. APK をリリース用ファイル名でステージする。

   ```powershell
   Copy-Item -LiteralPath android/app/build/outputs/apk/release/app-release.apk -Destination artifacts/releases/hiramekin-v1.0.2-beta.apk -Force
   Get-FileHash artifacts/releases/hiramekin-v1.0.2-beta.apk -Algorithm SHA256
   ```

1. GitHub Releases に `v1.0.2-beta` を作成し、APKをアップロードする。

   ```powershell
   $env:GITHUB_TOKEN = "<github-token>"
   .\scripts\publish-github-release.ps1 -Tag "v1.0.2-beta" -ApkPath "artifacts/releases/hiramekin-v1.0.2-beta.apk" -ReleaseNotesPath "docs/release/v1.0.2-beta.md"
   ```

1. `https://github.com/pakpadev/hiramekin/releases/download/v1.0.2-beta/hiramekin-v1.0.2-beta.apk` が直接ダウンロードできることを確認する。
1. `https://<site-host>/download.html` からAPKダウンロードできることを確認する。

## 注意事項

- 現在の release APK は debug signing config で署名している。
- v1 の smoke test と直接配布用であり、Google Play 提出用ではない。
- 自動更新はないため、新しいAPKを出す場合はユーザーが再ダウンロードする。
- Android は提供元不明アプリのインストール警告を表示する場合がある。
- iOS はAPK配布できないため、この導線の対象外。
