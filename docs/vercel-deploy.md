# Vercel Deploy

## 設定

- Repository: `pakpadev/hiramekin`
- Framework Preset: Other
- Install Command: `npm install`
- Build Command: `npm run build:web`
- Output Directory: `dist`
- Node.js: 20系

`vercel.json` に同じ設定を固定しているため、VercelのProject Settingsでは基本的に自動検出のままでよい。

## 公開後の確認

1. `https://<vercel-url>/` を開く。
2. `https://<vercel-url>/download.html` を開く。
3. `APKをダウンロード` が次のURLを指していることを確認する。

```text
https://github.com/pakpadev/hiramekin/releases/download/v1.0.1-beta/hiramekin-v1.0.1-beta.apk
```

4. Android端末で `download.html` からAPKをダウンロードする。
5. APKをインストールし、`versionCode=2` の `v1.0.1-beta` として更新できることを確認する。

## 注意

- GitHub ReleaseのAPKは `v1.0.1-beta` を使う。
- `v1.0.0-beta` は旧APKであり、既にインストール済み端末の更新検証には使わない。
- Vercel公開後、READMEまたはDownloadページに正式な公開URLを追記する。
