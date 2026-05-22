# Hiramekin v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 閃筋アプリのv1を実装する。単一画面・ローカル保存・リアルタイム計算・音声入力・アーカイブ・モバイル通知を備えた最速メモアプリ。

**Architecture:** Expo bare workflow + react-native-web による単一コードベース。画面遷移なし・状態管理のみで browsing/editing/searching を切り替える。ストレージはモバイル(AsyncStorage)とWeb(IndexedDB)を共通インターフェース経由で抽象化。通知はモバイルのみ expo-notifications を使用。

**Tech Stack:** Expo bare workflow, React Native, react-native-web, TypeScript, mathjs, idb, expo-haptics, expo-notifications, Web Speech API(Web/PWA), expo-speech-recognition(Android/iOS), @testing-library/react-native, jest-expo

---

## ファイル構成

```
src/
  types/index.ts                      Memo / AppSettings / UIState 型定義
  utils/dateTime.ts                   今日の日付・時刻フォーマット
  utils/uuid.ts                       UUID生成
  services/storage/IStorage.ts        ストレージインターフェース
  services/storage/AsyncStorageAdapter.ts  モバイル実装
  services/storage/IndexedDBAdapter.ts     Web実装
  services/storage/SupabaseAdapter.ts      将来用スタブ
  services/storage/index.ts           プラットフォーム判定ファクトリー
  services/calculator.ts              mathjs数式評価
  hooks/useMemos.ts                   メモCRUD・検索・アーカイブ
  hooks/useCalc.ts                    行ごとの計算状態
  hooks/useHaptics.ts                 expo-hapticsラッパー
  hooks/useVoice.ts                   音声入力状態管理
  hooks/useNotifications.ts           通知スケジューリングフック（モバイルのみ）
  services/notifications.ts          日付検出・通知スケジューリングロジック
  components/NotifyPicker.tsx         通知時間選択UI
  components/MemoItem.tsx             メモ一覧の1行
  components/MemoList.tsx             ピン留め＋時系列リスト
  components/SearchBar.tsx            検索バー
  components/CalcLine.tsx             数式行＋結果オーバーレイ
  components/InputArea.tsx            テキスト入力（新規・編集共用）
  components/KeyboardToolbar.tsx      今日・時刻・マイクボタン
  components/VoiceInput.tsx           音声入力オーバーレイ
  screens/SettingsScreen.tsx          設定＋アーカイブ一覧
  App.tsx                             単一画面エントリ
__tests__/
  utils/dateTime.test.ts
  services/calculator.test.ts
  services/AsyncStorageAdapter.test.ts
  services/IndexedDBAdapter.test.ts
  hooks/useMemos.test.ts
  hooks/useCalc.test.ts
  components/MemoItem.test.tsx
  components/MemoList.test.tsx
  components/SearchBar.test.tsx
  components/InputArea.test.tsx
  components/KeyboardToolbar.test.tsx
  services/notifications.test.ts
  hooks/useNotifications.test.ts
native/.gitkeep                       v2ウィジェット用プレースホルダー
schema.sql                            Supabaseスキーマ定義（v1未使用）
```

---

## Task 1: Docker-first Expo プロジェクト初期化 + 依存関係インストール

**Files:**
- Create: `package.json` (Expo bare により生成)
- Create: `tsconfig.json`
- Create: `app.json`
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `.dockerignore`
- Create: `jest.config.js`

> **注意:** AGENTS.md の Docker-first ルールに従い、Expo 初期化・依存追加・ビルド・テストはすべて Docker コンテナ内で実行する。Android/iOS のネイティブビルド自体はホスト環境(Android Studio / Xcode)が必要だが、v1 のWeb/PWA開発・テスト実行はDockerで行う。

- [x] **Step 1: 最小の Dockerfile を作成する**

`package.json` がまだ存在しない状態でもコンテナを起動できるよう、初期化用の薄い Node コンテナを先に作る。

```dockerfile
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache bash chromium font-noto-cjk git

ENV PLAYWRIGHT_BROWSERS_PATH=/usr/bin
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
EXPOSE 19006
CMD ["sh", "-lc", "if [ -f package.json ]; then npx expo start --web --host lan; else sleep infinity; fi"]
```

- [x] **Step 2: docker-compose.yml を作成する**

```yaml
services:
  app:
    build: .
    container_name: hiramekin-app
    working_dir: /app
    ports:
      - "19006:19006"
      - "8081:8081"
    volumes:
      - .:/app
      - hiramekin_node_modules:/app/node_modules
    environment:
      - CI=true
      - EXPO_NO_TELEMETRY=1
    stdin_open: true
    tty: true

  test:
    build: .
    container_name: hiramekin-test
    working_dir: /app
    volumes:
      - .:/app
      - hiramekin_node_modules:/app/node_modules
    environment:
      - CI=true
      - EXPO_NO_TELEMETRY=1
    command: sh -lc "if [ -f package.json ]; then npx jest --watchAll=false; else echo 'package.json not found'; fi"

volumes:
  hiramekin_node_modules:
```

- [x] **Step 3: .dockerignore を作成する**

```
node_modules
.expo
android
ios
dist
coverage
```

- [x] **Step 4: Docker イメージをビルドする**

```bash
docker compose build
```

- [x] **Step 5: 既存ディレクトリへ Expo bare プロジェクトを初期化する**

作業ディレクトリには `docs/` が既にあるため、コンテナ内の一時ディレクトリに Expo プロジェクトを生成してから、生成物だけを `/app` にコピーする。これにより `docs/` を上書きしない。

```bash
docker compose run --rm app sh -lc "rm -rf /tmp/hiramekin-init && npx create-expo-app@latest /tmp/hiramekin-init --template bare-minimum && cp -a /tmp/hiramekin-init/. /app/"
```

> 生成物コピー後、`docs/` が残っていることを必ず確認する。

```bash
docker compose run --rm app sh -lc "test -d docs && test -f package.json && echo 'Expo project initialized without deleting docs'"
```

- [x] **Step 6: 追加依存関係をインストールする**

```bash
docker compose run --rm app npx expo install @react-native-async-storage/async-storage expo-haptics expo-notifications react-native-web react-dom
docker compose run --rm app npm install mathjs idb expo-speech-recognition
docker compose run --rm app npm install --save-dev @testing-library/react-native @playwright/test jest-expo@~54.0.17 react-test-renderer@19.1.0 typescript @types/jest@29.5.14 @types/react@~19.1.10
```

> **音声入力の方針:** `expo-speech` は Text-to-Speech 用であり、Speech-to-Text には使わない。Web/PWA は Web Speech API、Android/iOS は `expo-speech-recognition` を採用する。ネイティブモジュールと config plugin を含むため、Android/iOS ビルド前には `docker compose run --rm app npx expo prebuild` を実行して native project へ反映する。

- [x] **Step 7: `tsconfig.json` を確認・調整する**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src", "__tests__", "App.tsx"]
}
```

- [x] **Step 8: `jest.config.js` を作成する**

```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

- [x] **Step 9: `app.json` にアイコン・スプラッシュ・通知権限を設定する**

`app.json` の `expo` オブジェクトに以下を追加・確認する：

```json
{
  "expo": {
    "name": "閃筋",
    "slug": "hiramekin",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/icon.png",
          "color": "#007AFF"
        }
      ]
    ],
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    }
  }
}
```

- [x] **Step 10: `native/` フォルダとスキーマファイルを作成する**

```bash
docker compose run --rm app sh -lc "mkdir -p native && touch native/.gitkeep"
```

- [x] **Step 11: 初期状態の確認を行う**

```bash
docker compose run --rm app npx expo --version
docker compose run --rm test npx jest --watchAll=false --passWithNoTests
```

- [x] **Step 12: コミットする**

```bash
git add -A
git commit -m "chore: initialize Docker-first Expo project with dependencies"
```

---

## Task 2: 型定義

**Files:**
- Create: `src/types/index.ts`
- Create: `src/utils/uuid.ts`

- [x] **Step 1: 型定義ファイルを作成する**

```typescript
// src/types/index.ts
export interface Memo {
  id: string
  content: string
  isPinned: boolean
  isArchived: boolean
  notifyAt: number | null
  createdAt: number
  updatedAt: number
}

export interface AppSettings {
  theme: 'system' | 'light' | 'dark'
}

export interface UIState {
  editingMemoId: string | null
  searchQuery: string
  showArchive: boolean
  isListening: boolean
}
```

- [x] **Step 2: UUID ユーティリティを作成する**

```typescript
// src/utils/uuid.ts
import { Platform } from 'react-native'

export function generateId(): string {
  if (Platform.OS === 'web' && typeof crypto !== 'undefined') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
```

- [x] **Step 3: コミットする**

```bash
git add src/types/index.ts src/utils/uuid.ts
git commit -m "feat: add type definitions and uuid utility"
```

---

## Task 3: 日付・時刻ユーティリティ

**Files:**
- Create: `src/utils/dateTime.ts`
- Create: `__tests__/utils/dateTime.test.ts`

- [x] **Step 1: テストを書く**

```typescript
// __tests__/utils/dateTime.test.ts
import { formatToday, formatTime } from '@/utils/dateTime'

describe('formatToday', () => {
  it('YYYY/MM/DD 形式で返す', () => {
    const result = formatToday(new Date('2026-05-21T10:00:00'))
    expect(result).toBe('2026/05/21')
  })

  it('月と日が1桁のとき0埋めする', () => {
    const result = formatToday(new Date('2026-01-05T10:00:00'))
    expect(result).toBe('2026/01/05')
  })
})

describe('formatTime', () => {
  it('HH:MM 形式で返す', () => {
    const result = formatTime(new Date('2026-05-21T09:05:00'))
    expect(result).toBe('09:05')
  })
})
```

