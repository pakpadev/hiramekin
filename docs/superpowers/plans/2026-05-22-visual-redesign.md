# Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply a monochrome + cyan shimmer theme to all app components and redesign download.html for non-technical users.

**Architecture:** Centralise colour tokens in `src/theme.ts`, build a reusable `ShimmerBorder` component using `expo-linear-gradient` + `Animated`, then update each component to consume the tokens. Download page is a standalone HTML rewrite with CSS shimmer animation.

**Tech Stack:** React Native / Expo, expo-linear-gradient (new), TypeScript, plain HTML/CSS

**Spec:** `docs/superpowers/specs/2026-05-22-visual-redesign.md`

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/theme.ts` | Create | Dark/light colour tokens + `getTheme(isDark)` |
| `src/components/ShimmerBorder.tsx` | Create | Reusable animated gradient border wrapper |
| `src/components/MemoItem.tsx` | Modify | Card style + ShimmerBorder, theme tokens |
| `src/components/MemoList.tsx` | Modify | Pass `index` to MemoItem, remove divider gap |
| `src/components/InputArea.tsx` | Modify | ShimmerBorder on input wrapper |
| `src/components/CalcLine.tsx` | Modify | Cyan accent colour |
| `src/components/KeyboardToolbar.tsx` | Modify | Cyan active chips, dark toolbar |
| `src/components/SearchBar.tsx` | Modify | Dark theme tokens |
| `App.tsx` | Modify | `getTheme()`, FAB cyan, remove hardcoded colours |
| `public/download.html` | Modify | Full rewrite — big button + FAQ |
| `dist/download.html` | Modify | Mirror of public/download.html |

---

## Task 1: Install expo-linear-gradient

**Files:**
- Modify: `package.json` (via npx expo install)

- [ ] **Step 1: Install the package**

```bash
npx expo install expo-linear-gradient
```

Expected output includes `+ expo-linear-gradient@...` with no errors.

- [ ] **Step 2: Verify types are available**

```bash
npx tsc --noEmit
```

Expected: no new errors. If `Cannot find module 'expo-linear-gradient'` appears, run `npm install` first.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add expo-linear-gradient"
```

---

## Task 2: Create theme.ts

**Files:**
- Create: `src/theme.ts`

- [ ] **Step 1: Write the theme file**

```typescript
// src/theme.ts
export interface Theme {
  background: string
  surface: string
  textPrimary: string
  textBody: string
  textMuted: string
  accent: string
  danger: string
  border: string
  shimmerColors: readonly [string, string, string, string]
}

const dark: Theme = {
  background: '#111111',
  surface: '#1a1a1a',
  textPrimary: '#ffffff',
  textBody: '#cccccc',
  textMuted: '#555555',
  accent: '#00e5ff',
  danger: '#ff4c4c',
  border: '#2a2a2a',
  shimmerColors: ['#111111', '#00e5ff', '#b2f0ff', '#111111'],
}

const light: Theme = {
  background: '#f5f5f5',
  surface: '#ffffff',
  textPrimary: '#111111',
  textBody: '#333333',
  textMuted: '#888888',
  accent: '#00acc1',
  danger: '#d32f2f',
  border: '#e0e0e0',
  shimmerColors: ['#f5f5f5', '#00acc1', '#80deea', '#f5f5f5'],
}

export function getTheme(isDark: boolean): Theme {
  return isDark ? dark : light
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/theme.ts
git commit -m "feat: add dark/light theme tokens"
```

---

## Task 3: Create ShimmerBorder component

**Files:**
- Create: `src/components/ShimmerBorder.tsx`

The shimmer is implemented by placing an animated `LinearGradient` behind the content. The outer view has `padding: 1.5` and `overflow: 'hidden'`; the gradient is `position: absolute` and translates from left to right repeatedly. The inner content view sits on top with the surface colour, making only the 1.5px padding gap visible as the animated border.

