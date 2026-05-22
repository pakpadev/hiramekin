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
      <TouchableOpacity
        style={[
          styles.row,
          {
            backgroundColor: isDark
              ? 'rgba(0,229,255,0.07)'
              : 'rgba(0,172,193,0.08)',
            borderLeftColor: theme.accent,
          },
        ]}
        onPress={onToggle}
      >
        <Text style={[styles.collapsedResult, { color: theme.accent }]}>
          {result}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: isDark
            ? 'rgba(0,229,255,0.07)'
            : 'rgba(0,172,193,0.08)',
          borderLeftColor: theme.accent,
        },
      ]}
    >
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
    borderLeftWidth: 2,
    borderRadius: 6,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
})
