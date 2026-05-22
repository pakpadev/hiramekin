import { useRef, useState } from 'react'
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { getTheme } from '@/theme'
import type { Memo } from '@/types'

interface MemoItemProps {
  memo: Memo
  onPress: (id: string) => void
  onPin: (id: string) => void
  onArchive: (id: string) => void
  isDark?: boolean
}

export function MemoItem({
  memo,
  onPress,
  onPin,
  onArchive,
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
          <Text style={[styles.time, { color: theme.textMuted }]}>
            {formatTimestamp(memo.updatedAt)}
          </Text>
          <TouchableOpacity
            testID="pin-btn"
            onPress={() => onPin(memo.id)}
            accessibilityLabel={memo.isPinned ? 'ピン解除' : 'ピン留め'}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.actionIcon, { color: memo.isPinned ? theme.accent : theme.textMuted }]}>
              ◆
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="archive-btn"
            onPress={() => onArchive(memo.id)}
            accessibilityLabel="アーカイブ"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.actionIcon, { color: theme.textMuted }]}>
              ↓
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="copy-btn"
            onPress={handleCopy}
            accessibilityLabel="コピー"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.actionIcon, { color: theme.accent }]}>
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
  actionIcon: {
    fontSize: 14,
  },
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
  time: {
    fontSize: 12,
  },
})