- [ ] **Step 1: Write the component**

```tsx
// src/components/ShimmerBorder.tsx
import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { getTheme } from '@/theme'

interface ShimmerBorderProps {
  children: React.ReactNode
  isDark?: boolean
  index?: number
  borderRadius?: number
}

const SHIMMER_WIDTH = 600
const DURATION = 2400
const DELAY_STEP = 600

export function ShimmerBorder({
  children,
  isDark = true,
  index = 0,
  borderRadius = 10,
}: ShimmerBorderProps) {
  const theme = getTheme(isDark)
  const translateX = useRef(new Animated.Value(-SHIMMER_WIDTH)).current

  useEffect(() => {
    const delay = (index % 4) * DELAY_STEP
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(translateX, {
          toValue: SHIMMER_WIDTH,
          duration: DURATION,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -SHIMMER_WIDTH,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    )
    animation.start()
    return () => animation.stop()
  }, [index, translateX])

  return (
    <View
      style={[
        styles.outer,
        {
          borderRadius,
          backgroundColor: theme.surface,
          padding: 1.5,
        },
      ]}
    >
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { transform: [{ translateX }] }]}
      >
        <LinearGradient
          colors={theme.shimmerColors}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ width: SHIMMER_WIDTH * 2, height: '100%' }}
        />
      </Animated.View>
      <View
        style={{
          borderRadius: borderRadius - 1.5,
          backgroundColor: theme.surface,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    overflow: 'hidden',
  },
})
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ShimmerBorder.tsx
git commit -m "feat: add ShimmerBorder animated gradient component"
```

---

## Task 4: Update App.tsx

**Files:**
- Modify: `App.tsx`

Remove the hardcoded `theme` object and replace with `getTheme()`. Update FAB to cyan. Update all `theme.background`, `theme.border`, `theme.text` references to the new token names. FAB text colour changes from `#fff` to `#000` (cyan background requires dark text for contrast).

- [ ] **Step 1: Update imports**

At the top of `App.tsx`, add the theme import:

```tsx
import { getTheme } from '@/theme'
```

- [ ] **Step 2: Replace the theme object (lines 259–263)**

Replace:
```tsx
const theme = {
  background: isDark ? '#111' : '#fff',
  border: isDark ? '#333' : '#eee',
  text: isDark ? '#fff' : '#111',
}
```

With:
```tsx
const theme = getTheme(isDark)
```

- [ ] **Step 3: Update JSX references to theme tokens**

Find and replace these four inline style usages in the JSX:

| Old | New |
|---|---|
| `{ backgroundColor: theme.background }` | `{ backgroundColor: theme.background }` (unchanged — token name matches) |
| `{ borderBottomColor: theme.border }` | `{ borderBottomColor: theme.border }` (unchanged) |
| `{ color: theme.text }` | `{ color: theme.textPrimary }` |
| `{ backgroundColor: theme.background }` in settingsOverlay | `{ backgroundColor: theme.background }` (unchanged) |

- [ ] **Step 4: Update StyleSheet for FAB and action colours**

In the `StyleSheet.create` at the bottom of `App.tsx`, the FAB and action colours are static. Move them to inline styles or update the static values as follows.

Replace the `fab` style:
```tsx
fab: {
  alignItems: 'center',
  borderRadius: 26,
  bottom: 80,
  elevation: 8,
  height: 52,
  justifyContent: 'center',
  position: 'absolute',
  right: 20,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.5,
  shadowRadius: 10,
  width: 52,
},
```

Replace `fabPlus`:
```tsx
fabPlus: {
  fontSize: 28,
  lineHeight: 32,
},
```

Replace `action`:
```tsx
action: {
  fontSize: 14,
},
```

Then in the JSX, apply colours inline:

```tsx
<TouchableOpacity
  accessibilityRole="button"
  style={[styles.fab, { backgroundColor: theme.accent, shadowColor: theme.accent }]}
  ...
>
  <Text style={[styles.fabPlus, { color: '#000' }]}>＋</Text>
</TouchableOpacity>
```

