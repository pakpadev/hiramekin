import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { getTheme } from '@/theme'
import type { Memo } from '@/types'
import { ShimmerBorder } from './ShimmerBorder'

interface MemoItemProps {
  memo: Memo
  onPress: (id: string) => void
  isDark?: boolean
  index?: number
}

export function MemoItem({
  memo,
  onPress,
  isDark = false,
  index = 0,
}: MemoItemProps) {
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
            <Text
              testID="pin-icon"
              style={[styles.pin, { color: theme.accent }]}
            >
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
