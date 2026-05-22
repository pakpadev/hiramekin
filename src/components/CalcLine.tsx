import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface CalcLineProps {
  line: string
  result: string | null
  isCollapsed: boolean
  onToggle: () => void
}

export function CalcLine({
  line,
  result,
  isCollapsed,
  onToggle,
}: CalcLineProps) {
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
  collapsedResult: {
    color: '#007AFF',
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    lineHeight: 24,
  },
  expression: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
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