- [x] **Step 2: テストが失敗することを確認する**

```bash
docker compose run --rm test npx jest __tests__/utils/dateTime.test.ts --no-coverage
```

Expected: FAIL — "Cannot find module '@/utils/dateTime'"

- [x] **Step 3: 実装する**

```typescript
// src/utils/dateTime.ts
function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

export function formatToday(date: Date = new Date()): string {
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`
}

export function formatTime(date: Date = new Date()): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}
```

- [x] **Step 4: テストが通ることを確認する**

```bash
docker compose run --rm test npx jest __tests__/utils/dateTime.test.ts --no-coverage
```

Expected: PASS

- [x] **Step 5: コミットする**

```bash
git add src/utils/dateTime.ts __tests__/utils/dateTime.test.ts
git commit -m "feat: add date/time formatting utilities"
```

---

## Task 4: 計算エンジン

**Files:**
- Create: `src/services/calculator.ts`
- Create: `__tests__/services/calculator.test.ts`

- [x] **Step 1: テストを書く**

```typescript
// __tests__/services/calculator.test.ts
import { evaluateLine, isCalculableLine } from '@/services/calculator'

describe('isCalculableLine', () => {
  it('数字と演算子を含む行をtrueにする', () => {
    expect(isCalculableLine('100 + 200')).toBe(true)
    expect(isCalculableLine('1000 * 0.08')).toBe(true)
    expect(isCalculableLine('(100 + 200) * 3')).toBe(true)
  })

  it('テキストのみの行をfalseにする', () => {
    expect(isCalculableLine('ふつうのテキスト')).toBe(false)
    expect(isCalculableLine('会議メモ')).toBe(false)
  })

  it('数字だけの行をfalseにする', () => {
    expect(isCalculableLine('1000')).toBe(false)
  })

  it('空行をfalseにする', () => {
    expect(isCalculableLine('')).toBe(false)
  })
})

describe('evaluateLine', () => {
  it('四則演算を計算する', () => {
    expect(evaluateLine('100 + 200')).toBe('300')
    expect(evaluateLine('10 - 3')).toBe('7')
    expect(evaluateLine('5 * 6')).toBe('30')
    expect(evaluateLine('10 / 4')).toBe('2.5')
  })

  it('パーセントを計算する', () => {
    expect(evaluateLine('1000 * 0.08')).toBe('80')
  })

  it('括弧を計算する', () => {
    expect(evaluateLine('(100 + 200) * 3')).toBe('900')
  })

  it('不正な数式はnullを返す', () => {
    expect(evaluateLine('100 +')).toBeNull()
    expect(evaluateLine('abc + def')).toBeNull()
  })

  it('= 以降を無視して計算する', () => {
    expect(evaluateLine('100 + 200 =')).toBe('300')
    expect(evaluateLine('100 + 200 = 999')).toBe('300')
  })
})
```

- [x] **Step 2: テストが失敗することを確認する**

```bash
docker compose run --rm test npx jest __tests__/services/calculator.test.ts --no-coverage
```

Expected: FAIL

- [x] **Step 3: 実装する**

```typescript
// src/services/calculator.ts
import { evaluate } from 'mathjs'

const CALC_PATTERN = /[\d].*[+\-*/]|[+\-*/].*[\d]/

export function isCalculableLine(line: string): boolean {
  return CALC_PATTERN.test(line)
}

export function evaluateLine(line: string): string | null {
  const expression = line.split('=')[0].trim()
  if (!expression) return null
  try {
    const result = evaluate(expression)
    if (typeof result !== 'number' || !isFinite(result)) return null
    const rounded = parseFloat(result.toPrecision(12))
    return String(rounded)
  } catch {
    return null
  }
}
```

- [x] **Step 4: テストが通ることを確認する**

```bash
docker compose run --rm test npx jest __tests__/services/calculator.test.ts --no-coverage
```

Expected: PASS

- [x] **Step 5: コミットする**

```bash
git add src/services/calculator.ts __tests__/services/calculator.test.ts
git commit -m "feat: add calculator service with mathjs"
```

---

## Task 5: ストレージ層

**Files:**
- Create: `src/services/storage/IStorage.ts`
- Create: `src/services/storage/AsyncStorageAdapter.ts`
- Create: `src/services/storage/IndexedDBAdapter.ts`
- Create: `src/services/storage/SupabaseAdapter.ts`
- Create: `src/services/storage/index.ts`
- Create: `__tests__/services/AsyncStorageAdapter.test.ts`
- Create: `__tests__/services/IndexedDBAdapter.test.ts`

- [x] **Step 1: IStorage インターフェースを作成する**

```typescript
// src/services/storage/IStorage.ts
import type { Memo } from '@/types'

export interface IStorage {
  getAll(): Promise<Memo[]>        // isArchived=false のみ返す
  getArchived(): Promise<Memo[]>   // isArchived=true のみ返す
  save(memo: Memo): Promise<void>
  archive(id: string): Promise<void>
  restore(id: string): Promise<void>
  deletePermanently(id: string): Promise<void>
  search(query: string): Promise<Memo[]>
}
```

- [x] **Step 2: AsyncStorageAdapter のテストを書く**

```typescript
// __tests__/services/AsyncStorageAdapter.test.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AsyncStorageAdapter } from '@/services/storage/AsyncStorageAdapter'
import type { Memo } from '@/types'

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

const makeMemo = (overrides: Partial<Memo> = {}): Memo => ({
  id: 'test-id',
  content: 'テストメモ',
  isPinned: false,
  isArchived: false,
  notifyAt: null,
  createdAt: 1000,
  updatedAt: 1000,
  ...overrides,
})

describe('AsyncStorageAdapter', () => {
  let adapter: AsyncStorageAdapter

  beforeEach(async () => {
    await AsyncStorage.clear()
    adapter = new AsyncStorageAdapter()
  })

  it('メモを保存して全件取得できる', async () => {
    const memo = makeMemo()
    await adapter.save(memo)
    const all = await adapter.getAll()
    expect(all).toHaveLength(1)
    expect(all[0].id).toBe('test-id')
  })

  it('getAll はアーカイブ済みを除外する', async () => {
    await adapter.save(makeMemo({ id: 'a', isArchived: false }))
    await adapter.save(makeMemo({ id: 'b', isArchived: true }))
    const all = await adapter.getAll()
    expect(all).toHaveLength(1)
    expect(all[0].id).toBe('a')
  })

  it('アーカイブするとgetAllから消える', async () => {
    await adapter.save(makeMemo({ id: 'a' }))
    await adapter.archive('a')
    const all = await adapter.getAll()
    expect(all).toHaveLength(0)
  })

  it('復元するとgetAllに戻る', async () => {
    await adapter.save(makeMemo({ id: 'a', isArchived: true }))
    await adapter.restore('a')
    const all = await adapter.getAll()
    expect(all).toHaveLength(1)
  })

  it('完全削除するとgetAllから消える', async () => {
    await adapter.save(makeMemo({ id: 'a' }))
    await adapter.deletePermanently('a')
    const all = await adapter.getAll()
    expect(all).toHaveLength(0)
  })

  it('content の部分一致で検索できる', async () => {
    await adapter.save(makeMemo({ id: 'a', content: 'ひらめき' }))
    await adapter.save(makeMemo({ id: 'b', content: '別のメモ' }))
    const results = await adapter.search('ひらめき')
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('a')
  })
})
```

- [x] **Step 3: テストが失敗することを確認する**

```bash
docker compose run --rm test npx jest __tests__/services/AsyncStorageAdapter.test.ts --no-coverage
```

Expected: FAIL

- [x] **Step 4: AsyncStorageAdapter を実装する**

```typescript
// src/services/storage/AsyncStorageAdapter.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Memo } from '@/types'
import type { IStorage } from './IStorage'

const KEY = 'hiramekin_memos'

export class AsyncStorageAdapter implements IStorage {
  private async readAll(): Promise<Memo[]> {
    const raw = await AsyncStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  }

  private async writeAll(memos: Memo[]): Promise<void> {
    await AsyncStorage.setItem(KEY, JSON.stringify(memos))
  }

  async getAll(): Promise<Memo[]> {
    const all = await this.readAll()
    return all.filter((m) => !m.isArchived)
  }

  async getArchived(): Promise<Memo[]> {
    const all = await this.readAll()
    return all.filter((m) => m.isArchived)
  }

  async save(memo: Memo): Promise<void> {
    const all = await this.readAll()
    const idx = all.findIndex((m) => m.id === memo.id)
    if (idx >= 0) all[idx] = memo
    else all.push(memo)
    await this.writeAll(all)
  }

  async archive(id: string): Promise<void> {
    const all = await this.readAll()
    const memo = all.find((m) => m.id === id)
    if (memo) {
      memo.isArchived = true
      await this.writeAll(all)
    }
  }

  async restore(id: string): Promise<void> {
    const all = await this.readAll()
    const memo = all.find((m) => m.id === id)
    if (memo) {
      memo.isArchived = false
      await this.writeAll(all)
    }
  }

  async deletePermanently(id: string): Promise<void> {
    const all = await this.readAll()
    await this.writeAll(all.filter((m) => m.id !== id))
  }

  async search(query: string): Promise<Memo[]> {
    const all = await this.readAll()
    const lower = query.toLowerCase()
    return all.filter(
      (m) => !m.isArchived && m.content.toLowerCase().includes(lower)
    )
  }
}
```

- [x] **Step 5: AsyncStorageAdapter のテストが通ることを確認する**

```bash
docker compose run --rm test npx jest __tests__/services/AsyncStorageAdapter.test.ts --no-coverage
```

Expected: PASS

- [x] **Step 6: IndexedDBAdapter のテストを書く**

```typescript
// __tests__/services/IndexedDBAdapter.test.ts
import 'fake-indexeddb/auto'
import { IndexedDBAdapter } from '@/services/storage/IndexedDBAdapter'
import type { Memo } from '@/types'

