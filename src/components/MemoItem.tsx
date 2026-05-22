import { useRef, useState } from 'react'
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { getTheme } from '@/theme'
import type { Memo } from '@/types'

interface MemoItemProps {
  memo: Memo
  onPress: (id: string) => void
  isDark?: boolean
}

export function MemoItem({
  memo,
  onPress,
  isDark = false,
}: MemoItemProps) {
  const preview = memo.content.split('\n')[0] || ''
  const theme = getTheme(isDark)
  const [copied, setCopied] = useState(false)
  const fadeAnim = useRef(new Animated.Value(0)).current

  async function handleCopy() {
    await Clipboard.setStringAsync(memo.content)
    setCopied(true)
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.delay(800),
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
    ]).start(() => setCopied(false))
  }

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
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
          <TouchableOpacity
            testID="copy-btn"
            onPress={handleCopy}
            accessibilityLabel="コピー"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.copyIcon, { color: theme.accent }]}>
              {copied ? '✓' : '⧉'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
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
  card: {
    borderRadius: 8,
    borderWidth: 1,
  },
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
  copyIcon: {
    fontSize: 14,
  },
  pin: {
    fontSize: 11,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
  },
})
