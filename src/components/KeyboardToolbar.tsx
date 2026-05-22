import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { formatTime, formatToday } from '@/utils/dateTime'

interface KeyboardToolbarProps {
  onInsert: (text: string) => void
  onMic: () => void
}

export function KeyboardToolbar({ onInsert, onMic }: KeyboardToolbarProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => onInsert(formatToday())}
      >
        <Text style={styles.label}>今日</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => onInsert(formatTime())}
      >
        <Text style={styles.label}>時刻</Text>
      </TouchableOpacity>
      <TouchableOpacity
        testID="mic-button"
        style={styles.button}
        onPress={onMic}
      >
        <Text style={styles.label}>マイク</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    marginRight: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  container: {
    backgroundColor: '#f5f5f5',
    borderTopColor: '#ccc',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
  },
})
