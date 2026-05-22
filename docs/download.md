# Hiramekin APK Download Plan

## 方針

v1 は Google Play ではなく、Android APK の直接配布で実機検証を進める。

- 配布対象: Android
- 配布形式: APK
- 配布単位: GitHub Releases のアセット
- 配布ページ: `public/download.html`
- バージョン: `v1.0.0-beta`
- APK名: `hiramekin-v1.0.0-beta.apk`

## APK情報

- ローカル生成元: `android/app/build/outputs/apk/release/app-release.apk`
- ローカル配布ステージ: `artifacts/releases/hiramekin-v1.0.0-beta.apk`
- 配布URL: `https://github.com/pakpadev/hiramekin/releases/download/v1.0.0-beta/hiramekin-v1.0.0-beta.apk`
- サイズ: 58,647,772 bytes
- 表示サイズ: 56 MB
- SHA-256: `DD6138A1ABC27A33948F71B95BF81CB60BEC5A76D2E4B00D4034A303E20038B4`

## リリース作業

1. Docker内で release APK をビルドする。

```bash
docker compose exec app bash -lc "cd android && ./gradlew assembleRelease --no-daemon --max-workers=1"
```

2. APK をリリース用ファイル名でステージする。

```powershell
Copy-Item -LiteralPath android/app/build/outputs/apk/release/app-release.apk -Destination artifacts/releases/hiramekin-v1.0.0-beta.apk -Force
Get-FileHash artifacts/releases/hiramekin-v1.0.0-beta.apk -Algorithm SHA256
```

3. GitHub Releases に `v1.0.0-beta` を作成し、APKをアップロードする。
4. `https://github.com/pakpadev/hiramekin/releases/download/v1.0.0-beta/hiramekin-v1.0.0-beta.apk` が直接ダウンロードできることを確認する。
5. `https://<site-host>/download.html` からAPKダウンロードできることを確認する。

## 注意事項

- 現在の release APK は debug signing config で署名している。
- v1 の smoke test と直接配布用であり、Google Play 提出用ではない。
- 自動更新はないため、新しいAPKを出す場合はユーザーが再ダウンロードする。
- Android は提供元不明アプリのインストール警告を表示する場合がある。
- iOS はAPK配布できないため、この導線の対象外。
