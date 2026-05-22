import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { Memo } from '@/types'

interface MemoItemProps {
  memo: Memo
  onPress: (id: string) => void
  isDark?: boolean
}

export function MemoItem({ memo, onPress, isDark = false }: MemoItemProps) {
  const preview = memo.content.split('\n')[0] || ''

  return (
    <TouchableOpacity
      accessibilityRole="button"
      style={[
        styles.container,
        { borderBottomColor: isDark ? '#303030' : '#ddd' },
      ]}
      onPress={() => onPress(memo.id)}
    >
      <Text
        style={[styles.content, { color: isDark ? '#f2f2f2' : '#111' }]}
        numberOfLines={1}
      >
        {preview}
      </Text>
      <View style={styles.meta}>
        {memo.isPinned ? (
          <Text
            testID="pin-icon"
            style={[styles.pin, { color: isDark ? '#aaa' : '#666' }]}
          >
            固定
          </Text>
        ) : null}
        <Text style={[styles.time, { color: isDark ? '#9a9a9a' : '#777' }]}>
          {formatTimestamp(memo.updatedAt)}
        </Text>
      </View>
    </TouchableOpacity>
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
    borderBottomColor: '#ddd',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    color: '#666',
    fontSize: 12,
  },
  time: {
    color: '#777',
    fontSize: 12,
  },
})