For action bar buttons:
```tsx
<Text style={[styles.action, { color: theme.accent }]}>ピン</Text>
<Text style={[styles.action, { color: theme.accent }]}>通知</Text>
<Text style={[styles.action, styles.archiveAction, { color: theme.danger }]}>アーカイブ</Text>
```

Remove the hardcoded `color` values from the `action` and `archiveAction` stylesheet entries.

For the settings button in the header:
```tsx
<Text style={[styles.settingsButton, { color: theme.accent }]}>設定</Text>
```

Remove the hardcoded `color: '#007AFF'` from `settingsButton` in the stylesheet.

- [ ] **Step 5: Verify the build**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add App.tsx
git commit -m "feat: apply theme tokens to App.tsx, update FAB to cyan"
```

---

## Task 5: Update CalcLine.tsx

**Files:**
- Modify: `src/components/CalcLine.tsx`

Replace hardcoded `#007AFF` with the `accent` token from `getTheme`.

- [ ] **Step 1: Update the component**

```tsx
// src/components/CalcLine.tsx
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { getTheme } from '@/theme'

interface CalcLineProps {
  line: string
  result: string | null
  isCollapsed: boolean
  onToggle: () => void
  isDark?: boolean
}

export function CalcLine({
  line,
  result,
  isCollapsed,
  onToggle,
  isDark = false,
}: CalcLineProps) {
  const theme = getTheme(isDark)

  if (!result) {
    return (
      <Text style={[styles.plainLine, { color: theme.textBody }]}>
        {line}
      </Text>
    )
  }

  if (isCollapsed) {
    return (
      <TouchableOpacity onPress={onToggle}>
        <Text style={[styles.collapsedResult, { color: theme.accent }]}>{result}</Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.row}>
      <Text
        style={[styles.expression, { color: theme.textBody }]}
        numberOfLines={1}
      >
        {line}
      </Text>
      <TouchableOpacity onPress={onToggle}>
        <Text style={[styles.result, { color: theme.accent }]}>{result}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  collapsedResult: {
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    lineHeight: 24,
  },
  expression: {
    fontSize: 16,
    lineHeight: 24,
    maxWidth: '80%',
  },
  plainLine: {
    fontSize: 16,
    lineHeight: 24,
  },
  result: {
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    lineHeight: 24,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
})
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/CalcLine.tsx
git commit -m "feat: apply cyan accent to CalcLine"
```

---

## Task 6: Update KeyboardToolbar.tsx

**Files:**
- Modify: `src/components/KeyboardToolbar.tsx`

Apply theme tokens. No visual change to the button shape; only colours change.

- [ ] **Step 1: Add theme import**

```tsx
import { getTheme } from '@/theme'
```

- [ ] **Step 2: Replace colour derivations**

In the component body, replace:
```tsx
const buttonStyle = [
  styles.button,
  { backgroundColor: isDark ? '#303030' : '#e0e0e0' },
]
const labelStyle = [styles.label, { color: isDark ? '#f2f2f2' : '#111' }]
```

With:
```tsx
const theme = getTheme(isDark)
const buttonStyle = [styles.button, { backgroundColor: theme.border }]
const labelStyle = [styles.label, { color: theme.textBody }]
```

- [ ] **Step 3: Update container and time menu colours**

Replace all inline colour expressions in the JSX:

```tsx
// container style — replace:
{ backgroundColor: isDark ? '#181818' : '#f5f5f5', borderTopColor: isDark ? '#303030' : '#ccc' }
// with:
{ backgroundColor: theme.background, borderTopColor: theme.border }

// timeMenu style — replace:
{ backgroundColor: isDark ? '#242424' : '#fff', borderColor: isDark ? '#3a3a3a' : '#d0d0d0' }
// with:
{ backgroundColor: theme.surface, borderColor: theme.border }
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/components/KeyboardToolbar.tsx
git commit -m "feat: apply theme tokens to KeyboardToolbar"
```