const makeMemo = (overrides: Partial<Memo> = {}): Memo => ({
  id: 'test-id',
  content: 'テストメモ',
  isPinned: false,
  isArchived: false,
  notifyAt: null,
  createdAt: 1000,
  updatedAt: 1000,
  ...overrides,
})

describe('IndexedDBAdapter', () => {
  let adapter: IndexedDBAdapter

  beforeEach(async () => {
    adapter = new IndexedDBAdapter()
    await adapter.clear()
  })

  it('メモを保存して全件取得できる', async () => {
    await adapter.save(makeMemo())
    const all = await adapter.getAll()
    expect(all).toHaveLength(1)
  })

  it('getAll はアーカイブ済みを除外する', async () => {
    await adapter.save(makeMemo({ id: 'a', isArchived: false }))
    await adapter.save(makeMemo({ id: 'b', isArchived: true }))
    const all = await adapter.getAll()
    expect(all).toHaveLength(1)
  })

  it('アーカイブ・復元・完全削除が正しく動作する', async () => {
    await adapter.save(makeMemo({ id: 'a' }))
    await adapter.archive('a')
    expect(await adapter.getAll()).toHaveLength(0)
    await adapter.restore('a')
    expect(await adapter.getAll()).toHaveLength(1)
    await adapter.deletePermanently('a')
    expect(await adapter.getAll()).toHaveLength(0)
  })

  it('content の部分一致で検索できる', async () => {
    await adapter.save(makeMemo({ id: 'a', content: 'ひらめき' }))
    await adapter.save(makeMemo({ id: 'b', content: '別のメモ' }))
    const results = await adapter.search('ひらめき')
    expect(results).toHaveLength(1)
  })
})
```

- [x] **Step 7: fake-indexeddb をインストールする**

```bash
docker compose run --rm app npm install --save-dev fake-indexeddb
```

- [x] **Step 8: IndexedDBAdapter を実装する**

```typescript
// src/services/storage/IndexedDBAdapter.ts
import { openDB, type IDBPDatabase } from 'idb'
import type { Memo } from '@/types'
import type { IStorage } from './IStorage'

const DB_NAME = 'hiramekin'
const STORE = 'memos'
const VERSION = 1

export class IndexedDBAdapter implements IStorage {
  private dbPromise: Promise<IDBPDatabase>

  constructor() {
    this.dbPromise = openDB(DB_NAME, VERSION, {
      upgrade(db) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      },
    })
  }

  async clear(): Promise<void> {
    const db = await this.dbPromise
    await db.clear(STORE)
  }

  async getAll(): Promise<Memo[]> {
    const db = await this.dbPromise
    const all: Memo[] = await db.getAll(STORE)
    return all.filter((m) => !m.isArchived)
  }

  async getArchived(): Promise<Memo[]> {
    const db = await this.dbPromise
    const all: Memo[] = await db.getAll(STORE)
    return all.filter((m) => m.isArchived)
  }

  async save(memo: Memo): Promise<void> {
    const db = await this.dbPromise
    await db.put(STORE, memo)
  }

  async archive(id: string): Promise<void> {
    const db = await this.dbPromise
    const memo: Memo | undefined = await db.get(STORE, id)
    if (memo) await db.put(STORE, { ...memo, isArchived: true })
  }

  async restore(id: string): Promise<void> {
    const db = await this.dbPromise
    const memo: Memo | undefined = await db.get(STORE, id)
    if (memo) await db.put(STORE, { ...memo, isArchived: false })
  }

  async deletePermanently(id: string): Promise<void> {
    const db = await this.dbPromise
    await db.delete(STORE, id)
  }

  async search(query: string): Promise<Memo[]> {
    const db = await this.dbPromise
    const all: Memo[] = await db.getAll(STORE)
    const lower = query.toLowerCase()
    return all.filter(
      (m) => !m.isArchived && m.content.toLowerCase().includes(lower)
    )
  }
}
```

- [x] **Step 9: IndexedDBAdapter のテストが通ることを確認する**

```bash
docker compose run --rm test npx jest __tests__/services/IndexedDBAdapter.test.ts --no-coverage
```

Expected: PASS

- [x] **Step 10: SupabaseAdapter スタブ + ファクトリーを作成する**

```typescript
// src/services/storage/SupabaseAdapter.ts
import type { Memo } from '@/types'
import type { IStorage } from './IStorage'

export class SupabaseAdapter implements IStorage {
  async getAll(): Promise<Memo[]> { throw new Error('Not implemented') }
  async getArchived(): Promise<Memo[]> { throw new Error('Not implemented') }
  async save(_memo: Memo): Promise<void> { throw new Error('Not implemented') }
  async archive(_id: string): Promise<void> { throw new Error('Not implemented') }
  async restore(_id: string): Promise<void> { throw new Error('Not implemented') }
  async deletePermanently(_id: string): Promise<void> { throw new Error('Not implemented') }
  async search(_query: string): Promise<Memo[]> { throw new Error('Not implemented') }
}
```

```typescript
// src/services/storage/index.ts
import { Platform } from 'react-native'
import type { IStorage } from './IStorage'

let _storage: IStorage | null = null

export function getStorage(): IStorage {
  if (_storage) return _storage
  if (Platform.OS === 'web') {
    const { IndexedDBAdapter } = require('./IndexedDBAdapter')
    _storage = new IndexedDBAdapter()
  } else {
    const { AsyncStorageAdapter } = require('./AsyncStorageAdapter')
    _storage = new AsyncStorageAdapter()
  }
  return _storage!
}
```

- [x] **Step 11: コミットする**

```bash
git add src/services/ __tests__/services/
git commit -m "feat: add storage layer with AsyncStorage and IndexedDB adapters"
```

---

## Task 6: useMemos フック

**Files:**
- Create: `src/hooks/useMemos.ts`
- Create: `__tests__/hooks/useMemos.test.ts`

- [x] **Step 1: テストを書く**

```typescript
// __tests__/hooks/useMemos.test.ts
import { renderHook, act } from '@testing-library/react-native'
import { useMemos } from '@/hooks/useMemos'

jest.mock('@/services/storage', () => {
  const memos: any[] = []
  return {
    getStorage: () => ({
      getAll: jest.fn(async () => memos.filter((m) => !m.isArchived)),
      getArchived: jest.fn(async () => memos.filter((m) => m.isArchived)),
      save: jest.fn(async (m: any) => {
        const idx = memos.findIndex((x) => x.id === m.id)
        if (idx >= 0) memos[idx] = m
        else memos.push(m)
      }),
      archive: jest.fn(async (id: string) => {
        const m = memos.find((x) => x.id === id)
        if (m) m.isArchived = true
      }),
      restore: jest.fn(async (id: string) => {
        const m = memos.find((x) => x.id === id)
        if (m) m.isArchived = false
      }),
      deletePermanently: jest.fn(async (id: string) => {
        const idx = memos.findIndex((x) => x.id === id)
        if (idx >= 0) memos.splice(idx, 1)
      }),
      search: jest.fn(async (q: string) =>
        memos.filter((m) => !m.isArchived && m.content.includes(q))
      ),
    }),
  }
})

describe('useMemos', () => {
  it('createMemo でメモが追加される', async () => {
    const { result } = renderHook(() => useMemos())
    await act(async () => {
      await result.current.createMemo('テスト内容')
    })
    expect(result.current.memos).toHaveLength(1)
    expect(result.current.memos[0].content).toBe('テスト内容')
  })

  it('updateMemo でcontentが更新される', async () => {
    const { result } = renderHook(() => useMemos())
    let id: string
    await act(async () => {
      id = await result.current.createMemo('元の内容')
    })
    await act(async () => {
      await result.current.updateMemo(id!, '新しい内容')
    })
    expect(result.current.memos[0].content).toBe('新しい内容')
  })

  it('togglePin でisPinnedが反転する', async () => {
    const { result } = renderHook(() => useMemos())
    let id: string
    await act(async () => {
      id = await result.current.createMemo('テスト')
    })
    await act(async () => {
      await result.current.togglePin(id!)
    })
    expect(result.current.memos[0].isPinned).toBe(true)
  })

  it('archiveMemo でメモがmemosから消える', async () => {
    const { result } = renderHook(() => useMemos())
    let id: string
    await act(async () => {
      id = await result.current.createMemo('テスト')
    })
    await act(async () => {
      await result.current.archiveMemo(id!)
    })
    expect(result.current.memos).toHaveLength(0)
  })

  it('pinnedMemos と regularMemos が正しく分かれる', async () => {
    const { result } = renderHook(() => useMemos())
    await act(async () => {
      const id = await result.current.createMemo('固定')
      await result.current.togglePin(id)
      await result.current.createMemo('通常')
    })
    expect(result.current.pinnedMemos).toHaveLength(1)
    expect(result.current.regularMemos).toHaveLength(1)
  })
})
```

- [x] **Step 2: テストが失敗することを確認する**

```bash
docker compose run --rm test npx jest __tests__/hooks/useMemos.test.ts --no-coverage
```

Expected: FAIL

- [x] **Step 3: useMemos を実装する**

```typescript
// src/hooks/useMemos.ts
import { useState, useEffect, useCallback } from 'react'
import { getStorage } from '@/services/storage'
import { generateId } from '@/utils/uuid'
import type { Memo } from '@/types'

