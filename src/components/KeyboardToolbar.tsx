import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { formatTime, formatToday } from '@/utils/dateTime'

interface KeyboardToolbarProps {
  onInsert: (text: string) => void
  onMic: () => void
  isDark?: boolean
}

export function KeyboardToolbar({
  onInsert,
  onMic,
  isDark = false,
}: KeyboardToolbarProps) {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#181818' : '#f5f5f5',
          borderTopColor: isDark ? '#303030' : '#ccc',
        },
      ]}
    >
      <TouchableOpacity
        accessibilityRole="button"
        style={[
          styles.button,
          { backgroundColor: isDark ? '#303030' : '#e0e0e0' },
        ]}
        onPress={() => onInsert(formatToday())}
      >
        <Text style={[styles.label, { color: isDark ? '#f2f2f2' : '#111' }]}>
          今日
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        style={[
          styles.button,
          { backgroundColor: isDark ? '#303030' : '#e0e0e0' },
        ]}
        onPress={() => onInsert(formatTime())}
      >
        <Text style={[styles.label, { color: isDark ? '#f2f2f2' : '#111' }]}>
          時刻
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        testID="mic-button"
        style={[
          styles.button,
          { backgroundColor: isDark ? '#303030' : '#e0e0e0' },
        ]}
        onPress={onMic}
      >
        <Text style={[styles.label, { color: isDark ? '#f2f2f2' : '#111' }]}>
          マイク
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 6,
    marginRight: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
  },
})
