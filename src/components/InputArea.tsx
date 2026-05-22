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