export function useMemos() {
  const [memos, setMemos] = useState<Memo[]>([])
  const storage = getStorage()

  useEffect(() => {
    storage.getAll().then(setMemos)
  }, [])

  const createMemo = useCallback(async (content: string): Promise<string> => {
    const now = Date.now()
    const memo: Memo = {
      id: generateId(),
      content,
      isPinned: false,
      isArchived: false,
      notifyAt: null,
      createdAt: now,
      updatedAt: now,
    }
    await storage.save(memo)
    setMemos((prev) => [memo, ...prev])
    return memo.id
  }, [])

  const updateMemo = useCallback(async (id: string, content: string) => {
    setMemos((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, content, updatedAt: Date.now() } : m
      )
    )
    const updated = memos.find((m) => m.id === id)
    if (updated) await storage.save({ ...updated, content, updatedAt: Date.now() })
  }, [memos])

  const togglePin = useCallback(async (id: string) => {
    const memo = memos.find((m) => m.id === id)
    if (!memo) return
    const updated = { ...memo, isPinned: !memo.isPinned, updatedAt: Date.now() }
    await storage.save(updated)
    setMemos((prev) => prev.map((m) => (m.id === id ? updated : m)))
  }, [memos])

  const archiveMemo = useCallback(async (id: string) => {
    await storage.archive(id)
    setMemos((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const restoreMemo = useCallback(async (id: string) => {
    await storage.restore(id)
  }, [])

  const deletePermanently = useCallback(async (id: string) => {
    await storage.deletePermanently(id)
  }, [])

  const searchMemos = useCallback(async (query: string): Promise<Memo[]> => {
    if (!query.trim()) return []
    return storage.search(query)
  }, [])

  const setNotifyAt = useCallback(async (id: string, notifyAt: number | null) => {
    const memo = memos.find((m) => m.id === id)
    if (!memo) return
    const updated = { ...memo, notifyAt, updatedAt: Date.now() }
    await storage.save(updated)
    setMemos((prev) => prev.map((m) => (m.id === id ? updated : m)))
  }, [memos])

  const getArchivedMemos = useCallback(async (): Promise<Memo[]> => {
    return storage.getArchived()
  }, [])

  const pinnedMemos = memos.filter((m) => m.isPinned)
  const regularMemos = memos.filter((m) => !m.isPinned)

  return {
    memos,
    pinnedMemos,
    regularMemos,
    createMemo,
    updateMemo,
    togglePin,
    archiveMemo,
    restoreMemo,
    deletePermanently,
    searchMemos,
    getArchivedMemos,
    setNotifyAt,
  }
}
```

- [x] **Step 4: テストが通ることを確認する**

```bash
docker compose run --rm test npx jest __tests__/hooks/useMemos.test.ts --no-coverage
```

Expected: PASS

- [x] **Step 5: コミットする**

```bash
git add src/hooks/useMemos.ts __tests__/hooks/useMemos.test.ts
git commit -m "feat: add useMemos hook with CRUD, pin, archive, search"
```

---

## Task 7: useCalc フック

**Files:**
- Create: `src/hooks/useCalc.ts`
- Create: `__tests__/hooks/useCalc.test.ts`

- [x] **Step 1: テストを書く**

```typescript
// __tests__/hooks/useCalc.test.ts
import { renderHook, act } from '@testing-library/react-native'
import { useCalc } from '@/hooks/useCalc'

describe('useCalc', () => {
  it('数式行の結果を返す', () => {
    const { result } = renderHook(() => useCalc('100 + 200\nテキスト\n5 * 6'))
    expect(result.current.getLineResult(0)).toBe('300')
    expect(result.current.getLineResult(1)).toBeNull()
    expect(result.current.getLineResult(2)).toBe('30')
  })

  it('toggleCollapse で行が折り畳まれる', () => {
    const { result } = renderHook(() => useCalc('100 + 200'))
    expect(result.current.isCollapsed(0)).toBe(false)
    act(() => result.current.toggleCollapse(0))
    expect(result.current.isCollapsed(0)).toBe(true)
    act(() => result.current.toggleCollapse(0))
    expect(result.current.isCollapsed(0)).toBe(false)
  })

  it('content 変更時にcollapsed状態がリセットされる', () => {
    const { result, rerender } = renderHook(
      ({ content }) => useCalc(content),
      { initialProps: { content: '100 + 200' } }
    )
    act(() => result.current.toggleCollapse(0))
    expect(result.current.isCollapsed(0)).toBe(true)
    rerender({ content: '200 + 300' })
    expect(result.current.isCollapsed(0)).toBe(false)
  })
})
```

- [x] **Step 2: テストが失敗することを確認する**

```bash
docker compose run --rm test npx jest __tests__/hooks/useCalc.test.ts --no-coverage
```

Expected: FAIL

- [x] **Step 3: useCalc を実装する**

```typescript
// src/hooks/useCalc.ts
import { useState, useEffect } from 'react'
import { evaluateLine, isCalculableLine } from '@/services/calculator'

export function useCalc(content: string) {
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())

  useEffect(() => {
    setCollapsed(new Set())
  }, [content])

  const lines = content.split('\n')

  const getLineResult = (lineIndex: number): string | null => {
    const line = lines[lineIndex]
    if (!line || !isCalculableLine(line)) return null
    return evaluateLine(line)
  }

  const toggleCollapse = (lineIndex: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(lineIndex)) next.delete(lineIndex)
      else next.add(lineIndex)
      return next
    })
  }

  const isCollapsed = (lineIndex: number): boolean => collapsed.has(lineIndex)

  return { getLineResult, toggleCollapse, isCollapsed }
}
```

- [x] **Step 4: テストが通ることを確認する**

```bash
docker compose run --rm test npx jest __tests__/hooks/useCalc.test.ts --no-coverage
```

Expected: PASS

- [x] **Step 5: コミットする**

```bash
git add src/hooks/useCalc.ts __tests__/hooks/useCalc.test.ts
git commit -m "feat: add useCalc hook for per-line calculation state"
```

---

## Task 8: useHaptics フック

**Files:**
- Create: `src/hooks/useHaptics.ts`

- [x] **Step 1: useHaptics を実装する（シンプルなラッパー、テスト不要）**

```typescript
// src/hooks/useHaptics.ts
import { Platform } from 'react-native'
import * as Haptics from 'expo-haptics'

export function useHaptics() {
  const trigger = async (type: 'save' | 'archive' | 'pin') => {
    if (Platform.OS === 'web') return
    try {
      if (type === 'save') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      } else if (type === 'archive') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      } else if (type === 'pin') {
        await Haptics.selectionAsync()
      }
    } catch {
      // ハプティクス非対応デバイスでも無視する
    }
  }

  return { trigger }
}
```

- [x] **Step 2: コミットする**

```bash
git add src/hooks/useHaptics.ts
git commit -m "feat: add useHaptics hook"
```

---

## Task 9: useVoice フック

**Files:**
- Create: `src/hooks/useVoice.ts`

- [x] **Step 1: 音声認識ライブラリが導入済みであることを確認する**

```bash
docker compose run --rm app npm ls expo-speech-recognition
```

> **注意:** `expo-speech-recognition` は Task 1 でインストール済み。このライブラリはネイティブモジュールと config plugin を含むため、Android/iOSビルド前に `docker compose run --rm app npx expo prebuild` を実行してリンクを行うこと。Web環境では Web Speech API を使用する。

- [x] **Step 2: useVoice を実装する**

```typescript
// src/hooks/useVoice.ts
import { useState, useCallback } from 'react'
import { Platform } from 'react-native'

type OnResult = (text: string) => void

export function useVoice(onResult: OnResult) {
  const [isListening, setIsListening] = useState(false)

  const startListening = useCallback(async () => {
    if (Platform.OS === 'web') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition
      if (!SpeechRecognition) return
      const recognition = new SpeechRecognition()
      recognition.lang = 'ja-JP'
      recognition.onresult = (e: any) => {
        const text = e.results[0][0].transcript
        onResult(text)
        setIsListening(false)
      }
      recognition.onerror = () => setIsListening(false)
      recognition.onend = () => setIsListening(false)
      setIsListening(true)
      recognition.start()
      return
    }
    // モバイルは expo-speech (Text-to-Speech) ではなく、
    // expo-speech-recognition のネイティブ音声認識を使う。
    // 詳細実装は native prebuild 後に接続する。
    setIsListening(true)
  }, [onResult])

  const stopListening = useCallback(() => {
    setIsListening(false)
  }, [])

  return { isListening, startListening, stopListening }
}
```

- [x] **Step 3: コミットする**

```bash
git add src/hooks/useVoice.ts
git commit -m "feat: add useVoice hook with web speech API support"
```

---

## Task 10: 通知サービス + useNotifications フック

**Files:**
- Create: `src/services/notifications.ts`
- Create: `src/hooks/useNotifications.ts`
- Create: `src/components/NotifyPicker.tsx`
- Create: `__tests__/services/notifications.test.ts`
- Create: `__tests__/hooks/useNotifications.test.ts`

- [x] **Step 1: 通知サービスのテストを書く**

```typescript
// __tests__/services/notifications.test.ts
import { detectDate, calcNotifyAt } from '@/services/notifications'

describe('detectDate', () => {
  it('YYYY/MM/DD 形式の最初の日付を返す', () => {
    expect(detectDate('2026/05/21 プレゼン準備')).toEqual({
      year: 2026, month: 5, day: 21,
    })
  })

  it('複数の日付があるとき最初の1件を返す', () => {
    expect(detectDate('2026/05/21 から 2026/06/01 まで')).toEqual({
      year: 2026, month: 5, day: 21,
    })
  })

  it('日付がないとき null を返す', () => {
    expect(detectDate('ふつうのメモ')).toBeNull()
  })
})

