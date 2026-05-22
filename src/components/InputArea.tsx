import { MutableRefObject, useMemo, useRef } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'
import { useCalc } from '@/hooks/useCalc'
import { CalcLine } from './CalcLine'

interface InputAreaProps {
  content: string
  onChange: (text: string) => void
  onBlur: () => void
  autoFocus: boolean
  insertRef?: MutableRefObject<((text: string) => void) | null>
}

export function InputArea({
  content,
  onChange,
  onBlur,
  autoFocus,
  insertRef,
}: InputAreaProps) {
  const inputRef = useRef<TextInput>(null)
  const selectionRef = useRef({ start: 0, end: 0 })
  const lines = useMemo(() => content.split('\n'), [content])
  const { getLineResult, toggleCollapse, isCollapsed } = useCalc(content)
  const hasCalculations = lines.some((_, index) => getLineResult(index))

  if (insertRef) {
    insertRef.current = (text: string) => {
      const { start, end } = selectionRef.current
      const next = content.slice(0, start) + text + content.slice(end)
      const cursor = start + text.length

      onChange(next)
      selectionRef.current = { start: cursor, end: cursor }
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
              />
            )
          })}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  calcLines: {
    gap: 2,
    marginTop: 6,
  },
  container: {
    padding: 12,
  },
  input: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 40,
  },
})
