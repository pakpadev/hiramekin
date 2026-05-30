import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native'
import { InputArea } from '@/components/InputArea'
import { KeyboardToolbar } from '@/components/KeyboardToolbar'
import { VoiceInput } from '@/components/VoiceInput'
import { useVoice } from '@/hooks/useVoice'
import { getStorage } from '@/services/storage'
import { getTheme } from '@/theme'
import type { Memo } from '@/types'
import { generateId } from '@/utils/uuid'

const OVERLAY_OPACITY_KEY = 'hiramekin-overlay-opacity'
const DEFAULT_OVERLAY_OPACITY = 88

export function OverlayApp() {
  const [content, setContent] = useState('')
  const [memoId, setMemoId] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [opacity, setOpacity] = useState(DEFAULT_OVERLAY_OPACITY)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const memoIdRef = useRef<string | null>(null)
  const createdAtRef = useRef<number | null>(null)
  const insertRef = useRef<((text: string) => void) | null>(null)
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  const theme = getTheme(isDark)

  const voice = useVoice((text) => {
    insertRef.current?.(text)
    setIsListening(false)
  })

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return

    const html = document.documentElement
    const body = document.body
    const root = document.getElementById('root')
    const previousHtmlBackground = html.style.background
    const previousBodyBackground = body.style.background
    const previousRootBackground = root?.style.background

    html.style.background = 'transparent'
    body.style.background = 'transparent'
    if (root) root.style.background = 'transparent'

    return () => {
      html.style.background = previousHtmlBackground
      body.style.background = previousBodyBackground
      if (root && previousRootBackground !== undefined) {
        root.style.background = previousRootBackground
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) return

    const storedValue = window.localStorage.getItem(OVERLAY_OPACITY_KEY)
    if (storedValue === null) return

    const storedOpacity = Number(storedValue)

    if (Number.isFinite(storedOpacity)) {
      setOpacity(Math.min(100, Math.max(0, storedOpacity)))
    }
  }, [])

  useEffect(() => {
    memoIdRef.current = memoId
  }, [memoId])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  const persistContent = useCallback(async (
    text: string,
    { adoptSavedMemo = true }: { adoptSavedMemo?: boolean } = {},
  ) => {
    const trimmed = text.trim()
    if (!trimmed) return

    const now = Date.now()
    const existingMemoId = memoIdRef.current
    const createdAt = createdAtRef.current ?? now

    if (existingMemoId) {
      const memo: Memo = {
        id: existingMemoId,
        content: text,
        isPinned: false,
        isArchived: false,
        notifyAt: null,
        createdAt,
        updatedAt: now,
      }

      await getStorage().save(memo)
      return
    }

    const memo: Memo = {
      id: generateId(),
      content: text,
      isPinned: false,
      isArchived: false,
      notifyAt: null,
      createdAt: now,
      updatedAt: now,
    }

    await getStorage().save(memo)
    if (adoptSavedMemo) {
      memoIdRef.current = memo.id
      createdAtRef.current = memo.createdAt
      setMemoId(memo.id)
    }
  }, [])

  const scheduleSave = useCallback(
    (text: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

      saveTimerRef.current = setTimeout(() => {
        persistContent(text).catch((error) => {
          console.error('Overlay memo save failed:', error)
        })
      }, 350)
    },
    [persistContent],
  )

  const handleInputChange = useCallback(
    (text: string) => {
      setContent(text)
      scheduleSave(text)
    },
    [scheduleSave],
  )

  const handleBlur = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    persistContent(content).catch((error) => {
      console.error('Overlay memo save failed:', error)
    })
  }, [content, persistContent])

  const handleNewMemo = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    persistContent(content, { adoptSavedMemo: false }).catch((error) => {
      console.error('Overlay memo save failed:', error)
    })
    setContent('')
    setMemoId(null)
    memoIdRef.current = null
    createdAtRef.current = null
  }, [content, persistContent])

  const handleOpacityChange = (value: number) => {
    const nextOpacity = Math.min(100, Math.max(0, Math.round(value)))

    setOpacity(nextOpacity)
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(OVERLAY_OPACITY_KEY, String(nextOpacity))
    }
  }

  const alpha = opacity / 100
  const panelColor = isDark
    ? `rgba(17,17,17,${alpha})`
    : `rgba(255,255,255,${alpha})`
  const surfaceColor = isDark
    ? `rgba(24,24,27,${alpha})`
    : `rgba(255,255,255,${alpha})`

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: panelColor,
        },
      ]}
    >
      <View style={[styles.opacityBar, { borderBottomColor: theme.border }]}>
        <Text style={[styles.opacityLabel, { color: theme.textBody }]}>
          透明度 {opacity}%
        </Text>
        {Platform.OS === 'web' ? (
          <input
            aria-label="オーバーレイ透明度"
            min={0}
            max={100}
            value={opacity}
            type="range"
            onChange={(event) =>
              handleOpacityChange(Number(event.currentTarget.value))
            }
            style={styles.opacitySlider as any}
          />
        ) : null}
        <TouchableOpacity
          accessibilityRole="button"
          style={[
            styles.newButton,
            {
              backgroundColor: theme.accent,
            },
          ]}
          onPress={handleNewMemo}
        >
          <Text style={styles.newButtonText}>新規</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputWrap}>
        <InputArea
          content={content}
          onChange={handleInputChange}
          onBlur={handleBlur}
          autoFocus={true}
          insertRef={insertRef}
          isDark={isDark}
          surfaceColor={surfaceColor}
        />
      </View>

      <KeyboardToolbar
        onInsert={(text) => insertRef.current?.(text)}
        onMic={() => {
          setIsListening(true)
          voice.startListening()
        }}
        forceShowMic={true}
        isDark={isDark}
        backgroundColor={panelColor}
        buttonBackgroundColor={surfaceColor}
      />

      <VoiceInput
        visible={isListening || voice.isListening}
        onCancel={() => {
          voice.stopListening()
          setIsListening(false)
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    flex: 1,
    overflow: 'hidden',
  },
  inputWrap: {
    flex: 1,
  },
  opacityBar: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  opacityLabel: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 72,
  },
  opacitySlider: {
    flex: 1,
    width: '100%',
  },
  newButton: {
    alignItems: 'center',
    borderRadius: 6,
    justifyContent: 'center',
    minHeight: 32,
    minWidth: 48,
    paddingHorizontal: 10,
  },
  newButtonText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
})