describe('calcNotifyAt', () => {
  const base = new Date('2026-05-21T00:00:00+09:00')

  it('当日朝8時のタイムスタンプを返す', () => {
    const result = calcNotifyAt({ year: 2026, month: 5, day: 21 }, 'sameDay')
    const expected = new Date('2026-05-21T08:00:00+09:00').getTime()
    expect(result).toBe(expected)
  })

  it('1日前朝8時のタイムスタンプを返す', () => {
    const result = calcNotifyAt({ year: 2026, month: 5, day: 21 }, 'oneDayBefore')
    const expected = new Date('2026-05-20T08:00:00+09:00').getTime()
    expect(result).toBe(expected)
  })

  it('1週間前朝8時のタイムスタンプを返す', () => {
    const result = calcNotifyAt({ year: 2026, month: 5, day: 21 }, 'oneWeekBefore')
    const expected = new Date('2026-05-14T08:00:00+09:00').getTime()
    expect(result).toBe(expected)
  })
})
```

- [x] **Step 2: テストが失敗することを確認する**

```bash
docker compose run --rm test npx jest __tests__/services/notifications.test.ts --no-coverage
```

Expected: FAIL

- [x] **Step 3: 通知サービスを実装する**

```typescript
// src/services/notifications.ts
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'

export interface DateComponents {
  year: number
  month: number
  day: number
}

export type NotifyTiming = 'sameDay' | 'oneDayBefore' | 'oneWeekBefore'

const DATE_PATTERN = /(\d{4})\/(\d{2})\/(\d{2})/

export function detectDate(content: string): DateComponents | null {
  const match = content.match(DATE_PATTERN)
  if (!match) return null
  return {
    year: parseInt(match[1], 10),
    month: parseInt(match[2], 10),
    day: parseInt(match[3], 10),
  }
}

export function calcNotifyAt(date: DateComponents, timing: NotifyTiming): number {
  const d = new Date(date.year, date.month - 1, date.day, 8, 0, 0)
  if (timing === 'oneDayBefore') d.setDate(d.getDate() - 1)
  if (timing === 'oneWeekBefore') d.setDate(d.getDate() - 7)
  return d.getTime()
}

export async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false
  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

export async function scheduleNotification(
  memoId: string,
  content: string,
  notifyAt: number
): Promise<string> {
  await Notifications.cancelScheduledNotificationAsync(memoId)
  const identifier = await Notifications.scheduleNotificationAsync({
    identifier: memoId,
    content: {
      title: '閃筋リマインダー',
      body: content.split('\n')[0].slice(0, 80),
      data: { memoId },
    },
    trigger: { date: new Date(notifyAt) },
  })
  return identifier
}

export async function cancelNotification(memoId: string): Promise<void> {
  if (Platform.OS === 'web') return
  await Notifications.cancelScheduledNotificationAsync(memoId)
}
```

- [x] **Step 4: テストが通ることを確認する**

```bash
docker compose run --rm test npx jest __tests__/services/notifications.test.ts --no-coverage
```

Expected: PASS

- [x] **Step 5: useNotifications フックを実装する**

```typescript
// src/hooks/useNotifications.ts
import { useCallback } from 'react'
import { Platform, Alert } from 'react-native'
import {
  requestPermission,
  scheduleNotification,
  cancelNotification,
  calcNotifyAt,
  type DateComponents,
  type NotifyTiming,
} from '@/services/notifications'

export function useNotifications() {
  const schedule = useCallback(
    async (
      memoId: string,
      content: string,
      date: DateComponents,
      timing: NotifyTiming
    ): Promise<number | null> => {
      if (Platform.OS === 'web') return null
      const granted = await requestPermission()
      if (!granted) {
        Alert.alert('通知が許可されていません', '設定アプリから通知を許可してください')
        return null
      }
      const notifyAt = calcNotifyAt(date, timing)
      await scheduleNotification(memoId, content, notifyAt)
      return notifyAt
    },
    []
  )

  const cancel = useCallback(async (memoId: string): Promise<void> => {
    await cancelNotification(memoId)
  }, [])

  return { schedule, cancel }
}
```

- [x] **Step 6: NotifyPicker コンポーネントを実装する**

```typescript
// src/components/NotifyPicker.tsx
import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native'
import type { NotifyTiming } from '@/services/notifications'

interface Props {
  visible: boolean
  hasExisting: boolean
  onSelect: (timing: NotifyTiming | null) => void
  onDismiss: () => void
}

const OPTIONS: { label: string; value: NotifyTiming }[] = [
  { label: '当日 朝8時', value: 'sameDay' },
  { label: '1日前 朝8時', value: 'oneDayBefore' },
  { label: '1週間前 朝8時', value: 'oneWeekBefore' },
]

export function NotifyPicker({ visible, hasExisting, onSelect, onDismiss }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableOpacity style={styles.overlay} onPress={onDismiss} activeOpacity={1}>
        <View style={styles.sheet}>
          <Text style={styles.title}>通知タイミング</Text>
          {OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={styles.option}
              onPress={() => onSelect(opt.value)}
            >
              <Text style={styles.optionLabel}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
          {hasExisting && (
            <TouchableOpacity
              style={[styles.option, styles.cancelOption]}
              onPress={() => onSelect(null)}
            >
              <Text style={styles.cancelLabel}>通知をキャンセル</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 32,
    paddingTop: 16,
  },
  title: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    marginBottom: 8,
  },
  option: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
  },
  optionLabel: { fontSize: 17, textAlign: 'center' },
  cancelOption: { marginTop: 8 },
  cancelLabel: { fontSize: 17, textAlign: 'center', color: '#FF3B30' },
})
```

- [x] **Step 7: コミットする**

```bash
git add src/services/notifications.ts src/hooks/useNotifications.ts src/components/NotifyPicker.tsx __tests__/services/notifications.test.ts
git commit -m "feat: add notification service, hook, and picker component"
```

---

## Task 11: MemoItem コンポーネント

**Files:**
- Create: `src/components/MemoItem.tsx`
- Create: `__tests__/components/MemoItem.test.tsx`

- [x] **Step 1: テストを書く**

```typescript
// __tests__/components/MemoItem.test.tsx
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { MemoItem } from '@/components/MemoItem'
import type { Memo } from '@/types'

const memo: Memo = {
  id: '1',
  content: 'テストメモの内容',
  isPinned: false,
  isArchived: false,
  notifyAt: null,
  createdAt: new Date('2026-05-21T10:00:00').getTime(),
  updatedAt: new Date('2026-05-21T10:00:00').getTime(),
}

describe('MemoItem', () => {
  it('content の先頭行を表示する', () => {
    render(<MemoItem memo={memo} onPress={jest.fn()} />)
    expect(screen.getByText('テストメモの内容')).toBeTruthy()
  })

  it('タップで onPress が呼ばれる', () => {
    const onPress = jest.fn()
    render(<MemoItem memo={memo} onPress={onPress} />)
    fireEvent.press(screen.getByText('テストメモの内容'))
    expect(onPress).toHaveBeenCalledWith(memo.id)
  })

  it('isPinned のときピンアイコンを表示する', () => {
    render(<MemoItem memo={{ ...memo, isPinned: true }} onPress={jest.fn()} />)
    expect(screen.getByTestId('pin-icon')).toBeTruthy()
  })
})
```

- [x] **Step 2: テストが失敗することを確認する**

```bash
docker compose run --rm test npx jest __tests__/components/MemoItem.test.tsx --no-coverage
```

Expected: FAIL

- [x] **Step 3: MemoItem を実装する**

```typescript
// src/components/MemoItem.tsx
import React from 'react'
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native'
import type { Memo } from '@/types'

interface Props {
  memo: Memo
  onPress: (id: string) => void
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts)
  const now = new Date()
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  if (isToday) {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }
  return `${date.getMonth() + 1}/${date.getDate()}`
}

export function MemoItem({ memo, onPress }: Props) {
  const preview = memo.content.split('\n')[0] || ''

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(memo.id)}>
      <Text style={styles.content} numberOfLines={1}>
        {preview}
      </Text>
      <View style={styles.meta}>
        {memo.isPinned && (
          <Text testID="pin-icon" style={styles.pin}>
            +
          </Text>
        )}
        <Text style={styles.time}>{formatTimestamp(memo.updatedAt)}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  content: { flex: 1, fontSize: 15 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pin: { fontSize: 12, color: '#888' },
  time: { fontSize: 12, color: '#888' },
})
```

- [x] **Step 4: テストが通ることを確認する**

```bash
docker compose run --rm test npx jest __tests__/components/MemoItem.test.tsx --no-coverage
```

Expected: PASS

- [x] **Step 5: コミットする**

```bash
git add src/components/MemoItem.tsx __tests__/components/MemoItem.test.tsx
git commit -m "feat: add MemoItem component"
```

---

## Task 12: MemoList コンポーネント

**Files:**
- Create: `src/components/MemoList.tsx`
- Create: `__tests__/components/MemoList.test.tsx`

- [x] **Step 1: テストを書く**

```typescript
// __tests__/components/MemoList.test.tsx
import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { MemoList } from '@/components/MemoList'
import type { Memo } from '@/types'

const makeMemo = (id: string, content: string, isPinned = false): Memo => ({
  id,
  content,
  isPinned,
  isArchived: false,
  notifyAt: null,
  createdAt: 1000,
  updatedAt: 1000,
})

describe('MemoList', () => {
  it('ピン留めと通常メモを両方表示する', () => {
    render(
      <MemoList
        pinnedMemos={[makeMemo('1', 'ピン留め', true)]}
        regularMemos={[makeMemo('2', '通常')]}
        onSelectMemo={jest.fn()}
      />
    )
    expect(screen.getByText('ピン留め')).toBeTruthy()
    expect(screen.getByText('通常')).toBeTruthy()
  })

  it('ピン留めがない場合はセクションヘッダーを非表示にする', () => {
    render(
      <MemoList
        pinnedMemos={[]}
        regularMemos={[makeMemo('1', '通常')]}
        onSelectMemo={jest.fn()}
      />
    )
    expect(screen.queryByText('ピン留め')).toBeNull()
  })
})
```

- [x] **Step 2: テストが失敗することを確認する**

```bash
docker compose run --rm test npx jest __tests__/components/MemoList.test.tsx --no-coverage
```

Expected: FAIL

- [x] **Step 3: MemoList を実装する**

```typescript
// src/components/MemoList.tsx
import React from 'react'
import { ScrollView, Text, StyleSheet } from 'react-native'
import { MemoItem } from './MemoItem'
import type { Memo } from '@/types'

