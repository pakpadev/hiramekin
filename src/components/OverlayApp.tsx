import { invoke } from '@tauri-apps/api/core'
import { useMemo, useState } from 'react'
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  useColorScheme,
  View,
} from 'react-native'
import { getStorage } from '@/services/storage'
import { getTheme } from '@/theme'
import type { Memo } from '@/types'
import { generateId } from '@/utils/uuid'

const OVERLAY_OPACITY_KEY = 'hiramekin-overlay-opacity'
const DEFAULT_OVERLAY_OPACITY = 0.88
const HOVER_OVERLAY_OPACITY = 0.95

export function OverlayApp() {
  const [content, setContent] = useState('')
  const [hovered, setHovered] = useState(false)
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const theme = getTheme(isDark)
  const configuredOpacity = useMemo(() => {
    if (typeof window === 'undefined' || !window.localStorage) {
      return DEFAULT_OVERLAY_OPACITY
    }

    const value = Number(window.localStorage.getItem(OVERLAY_OPACITY_KEY))

    return [0.8, 0.88, 0.95].includes(value) ? value : DEFAULT_OVERLAY_OPACITY
  }, [])
  const opacity = hovered
    ? HOVER_OVERLAY_OPACITY
    : configuredOpacity

  const handleSubmit = async () => {
    const trimmed = content.trim()
    if (!trimmed) return

    const now = Date.now()
    const memo: Memo = {
      id: generateId(),
      content: trimmed,
      isPinned: false,
      isArchived: false,
      notifyAt: null,
      createdAt: now,
      updatedAt: now,
    }

    await getStorage().save(memo)
    setContent('')
    await invoke('memo_submitted')
  }

  return (
    <View
      {...(Platform.OS === 'web'
        ? ({
            onMouseEnter: () => setHovered(true),
            onMouseLeave: () => setHovered(false),
          } as any)
        : {})}
      style={[
        styles.container,
        {
          backgroundColor: isDark
            ? `rgba(17,17,17,${opacity})`
            : `rgba(255,255,255,${opacity})`,
        },
      ]}
    >
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: isDark
              ? 'rgba(24,24,27,0.8)'
              : 'rgba(255,255,255,0.84)',
            borderColor: theme.border,
            borderStyle: 'solid',
            color: theme.textPrimary,
          },
          Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : null,
        ]}
        value={content}
        onChangeText={setContent}
        placeholder="ひらめきを入力..."
        placeholderTextColor={theme.textMuted}
        multiline
        autoFocus
        onSubmitEditing={handleSubmit}
      />
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.accent }]}
        onPress={handleSubmit}
        accessibilityRole="button"
        accessibilityLabel="メモを保存"
      >
        <Text style={styles.buttonText}>保存</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-end',
    borderRadius: 8,
    margin: 12,
    marginTop: 0,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
  container: {
    borderRadius: 12,
    flex: 1,
    margin: 4,
  },
  input: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    margin: 12,
    padding: 8,
    textAlignVertical: 'top',
  },
})