---

## Task 7: Update SearchBar.tsx

**Files:**
- Modify: `src/components/SearchBar.tsx`

- [ ] **Step 1: Add theme import and replace colour derivations**

```tsx
// src/components/SearchBar.tsx
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { getTheme } from '@/theme'

interface SearchBarProps {
  value: string
  onChange: (text: string) => void
  isDark?: boolean
}

export function SearchBar({ value, onChange, isDark = false }: SearchBarProps) {
  const theme = getTheme(isDark)

  return (
    <View
      style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      <TextInput
        style={[styles.input, { color: theme.textPrimary }, webInputStyle]}
        value={value}
        onChangeText={onChange}
        placeholder="検索"
        placeholderTextColor={theme.textMuted}
        returnKeyType="search"
      />
      {value.length > 0 ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="検索をクリア"
          testID="clear-button"
          onPress={() => onChange('')}
        >
          <Text style={[styles.clear, { color: theme.textMuted }]}>×</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    marginHorizontal: 12,
    marginVertical: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  clear: {
    fontSize: 16,
    paddingHorizontal: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
})

const webInputStyle = Platform.select({
  web: {
    outlineColor: 'transparent',
    outlineStyle: 'solid' as const,
    outlineWidth: 0,
  },
})
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/SearchBar.tsx
git commit -m "feat: apply theme tokens to SearchBar"
```

---

## Task 8: Update MemoItem.tsx and MemoList.tsx

**Files:**
- Modify: `src/components/MemoItem.tsx`
- Modify: `src/components/MemoList.tsx`

MemoItem changes from a flat row with a bottom divider to a card wrapped in `ShimmerBorder`. A new optional `index` prop controls the shimmer delay.

- [ ] **Step 1: Rewrite MemoItem**

```tsx
// src/components/MemoItem.tsx
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ShimmerBorder } from './ShimmerBorder'
import { getTheme } from '@/theme'
import type { Memo } from '@/types'

interface MemoItemProps {
  memo: Memo
  onPress: (id: string) => void
  isDark?: boolean
  index?: number
}

export function MemoItem({ memo, onPress, isDark = false, index = 0 }: MemoItemProps) {
  const preview = memo.content.split('\n')[0] || ''
  const theme = getTheme(isDark)

  return (
    <ShimmerBorder isDark={isDark} index={index} borderRadius={8}>
      <TouchableOpacity
        accessibilityRole="button"
        style={styles.container}
        onPress={() => onPress(memo.id)}
      >
        <Text
          style={[styles.content, { color: theme.textBody }]}
          numberOfLines={1}
        >
          {preview}
        </Text>
        <View style={styles.meta}>
          {memo.isPinned ? (
            <Text testID="pin-icon" style={[styles.pin, { color: theme.accent }]}>
              固定
            </Text>
          ) : null}
          <Text style={[styles.time, { color: theme.textMuted }]}>
            {formatTimestamp(memo.updatedAt)}
          </Text>
        </View>
      </TouchableOpacity>
    </ShimmerBorder>
  )
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  if (isToday) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`
  }

  return `${date.getMonth() + 1}/${date.getDate()}`
}

function pad(value: number): string {
  return value.toString().padStart(2, '0')
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  content: {
    flex: 1,
    fontSize: 15,
  },
  meta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  pin: {
    fontSize: 11,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
  },
})
```

- [ ] **Step 2: Update MemoList to pass index**

```tsx
// src/components/MemoList.tsx
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { MemoItem } from './MemoItem'
import { getTheme } from '@/theme'
import type { Memo } from '@/types'

interface MemoListProps {
  pinnedMemos: Memo[]
  regularMemos: Memo[]
  onSelectMemo: (id: string) => void
  isDark?: boolean
}