interface Props {
  pinnedMemos: Memo[]
  regularMemos: Memo[]
  onSelectMemo: (id: string) => void
}

export function MemoList({ pinnedMemos, regularMemos, onSelectMemo }: Props) {
  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {pinnedMemos.length > 0 && (
        <>
          <Text style={styles.sectionHeader}>ピン留め</Text>
          {pinnedMemos.map((m) => (
            <MemoItem key={m.id} memo={m} onPress={onSelectMemo} />
          ))}
        </>
      )}
      {regularMemos.map((m) => (
        <MemoItem key={m.id} memo={m} onPress={onSelectMemo} />
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionHeader: {
    fontSize: 12,
    color: '#888',
    paddingHorizontal: 16,
    paddingVertical: 6,
    textTransform: 'uppercase',
  },
})
```

- [x] **Step 4: テストが通ることを確認する**

```bash
docker compose run --rm test npx jest __tests__/components/MemoList.test.tsx --no-coverage
```

Expected: PASS

- [x] **Step 5: コミットする**

```bash
git add src/components/MemoList.tsx __tests__/components/MemoList.test.tsx
git commit -m "feat: add MemoList component"
```

---

## Task 13: SearchBar コンポーネント

**Files:**
- Create: `src/components/SearchBar.tsx`
- Create: `__tests__/components/SearchBar.test.tsx`

- [x] **Step 1: テストを書く**

```typescript
// __tests__/components/SearchBar.test.tsx
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { SearchBar } from '@/components/SearchBar'

describe('SearchBar', () => {
  it('入力値を onChange に渡す', () => {
    const onChange = jest.fn()
    render(<SearchBar value="" onChange={onChange} />)
    fireEvent.changeText(screen.getByPlaceholderText('検索'), 'テスト')
    expect(onChange).toHaveBeenCalledWith('テスト')
  })

  it('クリアボタンで空文字を渡す', () => {
    const onChange = jest.fn()
    render(<SearchBar value="テスト" onChange={onChange} />)
    fireEvent.press(screen.getByTestId('clear-button'))
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('value が空のときクリアボタンを非表示にする', () => {
    render(<SearchBar value="" onChange={jest.fn()} />)
    expect(screen.queryByTestId('clear-button')).toBeNull()
  })
})
```

- [x] **Step 2: テストが失敗することを確認する**

```bash
docker compose run --rm test npx jest __tests__/components/SearchBar.test.tsx --no-coverage
```

Expected: FAIL

- [x] **Step 3: SearchBar を実装する**

```typescript
// src/components/SearchBar.tsx
import React from 'react'
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native'

interface Props {
  value: string
  onChange: (text: string) => void
}

export function SearchBar({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder="検索"
        placeholderTextColor="#999"
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity testID="clear-button" onPress={() => onChange('')}>
          <Text style={styles.clear}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  input: { flex: 1, fontSize: 15 },
  clear: { fontSize: 16, color: '#888', paddingHorizontal: 4 },
})
```

- [x] **Step 4: テストが通ることを確認する**

```bash
docker compose run --rm test npx jest __tests__/components/SearchBar.test.tsx --no-coverage
```

Expected: PASS

- [x] **Step 5: コミットする**

```bash
git add src/components/SearchBar.tsx __tests__/components/SearchBar.test.tsx
git commit -m "feat: add SearchBar component"
```

---

## Task 14: CalcLine + InputArea コンポーネント

**Files:**
- Create: `src/components/CalcLine.tsx`
- Create: `src/components/InputArea.tsx`
- Create: `__tests__/components/InputArea.test.tsx`

- [x] **Step 1: CalcLine を実装する**

```typescript
// src/components/CalcLine.tsx
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface Props {
  line: string
  result: string | null
  isCollapsed: boolean
  onToggle: () => void
}

export function CalcLine({ line, result, isCollapsed, onToggle }: Props) {
  if (!result) {
    return <Text style={styles.plainLine}>{line}</Text>
  }

  if (isCollapsed) {
    return (
      <TouchableOpacity onPress={onToggle}>
        <Text style={styles.collapsedResult}>{result}</Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.row}>
      <Text style={styles.expression}>{line}</Text>
      <TouchableOpacity onPress={onToggle}>
        <Text style={styles.result}>{result}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  plainLine: { fontSize: 16, lineHeight: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  expression: { fontSize: 16, lineHeight: 24, flex: 1 },
  result: {
    fontSize: 16,
    lineHeight: 24,
    color: '#007AFF',
    fontVariant: ['tabular-nums'],
  },
  collapsedResult: {
    fontSize: 16,
    lineHeight: 24,
    color: '#007AFF',
    fontVariant: ['tabular-nums'],
  },
})
```

- [x] **Step 2: InputArea のテストを書く**

```typescript
// __tests__/components/InputArea.test.tsx
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { InputArea } from '@/components/InputArea'

describe('InputArea', () => {
  it('content を表示する', () => {
    render(
      <InputArea
        content="テストテキスト"
        onChange={jest.fn()}
        onBlur={jest.fn()}
        autoFocus={false}
      />
    )
    expect(screen.getByDisplayValue('テストテキスト')).toBeTruthy()
  })

  it('テキスト変更で onChange が呼ばれる', () => {
    const onChange = jest.fn()
    render(
      <InputArea
        content=""
        onChange={onChange}
        onBlur={jest.fn()}
        autoFocus={false}
      />
    )
    fireEvent.changeText(screen.getByTestId('memo-input'), '新しいテキスト')
    expect(onChange).toHaveBeenCalledWith('新しいテキスト')
  })
})
```

- [x] **Step 3: テストが失敗することを確認する**

```bash
docker compose run --rm test npx jest __tests__/components/InputArea.test.tsx --no-coverage
```

Expected: FAIL

- [x] **Step 4: InputArea を実装する**

```typescript
// src/components/InputArea.tsx
import React, { useRef } from 'react'
import { TextInput, StyleSheet, View } from 'react-native'
import { useCalc } from '@/hooks/useCalc'
import { CalcLine } from './CalcLine'

interface Props {
  content: string
  onChange: (text: string) => void
  onBlur: () => void
  autoFocus: boolean
  insertRef?: React.MutableRefObject<((text: string) => void) | null>
}

export function InputArea({ content, onChange, onBlur, autoFocus, insertRef }: Props) {
  const inputRef = useRef<TextInput>(null)
  const selectionRef = useRef({ start: 0, end: 0 })
  const { getLineResult, toggleCollapse, isCollapsed } = useCalc(content)

  if (insertRef) {
    insertRef.current = (text: string) => {
      const { start } = selectionRef.current
      const next = content.slice(0, start) + text + content.slice(start)
      onChange(next)
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        ref={inputRef}
        testID="memo-input"
        style={styles.input}
        value={content}
        onChangeText={onChange}
        onBlur={onBlur}
        onSelectionChange={(e) => {
          selectionRef.current = e.nativeEvent.selection
        }}
        multiline
        autoFocus={autoFocus}
        textAlignVertical="top"
        scrollEnabled={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { padding: 12 },
  input: { fontSize: 16, lineHeight: 24, minHeight: 40 },
})
```

- [x] **Step 5: テストが通ることを確認する**

```bash
docker compose run --rm test npx jest __tests__/components/InputArea.test.tsx --no-coverage
```

Expected: PASS

- [x] **Step 6: コミットする**

```bash
git add src/components/CalcLine.tsx src/components/InputArea.tsx __tests__/components/InputArea.test.tsx
git commit -m "feat: add CalcLine and InputArea components"
```

---

## Task 15: KeyboardToolbar コンポーネント

**Files:**
- Create: `src/components/KeyboardToolbar.tsx`
- Create: `__tests__/components/KeyboardToolbar.test.tsx`

- [x] **Step 1: テストを書く**

```typescript
// __tests__/components/KeyboardToolbar.test.tsx
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { KeyboardToolbar } from '@/components/KeyboardToolbar'

describe('KeyboardToolbar', () => {
  it('「今日」ボタンで onInsert が今日の日付で呼ばれる', () => {
    const onInsert = jest.fn()
    const onMic = jest.fn()
    jest
      .spyOn(Date, 'now')
      .mockReturnValue(new Date('2026-05-21T10:00:00').getTime())

    render(<KeyboardToolbar onInsert={onInsert} onMic={onMic} />)
    fireEvent.press(screen.getByText('今日'))
    expect(onInsert).toHaveBeenCalledWith('2026/05/21')
  })

  it('「時刻」ボタンで onInsert が時刻で呼ばれる', () => {
    const onInsert = jest.fn()
    jest
      .useFakeTimers()
      .setSystemTime(new Date('2026-05-21T09:05:00'))

    render(<KeyboardToolbar onInsert={onInsert} onMic={jest.fn()} />)
    fireEvent.press(screen.getByText('時刻'))
    expect(onInsert).toHaveBeenCalledWith('09:05')
  })

  it('「マイク」ボタンで onMic が呼ばれる', () => {
    const onMic = jest.fn()
    render(<KeyboardToolbar onInsert={jest.fn()} onMic={onMic} />)
    fireEvent.press(screen.getByTestId('mic-button'))
    expect(onMic).toHaveBeenCalled()
  })
})
```

- [x] **Step 2: テストが失敗することを確認する**

```bash
docker compose run --rm test npx jest __tests__/components/KeyboardToolbar.test.tsx --no-coverage
```

Expected: FAIL

- [x] **Step 3: KeyboardToolbar を実装する**

```typescript
// src/components/KeyboardToolbar.tsx
import React from 'react'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { formatToday, formatTime } from '@/utils/dateTime'

interface Props {
  onInsert: (text: string) => void
  onMic: () => void
}

export function KeyboardToolbar({ onInsert, onMic }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={() => onInsert(formatToday())}>
        <Text style={styles.label}>今日</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => onInsert(formatTime())}>
        <Text style={styles.label}>時刻</Text>
      </TouchableOpacity>
      <TouchableOpacity testID="mic-button" style={styles.button} onPress={onMic}>
        <Text style={styles.label}>マイク</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ccc',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 4,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
  },
  label: { fontSize: 14 },
})
```

- [x] **Step 4: テストが通ることを確認する**

```bash
docker compose run --rm test npx jest __tests__/components/KeyboardToolbar.test.tsx --no-coverage
```

Expected: PASS

- [x] **Step 5: コミットする**

```bash
git add src/components/KeyboardToolbar.tsx __tests__/components/KeyboardToolbar.test.tsx
git commit -m "feat: add KeyboardToolbar with date/time/mic buttons"
```

---

## Task 16: VoiceInput コンポーネント

**Files:**
- Create: `src/components/VoiceInput.tsx`

- [x] **Step 1: VoiceInput を実装する**

```typescript
// src/components/VoiceInput.tsx
import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native'

interface Props {
  visible: boolean
  onCancel: () => void
}

export function VoiceInput({ visible, onCancel }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>聞いています...</Text>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelLabel}>キャンセル</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: 280,
  },
  title: { fontSize: 18, marginBottom: 24 },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  cancelLabel: { fontSize: 15 },
})
```

- [x] **Step 2: コミットする**

```bash
git add src/components/VoiceInput.tsx
git commit -m "feat: add VoiceInput overlay component"
```

---

## Task 17: SettingsScreen + ArchiveScreen

**Files:**
- Create: `src/screens/SettingsScreen.tsx`

- [x] **Step 1: SettingsScreen (アーカイブ一覧含む) を実装する**

```typescript
// src/screens/SettingsScreen.tsx
import React, { useEffect, useState, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native'
import { getStorage } from '@/services/storage'
import type { Memo } from '@/types'

interface Props {
  onClose: () => void
}

export function SettingsScreen({ onClose }: Props) {
  const [archivedMemos, setArchivedMemos] = useState<Memo[]>([])
  const [showArchive, setShowArchive] = useState(false)
  const storage = getStorage()

  const loadArchived = useCallback(async () => {
    const archived = await storage.getArchived()
    setArchivedMemos(archived)
  }, [])

  useEffect(() => {
    if (showArchive) loadArchived()
  }, [showArchive])

  const handleRestore = async (id: string) => {
    await storage.restore(id)
    await loadArchived()
  }

  const handleDeletePermanently = (id: string) => {
    Alert.alert('完全削除', 'このメモを完全に削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          await storage.deletePermanently(id)
          await loadArchived()
        },
      },
    ])
  }

  if (showArchive) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowArchive(false)}>
            <Text style={styles.back}>戻る</Text>
          </TouchableOpacity>
          <Text style={styles.title}>アーカイブ</Text>
        </View>
        <FlatList
          data={archivedMemos}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <View style={styles.archiveItem}>
              <Text style={styles.archiveContent} numberOfLines={1}>
                {item.content}
              </Text>
              <View style={styles.archiveActions}>
                <TouchableOpacity onPress={() => handleRestore(item.id)}>
                  <Text style={styles.restoreButton}>復元</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onLongPress={() => handleDeletePermanently(item.id)}
                >
                  <Text style={styles.deleteButton}>長押しで削除</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>アーカイブはありません</Text>
          }
        />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.back}>閉じる</Text>
        </TouchableOpacity>
        <Text style={styles.title}>設定</Text>
      </View>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => setShowArchive(true)}
      >
        <Text style={styles.menuLabel}>アーカイブを見る</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  back: { fontSize: 16, color: '#007AFF', marginRight: 16 },
  title: { fontSize: 17, fontWeight: '600' },
  menuItem: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee' },
  menuLabel: { fontSize: 16 },
  archiveItem: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  archiveContent: { fontSize: 15, marginBottom: 8 },
  archiveActions: { flexDirection: 'row', gap: 16 },
  restoreButton: { fontSize: 14, color: '#007AFF' },
  deleteButton: { fontSize: 14, color: '#ccc' },
  empty: { padding: 32, textAlign: 'center', color: '#999' },
})
```

- [x] **Step 2: コミットする**

```bash
git add src/screens/SettingsScreen.tsx
git commit -m "feat: add SettingsScreen with archive management"
```

---

## Task 18: App.tsx — メイン画面の組み立て

**Files:**
- Modify: `App.tsx`

- [x] **Step 1: App.tsx を実装する**

```typescript
// App.tsx
import React, { useState, useRef, useCallback, useEffect, useColorScheme } from 'react'
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  SafeAreaView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  useColorScheme as useRNColorScheme,
} from 'react-native'
import { useMemos } from '@/hooks/useMemos'
import { useHaptics } from '@/hooks/useHaptics'
import { useVoice } from '@/hooks/useVoice'
import { useNotifications } from '@/hooks/useNotifications'
import { detectDate } from '@/services/notifications'
import * as Notifications from 'expo-notifications'
import { MemoList } from '@/components/MemoList'
import { SearchBar } from '@/components/SearchBar'
import { InputArea } from '@/components/InputArea'
import { KeyboardToolbar } from '@/components/KeyboardToolbar'
import { VoiceInput } from '@/components/VoiceInput'
import { NotifyPicker } from '@/components/NotifyPicker'
import { SettingsScreen } from '@/screens/SettingsScreen'
import type { UIState } from '@/types'
import type { NotifyTiming } from '@/services/notifications'

