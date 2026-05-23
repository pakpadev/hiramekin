import { useEffect, useRef, useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { Ionicons } from '@expo/vector-icons'
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
  const { width } = useWindowDimensions()
  const scrollRef = useRef<ScrollView>(null)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cardWidth = Math.max(280, width - 24)

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    }
  }, [])

  async function handleCopy() {
    await Clipboard.setStringAsync(memo.content)
    setCopied(true)
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    copyTimerRef.current = setTimeout(() => setCopied(false), 1100)
  }

  function handleArchive() {
    scrollRef.current?.scrollTo({ x: 0, animated: true })
    onArchive(memo.id)
  }

  return (
    <View style={styles.clip}>
      <ScrollView
        ref={scrollRef}
        horizontal
        bounces={false}
        decelerationRate="fast"
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        snapToOffsets={[0, 92]}
        snapToEnd={false}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              width: cardWidth,
            },
          ]}
        >
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
                style={styles.iconButton}
              >
                <Ionicons
                  testID="pin-icon"
                  name={memo.isPinned ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={memo.isPinned ? theme.accent : theme.textMuted}
                />
              </TouchableOpacity>
              <TouchableOpacity
                testID="copy-btn"
                onPress={handleCopy}
                accessibilityLabel="コピー"
                style={styles.iconButton}
              >
                <Ionicons
                  name={copied ? 'checkmark' : 'copy-outline'}
                  size={20}
                  color={copied ? theme.accent : theme.textMuted}
                />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="アーカイブ"
          testID="archive-confirm-btn"
          style={[styles.archiveAction, { backgroundColor: theme.danger }]}
          onPress={handleArchive}
        >
          <Ionicons name="archive-outline" size={20} color="#ffffff" />
          <Text style={styles.archiveText}>アーカイブ</Text>
        </TouchableOpacity>
      </ScrollView>
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
  archiveAction: {
    alignItems: 'center',
    gap: 3,
    justifyContent: 'center',
    minHeight: 56,
    width: 92,
  },
  archiveText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    borderRadius: 8,
    borderWidth: 1,
  },
  clip: {
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 56,
    paddingLeft: 14,
    paddingRight: 4,
    paddingVertical: 6,
  },
  content: {
    flex: 1,
    fontSize: 15,
  },
  iconButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 40,
  },
  meta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  time: {
    fontSize: 12,
    marginRight: 2,
  },
})