export function MemoList({
  pinnedMemos,
  regularMemos,
  onSelectMemo,
  isDark = false,
}: MemoListProps) {
  const theme = getTheme(isDark)
  const isEmpty = pinnedMemos.length === 0 && regularMemos.length === 0

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {pinnedMemos.length > 0 ? (
        <>
          <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>
            ピン留め
          </Text>
          <View style={styles.cardList}>
            {pinnedMemos.map((memo, i) => (
              <MemoItem
                key={memo.id}
                memo={memo}
                onPress={onSelectMemo}
                isDark={isDark}
                index={i}
              />
            ))}
          </View>
        </>
      ) : null}
      <View style={styles.cardList}>
        {regularMemos.map((memo, i) => (
          <MemoItem
            key={memo.id}
            memo={memo}
            onPress={onSelectMemo}
            isDark={isDark}
            index={pinnedMemos.length + i}
          />
        ))}
      </View>
      {isEmpty ? (
        <Text style={[styles.empty, { color: theme.textMuted }]}>
          メモはありません
        </Text>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  cardList: {
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  container: {
    flex: 1,
  },
  empty: {
    fontSize: 14,
    padding: 24,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 2,
  },
})
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/MemoItem.tsx src/components/MemoList.tsx
git commit -m "feat: convert MemoItem to card style with ShimmerBorder"
```

---

## Task 9: Update InputArea.tsx

**Files:**
- Modify: `src/components/InputArea.tsx`

Wrap the `TextInput` in `ShimmerBorder`. The existing container `padding: 12` moves to the inside content view.

- [ ] **Step 1: Update the component**

```tsx
// src/components/InputArea.tsx
import { MutableRefObject, useMemo, useRef } from 'react'
import { Platform, StyleSheet, TextInput, View } from 'react-native'
import { useCalc } from '@/hooks/useCalc'
import { getTheme } from '@/theme'
import { CalcLine } from './CalcLine'
import { ShimmerBorder } from './ShimmerBorder'

interface InputAreaProps {
  content: string
  onChange: (text: string) => void
  onBlur: () => void
  autoFocus: boolean
  insertRef?: MutableRefObject<((text: string) => void) | null>
  focusRef?: MutableRefObject<(() => void) | null>
  isDark?: boolean
}

export function InputArea({
  content,
  onChange,
  onBlur,
  autoFocus,
  insertRef,
  focusRef,
  isDark = false,
}: InputAreaProps) {
  const inputRef = useRef<TextInput>(null)
  const selectionRef = useRef({ start: 0, end: 0 })
  const lines = useMemo(() => content.split('\n'), [content])
  const { getLineResult, toggleCollapse, isCollapsed } = useCalc(content)
  const hasCalculations = lines.some((_, index) => getLineResult(index))
  const theme = getTheme(isDark)

  if (insertRef) {
    insertRef.current = (text: string) => {
      const { start, end } = selectionRef.current
      const next = content.slice(0, start) + text + content.slice(end)
      const cursor = start + text.length

      onChange(next)
      selectionRef.current = { start: cursor, end: cursor }
    }
  }

  if (focusRef) {
    focusRef.current = () => {
      inputRef.current?.focus()
    }
  }

  return (
    <View style={styles.wrapper}>
      <ShimmerBorder isDark={isDark} borderRadius={10}>
        <View style={styles.innerPad}>
          <TextInput
            ref={inputRef}
            testID="memo-input"
            style={[styles.input, { color: theme.textPrimary }, webInputStyle]}
            value={content}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="メモを書く　　100+200 で計算できます"
            placeholderTextColor={theme.textMuted}
            onSelectionChange={(event) => {
              selectionRef.current = event.nativeEvent.selection
            }}
            multiline
            autoFocus={autoFocus}
            textAlignVertical="top"
            scrollEnabled={false}
          />
          {hasCalculations ? (
            <View testID="calc-lines" style={styles.calcLines}>
              {lines.map((line, index) => {
                const result = getLineResult(index)

                if (!result) return null

                return (
                  <CalcLine
                    key={`${index}-${line}`}
                    line={line}
                    result={result}
                    isCollapsed={isCollapsed(index)}
                    onToggle={() => toggleCollapse(index)}
                    isDark={isDark}
                  />
                )
              })}
            </View>
          ) : null}
        </View>
      </ShimmerBorder>
    </View>
  )
}

const styles = StyleSheet.create({
  calcLines: {
    gap: 2,
    marginTop: 6,
  },
  innerPad: {
    padding: 12,
  },
  input: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 40,
    padding: 0,
  },
  wrapper: {
    marginHorizontal: 12,
    marginTop: 8,
  },
})

const webInputStyle = Platform.select({
  web: {
    outlineColor: 'transparent',
    outlineStyle: 'solid' as const,
    outlineWidth: 0,
  },
})
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Run existing tests to confirm nothing broke**

```bash
npx jest --testPathPattern="InputArea" --no-coverage
```

Expected: all pass. If snapshot tests fail, update snapshots:

```bash
npx jest --testPathPattern="InputArea" --updateSnapshot
```

- [ ] **Step 4: Commit**

```bash
git add src/components/InputArea.tsx
git commit -m "feat: wrap InputArea in ShimmerBorder"
```

---

## Task 10: Run full test suite

**Files:** none — verification step

- [ ] **Step 1: Run all tests**

```bash
npx jest --no-coverage
```

Expected: all pass. If component snapshot tests fail due to colour changes:

```bash
npx jest --updateSnapshot
```

Review each updated snapshot manually to confirm the change is intentional (colour values, not structural breakage).

- [ ] **Step 2: Commit updated snapshots**

```bash
git add __tests__
git commit -m "test: update snapshots for cyan theme"
```

---

## Task 11: Rewrite public/download.html

**Files:**
- Modify: `public/download.html`
- Modify: `dist/download.html`

Full rewrite. Keeps the same monochrome + cyan palette. The shimmer animation on the download button uses a CSS `@keyframes` approach (no JavaScript needed). Removes all technical jargon: no APK, no sideload, no SHA-256, no GitHub Issues link.

- [ ] **Step 1: Overwrite public/download.html**

```html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hiramekin — ダウンロード</title>
    <meta name="description" content="Hiramekin — Android 向けメモアプリの無料ダウンロード" />
    <link rel="icon" href="/icon.png" />
    <style>
      :root {
        --bg: #111111;
        --surface: #1a1a1a;
        --text: #ffffff;
        --body: #cccccc;
        --muted: #555555;
        --accent: #00e5ff;
        --border: #2a2a2a;
      }

      @keyframes shimmer {
        0%   { background-position: 100% 0; }
        100% { background-position: -100% 0; }
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        min-height: 100vh;
        background: var(--bg);
        color: var(--text);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1.65;
      }

      main {
        width: min(560px, calc(100% - 32px));
        margin: 0 auto;
        padding: 56px 0 72px;
      }

      /* --- Hero --- */
      .hero {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 10px;
        padding-bottom: 32px;
        border-bottom: 1px solid var(--border);
      }

      .app-icon {
        width: 80px;
        height: 80px;
        border-radius: 18px;
        box-shadow: 0 0 32px rgba(0, 229, 255, 0.2);
      }

      .app-name {
        font-size: 2rem;
        font-weight: 800;
        letter-spacing: -0.5px;
        margin: 0;
      }

      .version-tag {
        display: inline-block;
        background: rgba(0, 229, 255, 0.1);
        border: 1px solid rgba(0, 229, 255, 0.25);
        color: var(--accent);
        font-size: 0.82rem;
        font-weight: 600;
        padding: 3px 10px;
        border-radius: 20px;
      }

      /* --- Download button with shimmer --- */
      .dl-wrap {
        position: relative;
        border-radius: 10px;
        padding: 2px;
        background: linear-gradient(90deg, #111, #00e5ff, #b2f0ff, #111);
        background-size: 300% 100%;
        animation: shimmer 2.4s linear infinite;
        margin-top: 8px;
        width: 100%;
        max-width: 320px;
      }

      .dl-btn {
        display: block;
        background: var(--accent);
        color: #000;
        font-size: 1rem;
        font-weight: 800;
        text-align: center;
        padding: 14px;
        border-radius: 8px;
        text-decoration: none;
        transition: opacity 0.15s;
      }

      .dl-btn:hover { opacity: 0.88; }

      .dl-meta {
        font-size: 0.8rem;
        color: var(--muted);
        margin-top: 6px;
      }

      /* --- FAQ --- */
      .faq {
        margin-top: 36px;
      }

      .faq-title {
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--muted);
        margin-bottom: 14px;
      }

      .faq-item {
        padding: 14px 0;
        border-bottom: 1px solid var(--border);
      }

      .faq-item:first-of-type {
        border-top: 1px solid var(--border);
      }

      .faq-q {
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--text);
        margin: 0 0 6px;
      }

      .faq-a {
        font-size: 0.88rem;
        color: var(--body);
        margin: 0;
      }

      .faq-a strong {
        color: var(--accent);
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <img class="app-icon" src="/icon.png" alt="Hiramekin アイコン" />
        <h1 class="app-name">Hiramekin</h1>
        <span class="version-tag">v1.0.1 beta · Android</span>
        <div class="dl-wrap">
          <a
            class="dl-btn"
            href="https://github.com/pakpadev/hiramekin/releases/download/v1.0.1-beta/hiramekin-v1.0.1-beta.apk"
          >
            無料でダウンロード
          </a>
        </div>
        <p class="dl-meta">56 MB · Android 6.0 以上</p>
      </section>

      <section class="faq" aria-label="よくある質問">
        <p class="faq-title">よくある質問</p>

        <div class="faq-item">
          <p class="faq-q">「提供元不明のアプリ」と表示された — 大丈夫?</p>
          <p class="faq-a">
            Play Store 以外からインストールするアプリには<strong>必ず出る確認画面</strong>です。「この提供元を許可」または「許可」を選ぶと進められます。
          </p>
        </div>

        <div class="faq-item">
          <p class="faq-q">インストールできない</p>
          <p class="faq-a">
            設定 → セキュリティ →「不明なアプリのインストール」でお使いのブラウザを許可してください。
          </p>
        </div>

        <div class="faq-item">
          <p class="faq-q">Play Store にないの?</p>
          <p class="faq-a">
            現在ベータ版のため直接配布しています。正式版は Play Store での公開を予定しています。
          </p>
        </div>
      </section>
    </main>
  </body>
</html>
```

- [ ] **Step 2: Copy to dist/**

```bash
cp public/download.html dist/download.html
```

- [ ] **Step 3: Commit**

```bash
git add public/download.html dist/download.html
git commit -m "feat: rewrite download page with big button and FAQ for non-technical users"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Dark/light colour tokens | Task 2 |
| Shimmer gradient `#111 → #00e5ff → #b2f0ff → #111` | Tasks 2, 3 |
| Light shimmer `#f5f5f5 → #00acc1 → #80deea → #f5f5f5` | Tasks 2, 3 |
| FAB cyan + shadow | Task 4 |
| InputArea shimmer border | Task 9 |
| MemoItem card + shimmer | Task 8 |
| CalcLine cyan | Task 5 |
| KeyboardToolbar tokens | Task 6 |
| SearchBar tokens | Task 7 |
| download.html big button + FAQ | Task 11 |
| Remove APK/sideload/SHA-256 language | Task 11 |
| useColorScheme preserved | `isDark` prop flows through all components unchanged |

All spec requirements covered.