export default function App() {
  const [uiState, setUiState] = useState<UIState>({
    editingMemoId: null,
    searchQuery: '',
    showArchive: false,
    isListening: false,
  })
  const [inputContent, setInputContent] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [showNotifyPicker, setShowNotifyPicker] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const insertRef = useRef<((text: string) => void) | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const colorScheme = useRNColorScheme() // 'light' | 'dark' | null
  const isDark = colorScheme === 'dark'

  const {
    pinnedMemos,
    regularMemos,
    createMemo,
    updateMemo,
    togglePin,
    archiveMemo,
    searchMemos,
    setNotifyAt,
  } = useMemos()
  const { trigger } = useHaptics()
  const { schedule: scheduleNotification, cancel: cancelNotification } = useNotifications()

  // 現在編集中のメモに日付が含まれているか
  const detectedDate = detectDate(inputContent)
  const currentMemo = uiState.editingMemoId
    ? [...pinnedMemos, ...regularMemos].find((m) => m.id === uiState.editingMemoId)
    : null

  const voice = useVoice((text) => {
    if (insertRef.current) insertRef.current(text)
    setUiState((s) => ({ ...s, isListening: false }))
  })

  const handleSelectMemo = useCallback(
    (id: string) => {
      const memo = [...pinnedMemos, ...regularMemos].find((m) => m.id === id)
      if (!memo) return
      setInputContent(memo.content)
      setUiState((s) => ({ ...s, editingMemoId: id }))
    },
    [pinnedMemos, regularMemos]
  )

  // 通知タップ → 対象メモを editing モードで開く
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const memoId = response.notification.request.content.data?.memoId as string | undefined
      if (memoId) handleSelectMemo(memoId)
    })
    return () => subscription.remove()
  }, [handleSelectMemo])

  // 新規メモ: 最初のキー入力でIDを発行してストレージに保存（仕様: 入力開始と同時）
  const handleNewMemoFirstKeyPress = useCallback(async (text: string) => {
    const id = await createMemo(text)
    setUiState((s) => ({ ...s, editingMemoId: id }))
  }, [createMemo])

  // 500ms デバウンス保存（編集中の差分保存）
  const scheduleSave = useCallback((id: string, content: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      if (content.trim() !== '') {
        await updateMemo(id, content)
        await trigger('save')
      }
    }, 500)
  }, [updateMemo, trigger])

  // blur 時の即時保存
  const handleBlur = useCallback(async () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    const { editingMemoId } = uiState
    if (editingMemoId) {
      if (inputContent.trim() === '') {
        // 既存メモを空にして離脱 → 通知キャンセル後アーカイブ
        const memo = [...pinnedMemos, ...regularMemos].find((m) => m.id === editingMemoId)
        if (memo?.notifyAt) await cancelNotification(editingMemoId)
        await archiveMemo(editingMemoId)
      } else {
        await updateMemo(editingMemoId, inputContent)
        await trigger('save')
      }
    } else if (inputContent.trim() !== '') {
      await createMemo(inputContent)
      await trigger('save')
    }
    setInputContent('')
    setUiState((s) => ({ ...s, editingMemoId: null }))
  }, [uiState, inputContent, pinnedMemos, regularMemos])

  const handleSearch = useCallback(
    async (query: string) => {
      setUiState((s) => ({ ...s, searchQuery: query }))
      if (query.trim()) {
        const results = await searchMemos(query)
        setSearchResults(results)
      } else {
        setSearchResults([])
      }
    },
    [searchMemos]
  )

  const handleNotifySelect = async (timing: NotifyTiming | null) => {
    setShowNotifyPicker(false)
    if (!uiState.editingMemoId || !detectedDate) return
    if (timing === null) {
      await cancelNotification(uiState.editingMemoId)
      await setNotifyAt(uiState.editingMemoId, null)
    } else {
      const notifyAt = await scheduleNotification(
        uiState.editingMemoId, inputContent, detectedDate, timing
      )
      if (notifyAt) await setNotifyAt(uiState.editingMemoId, notifyAt)
    }
  }

  const handlePin = async () => {
    if (uiState.editingMemoId) {
      await togglePin(uiState.editingMemoId)
      await trigger('pin')
    }
  }

  const handleArchive = async () => {
    if (uiState.editingMemoId) {
      // 通知がスケジュール済みならキャンセルしてからアーカイブ
      if (currentMemo?.notifyAt) await cancelNotification(uiState.editingMemoId)
      await archiveMemo(uiState.editingMemoId)
      await trigger('archive')
      setInputContent('')
      setUiState((s) => ({ ...s, editingMemoId: null }))
      Keyboard.dismiss()
    }
  }

  const isEditing = uiState.editingMemoId !== null || inputContent.length > 0
  const isSearching = uiState.searchQuery.length > 0

  const displayedPinned = isSearching
    ? searchResults.filter((m) => m.isPinned)
    : pinnedMemos
  const displayedRegular = isSearching
    ? searchResults.filter((m) => !m.isPinned)
    : regularMemos

  const theme = {
    bg: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    border: isDark ? '#333' : '#eee',
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ヘッダー */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.logo, { color: theme.text }]}>閃筋</Text>
          <TouchableOpacity onPress={() => setShowSettings(true)}>
            <Text style={styles.settingsIcon}>設定</Text>
          </TouchableOpacity>
        </View>

        {/* 入力エリア */}
        <InputArea
          content={inputContent}
          onChange={(text) => {
            setInputContent(text)
            if (uiState.editingMemoId) {
              scheduleSave(uiState.editingMemoId, text)
            } else if (text.length === 1) {
              // 新規メモ: 最初の1文字でIDを発行
              handleNewMemoFirstKeyPress(text)
            }
          }}
          onBlur={handleBlur}
          autoFocus={true}
          insertRef={insertRef}
        />

        {/* 編集モード時のアクションバー */}
        {isEditing && (
          <View style={styles.actionBar}>
            <TouchableOpacity onPress={handlePin}>
              <Text style={styles.action}>ピン</Text>
            </TouchableOpacity>
            {detectedDate && (
              <TouchableOpacity onPress={() => setShowNotifyPicker(true)}>
                <Text style={styles.action}>通知</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleArchive}>
              <Text style={[styles.action, styles.archiveAction]}>アーカイブ</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 検索バー */}
        <SearchBar value={uiState.searchQuery} onChange={handleSearch} />

        {/* メモリスト */}
        <MemoList
          pinnedMemos={displayedPinned}
          regularMemos={displayedRegular}
          onSelectMemo={handleSelectMemo}
        />

        {/* FABボタン */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setInputContent('')}
        >
          <Text style={styles.fabLabel}>+</Text>
        </TouchableOpacity>

        {/* キーボードツールバー */}
        <KeyboardToolbar
          onInsert={(text) => insertRef.current?.(text)}
          onMic={() => {
            setUiState((s) => ({ ...s, isListening: true }))
            voice.startListening()
          }}
        />

        {/* 音声入力オーバーレイ */}
        <VoiceInput
          visible={uiState.isListening}
          onCancel={() => {
            voice.stopListening()
            setUiState((s) => ({ ...s, isListening: false }))
          }}
        />

        {/* 設定モーダル */}
        <Modal visible={showSettings} animationType="slide">
          <SettingsScreen onClose={() => setShowSettings(false)} />
        </Modal>

        {/* 通知タイミング選択 */}
        <NotifyPicker
          visible={showNotifyPicker}
          hasExisting={!!currentMemo?.notifyAt}
          onSelect={handleNotifySelect}
          onDismiss={() => setShowNotifyPicker(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  logo: { fontSize: 18, fontWeight: '700' },
  settingsIcon: { fontSize: 14, color: '#007AFF' },
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  action: { fontSize: 14, color: '#007AFF' },
  archiveAction: { color: '#FF3B30' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabLabel: { color: '#fff', fontSize: 28, lineHeight: 32 },
})
```

- [x] **Step 2: アプリが起動することを確認する（Web）**

```bash
docker compose run --rm app npx expo start --web --no-dev --minify
```

ブラウザで `http://localhost:19006` を開き、入力エリアが表示されることを確認する。

- [x] **Step 3: コミットする**

```bash
git add App.tsx
git commit -m "feat: assemble main screen with full state machine"
```

---

## Task 19: PWA 設定

**Files:**
- Create: `web/manifest.json`
- Modify: `app.json`

- [x] **Step 1: app.json に web 設定を追加する**

`app.json` の `expo` オブジェクトに以下を追加する：

```json
"web": {
  "bundler": "metro",
  "output": "static",
  "favicon": "./assets/favicon.png",
  "name": "閃筋",
  "shortName": "閃筋",
  "description": "一瞬のひらめきを最速で書き留めるメモアプリ",
  "themeColor": "#007AFF",
  "backgroundColor": "#ffffff"
}
```

- [x] **Step 2: web/manifest.json を作成する**

```json
{
  "name": "閃筋 - Hiramekin",
  "short_name": "閃筋",
  "description": "一瞬のひらめきを最速で書き留めるメモアプリ",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#007AFF",
  "icons": [
    {
      "src": "assets/icon.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "assets/icon.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

- [x] **Step 3: PWA としてインストール可能なことを確認する**

Chrome で `http://localhost:19006` を開き、アドレスバーのインストールアイコンが表示されることを確認する。

- [x] **Step 4: コミットする**

```bash
git add app.json web/
git commit -m "feat: configure PWA manifest for desktop install"
```

---

## Task 20: Supabase スキーマファイル

**Files:**
- Create: `schema.sql`

- [x] **Step 1: schema.sql を作成する（v1では実行しない、定義のみ）**

```sql
-- schema.sql
-- Supabase スキーマ定義 (v1 では使用しない)
-- v2 の同期機能実装時にこのスキーマを Supabase に適用する

create table memos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  content text not null,
  is_pinned boolean default false,
  is_archived boolean default false,
  notify_at timestamptz default null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index memos_user_id_idx on memos(user_id);
create index memos_updated_at_idx on memos(updated_at desc);
```

- [x] **Step 2: コミットする**

```bash
git add schema.sql native/.gitkeep
git commit -m "docs: add Supabase schema and native widget placeholder"
```

---

## Task 21: 全テスト実行 + 最終確認

- [x] **Step 1: 全テストを実行する**

```bash
docker compose run --rm test npx jest --no-coverage
```

Expected: 全テスト PASS。失敗があれば該当タスクに戻って修正する。

- [x] **Step 2: Web でアプリの動作を確認する（ゴールデンパス）**

以下の操作が正しく動作することを確認する：
1. アプリ起動 → 入力エリアにカーソルが当たっている
2. テキスト入力 → 入力エリア外タップ → メモ一覧に表示される
3. `100 + 200` と入力 → `300` がオーバーレイ表示される
4. 結果をタップ → 数式が消えて結果のみになる（再タップで戻る）
5. 「今日」ボタン → 今日の日付が挿入される
6. メモをタップ → 編集モードに入る
7. ピンボタン → ピン留めセクションに移動する
8. アーカイブボタン → メモが一覧から消える
9. 設定 → アーカイブを見る → 復元できる
10. 検索バーにキーワード入力 → リアルタイムフィルタリングされる
11. `2026/06/01 発表` と入力 → 「通知」ボタンが現れる → タップ → タイミング選択 → 通知がスケジュールされる（モバイルで確認）

- [x] **Step 3: 最終コミット**

```bash
git add -A
git commit -m "chore: v1 implementation complete"
```

---

## 実装順序サマリー

```
Task 1  プロジェクト初期化
Task 2  型定義
Task 3  日付ユーティリティ
Task 4  計算エンジン
Task 5  ストレージ層
Task 6  useMemos
Task 7  useCalc
Task 8  useHaptics
Task 9  useVoice
Task 10 通知サービス + useNotifications + NotifyPicker
Task 11 MemoItem
Task 12 MemoList
Task 13 SearchBar
Task 14 CalcLine + InputArea
Task 15 KeyboardToolbar
Task 16 VoiceInput
Task 17 SettingsScreen
Task 18 App.tsx 組み立て
Task 19 PWA設定
Task 20 Supabaseスキーマ
Task 21 最終確認
```

---

## 2026-05-22 最終確認メモ

- Docker内で `npm run typecheck`、全Jest、`expo export --platform web` を実行し、すべて成功。
- Web/PWAはChromiumの `Page.getInstallabilityErrors` で installability error なしを確認。
- Android/iOSは `expo prebuild --no-install` でネイティブ設定を同期済み。
- Androidは `AndroidManifest.xml` に `RECORD_AUDIO` が反映済み。DockerfileにJDK 17 / Android SDK / NDKを追加し、`./gradlew assembleDebug --no-daemon --max-workers=1` でDebug APKビルド成功。ADBで接続端末が見えないため、実機での音声入力・通知操作確認は未実施。
- Android release APK は `./gradlew assembleRelease --no-daemon --max-workers=1` でビルド成功。`public/download.html` と GitHub Releases の `v1.0.0-beta` アセットを使う直接配布方針に更新。
- iOSは `Info.plist` に `NSMicrophoneUsageDescription` と `NSSpeechRecognitionUsageDescription` が反映済み。Windows環境のためiOS実機ビルド確認は未実施。
- `.superpowers/` はブレスト用一時成果物としてリポジトリ対象外にし、`.gitignore` に追加。
