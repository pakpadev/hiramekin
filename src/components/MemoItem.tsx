import { useEffect, useRef, useState } from 'react'
import {
  Animated,
  PanResponder,
  Platform,
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

const ARCHIVE_ACTION_WIDTH = 112
const OPEN_THRESHOLD = 40

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
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { width } = useWindowDimensions()
  const translateX = useRef(new Animated.Value(0)).current
  const translateXRef = useRef(0)
  const archiveOpenRef = useRef(false)
  const pointerActiveRef = useRef(false)
  const pointerStartXRef = useRef(0)
  const dragMovedRef = useRef(false)
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isDesktop = width >= 768
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderGrant: () => {
        dragMovedRef.current = false
      },
      onPanResponderMove: (_, gesture) => {
        updateDragValue(
          (archiveOpenRef.current ? -ARCHIVE_ACTION_WIDTH : 0) + gesture.dx,
        )
      },
      onPanResponderRelease: (_, gesture) => {
        finishDrag(gesture.dx)
      },
      onPanResponderTerminate: () => {
        animateArchive(archiveOpenRef.current)
      },
    }),
  ).current

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    }
  }, [])

  useEffect(() => {
    archiveOpenRef.current = isArchiveOpen
  }, [isArchiveOpen])

  async function handleCopy() {
    await Clipboard.setStringAsync(memo.content)
    setCopied(true)
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    copyTimerRef.current = setTimeout(() => setCopied(false), 1100)
  }

  function handleArchive() {
    animateArchive(false)
    onArchive(memo.id)
  }

  function updateDragValue(rawX: number) {
    const nextX = Math.max(-ARCHIVE_ACTION_WIDTH, Math.min(0, rawX))
    translateXRef.current = nextX
    dragMovedRef.current = Math.abs(nextX) > 4
    translateX.setValue(nextX)
  }

  function animateArchive(open: boolean) {
    const toValue = open ? -ARCHIVE_ACTION_WIDTH : 0

    setIsArchiveOpen(open)
    archiveOpenRef.current = open
    translateXRef.current = toValue
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      tension: 90,
      friction: 12,
    }).start()
  }

  function finishDrag(deltaX: number) {
    const open =
      deltaX < -OPEN_THRESHOLD || translateXRef.current < -OPEN_THRESHOLD

    animateArchive(open)
    setTimeout(() => {
      dragMovedRef.current = false
    }, 0)
  }

  function handlePointerDown(event: any) {
    if (event.nativeEvent.button != null && event.nativeEvent.button !== 0) return

    pointerActiveRef.current = true
    pointerStartXRef.current = event.nativeEvent.pageX
    dragMovedRef.current = false
  }

  function handlePointerMove(event: any) {
    if (!pointerActiveRef.current) return

    const deltaX = event.nativeEvent.pageX - pointerStartXRef.current
    const baseX = isArchiveOpen ? -ARCHIVE_ACTION_WIDTH : 0
    updateDragValue(baseX + deltaX)
  }

  function handlePointerEnd(event: any) {
    if (!pointerActiveRef.current) return

    pointerActiveRef.current = false
    finishDrag(event.nativeEvent.pageX - pointerStartXRef.current)
  }

  const desktopHoverHandlers =
    Platform.OS === 'web'
      ? {
          onMouseEnter: () => setIsHovered(true),
          onMouseLeave: () => setIsHovered(false),
        }
      : {}
  const dragHandlers =
    Platform.OS === 'web'
      ? {
          onPointerDown: handlePointerDown,
          onPointerMove: handlePointerMove,
          onPointerUp: handlePointerEnd,
          onPointerCancel: handlePointerEnd,
        }
      : panResponder.panHandlers

  return (
    <View
      style={styles.clip}
      {...(desktopHoverHandlers as any)}
    >
      <View
        style={[
          styles.archivePane,
          { backgroundColor: theme.danger, borderColor: theme.danger },
        ]}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="アーカイブ"
          testID="archive-confirm-btn"
          style={styles.archiveAction}
          onPress={handleArchive}
        >
          <Ionicons name="archive-outline" size={20} color="#ffffff" />
          <Text style={styles.archiveText}>アーカイブ</Text>
        </TouchableOpacity>
      </View>
      <Animated.View
        {...(dragHandlers as any)}
        style={[
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.container}
            onPress={() => {
              if (dragMovedRef.current) return
              if (isArchiveOpen) {
                animateArchive(false)
                return
              }
              onPress(memo.id)
            }}
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
            {isDesktop && !isArchiveOpen ? (
              <Text
                style={[
                  styles.dragHint,
                  {
                    color: theme.textMuted,
                    opacity: isHovered ? 0.75 : 0.35,
                  },
                ]}
              >
                ←
              </Text>
            ) : null}
          </TouchableOpacity>
        </View>
      </Animated.View>
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
    height: '100%',
    justifyContent: 'center',
    minHeight: 56,
    width: ARCHIVE_ACTION_WIDTH,
  },
  archivePane: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'flex-end',
    borderRadius: 8,
    borderWidth: 1,
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
  dragHint: {
    fontSize: 14,
    fontWeight: '700',
    paddingRight: 6,
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
