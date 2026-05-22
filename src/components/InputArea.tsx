import { MutableRefObject, useMemo, useRef, useState } from 'react'
import { NativeSyntheticEvent, Platform, StyleSheet, TextInput, TextInputContentSizeChangeEventData, View, useWindowDimensions } from 'react-native'
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
  const [contentHeight, setContentHeight] = useState(0)
  const { height: screenHeight } = useWindowDimensions()
  const lines = useMemo(() => content.split('\n'), [content])
  const { getLineResult, toggleCollapse, isCollapsed } = useCalc(content)
  const hasCalculations = lines.some((_, index) => getLineResult(index))
  const theme = getTheme(isDark)

  const minInputHeight = 96 // 4 lines * lineHeight 24
  const maxInputHeight = screenHeight * 0.5
  const scrollEnabled = contentHeight > maxInputHeight
  const inputHeight = scrollEnabled
    ? maxInputHeight
    : Math.max(contentHeight, minInputHeight)

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
            style={[styles.input, { color: theme.textPrimary, height: inputHeight }, webInputStyle]}
            value={content}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder="メモを書く　　100+200 で計算できます"
            placeholderTextColor={theme.textMuted}
            onSelectionChange={(event) => {
              selectionRef.current = event.nativeEvent.selection
            }}
            onContentSizeChange={(e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => setContentHeight(e.nativeEvent.contentSize.height)}
            multiline
            autoFocus={autoFocus}
            textAlignVertical="top"
            scrollEnabled={scrollEnabled}
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
