import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

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
  if (!result) {
    return (
      <Text style={[styles.plainLine, { color: isDark ? '#f2f2f2' : '#111' }]}>
        {line}
      </Text>
    )
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
      <Text
        style={[styles.expression, { color: isDark ? '#f2f2f2' : '#111' }]}
        numberOfLines={1}
      >
        {line}
      </Text>
      <TouchableOpacity onPress={onToggle}>
        <Text style={styles.result}>{result}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  collapsedResult: {
    color: '#007AFF',
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
    color: '#007AFF',
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
