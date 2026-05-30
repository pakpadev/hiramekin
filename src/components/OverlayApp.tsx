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
import { isTauri } from '@/utils/tauri'
import { generateId } from '@/utils/uuid'
import { getCurrentWindow } from '@tauri-apps/api/window'

const OVERLAY_OPACITY_KEY = 'hiramekin-overlay-opacity'
const OVERLAY_NORMAL_OPACITY_KEY = 'hiramekin-overlay-normal-opacity'
const DEFAULT_NORMAL_OPACITY = 45
const HOVER_OPACITY = 75
const OPACITY_STEP = 5

function clampOpacity(value: number) {
  return Math.min(100, Math.max(0, Math.round(value / OPACITY_STEP) * OPACITY_STEP))
}

export function OverlayApp() {
  const [content, setContent] = useState('')
  const [memoId, setMemoId] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [normalOpacity, setNormalOpacity] = useState(DEFAULT_NORMAL_OPACITY)
  const [isHovered, setIsHovered] = useState(false)
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

    const legacyValue = window.localStorage.getItem(OVERLAY_OPACITY_KEY)
    const storedNormalValue =
      window.localStorage.getItem(OVERLAY_NORMAL_OPACITY_KEY) ?? legacyValue

    const storedNormalOpacity = Number(storedNormalValue)

    if (storedNormalValue !== null && Number.isFinite(storedNormalOpacity)) {
      setNormalOpacity(clampOpacity(storedNormalOpacity))
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

  const handleNormalOpacityChange = (delta: number) => {
    const nextOpacity = clampOpacity(normalOpacity + delta)
    setNormalOpacity(nextOpacity)
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(OVERLAY_NORMAL_OPACITY_KEY, String(nextOpacity))
    }
  }

  const startDrag = () => {
    if (!isTauri()) return

    getCurrentWindow().startDragging().catch((error) => {
      console.error('Overlay drag failed:', error)
    })
  }

  const webHoverProps =
    Platform.OS === 'web'
      ? ({
          onMouseEnter: () => setIsHovered(true),
          onMouseLeave: () => setIsHovered(false),
        } as any)
      : {}
  const webDragProps =
    Platform.OS === 'web'
      ? ({
          onMouseDown: startDrag,
          'data-tauri-drag-region': true,
        } as any)
      : {}
  const activeOpacity = (isHovered ? HOVER_OPACITY : normalOpacity) / 100
  const panelColor = theme.background
  const surfaceColor = theme.surface

  return (
    <View
      {...webHoverProps}
      style={[
        styles.container,
        {
          backgroundColor: panelColor,
          opacity: activeOpacity,
        },
      ]}
    >
      <View style={[styles.opacityBar, { borderBottomColor: theme.border }]}>
        <View
          {...webDragProps}
          accessibilityLabel="オーバーレイを移動"
          accessibilityRole="button"
          testID="overlay-drag-handle"
          style={[styles.dragHandle, { borderColor: theme.border }]}
        >
          <Text style={[styles.dragHandleText, { color: theme.textMuted }]}>
            ::
          </Text>
        </View>
        <OpacityStepper
          value={normalOpacity}
          onDecrease={() => handleNormalOpacityChange(-OPACITY_STEP)}
          onIncrease={() => handleNormalOpacityChange(OPACITY_STEP)}
          textColor={theme.textBody}
          borderColor={theme.border}
          buttonColor={surfaceColor}
          testIDPrefix="normal-opacity"
        />
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

interface OpacityStepperProps {
  value: number
  onDecrease: () => void
  onIncrease: () => void
  textColor: string
  borderColor: string
  buttonColor: string
  testIDPrefix: string
}

function OpacityStepper({
  value,
  onDecrease,
  onIncrease,
  textColor,
  borderColor,
  buttonColor,
  testIDPrefix,
}: OpacityStepperProps) {
  return (
    <View
      style={[
        styles.stepper,
        { backgroundColor: buttonColor, borderColor },
      ]}
    >
      <TouchableOpacity
        accessibilityLabel="通常透明度を下げる"
        accessibilityRole="button"
        onPress={onDecrease}
        testID={`${testIDPrefix}-decrease`}
        style={styles.stepButton}
      >
        <Text style={[styles.stepButtonText, { color: textColor }]}>{'<'}</Text>
      </TouchableOpacity>
      <View style={styles.stepperValue}>
        <Text style={[styles.opacityValue, { color: textColor }]}>
          {value}%
        </Text>
      </View>
      <TouchableOpacity
        accessibilityLabel="通常透明度を上げる"
        accessibilityRole="button"
        onPress={onIncrease}
        testID={`${testIDPrefix}-increase`}
        style={styles.stepButton}
      >
        <Text style={[styles.stepButtonText, { color: textColor }]}>{'>'}</Text>
      </TouchableOpacity>
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
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  dragHandle: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    cursor: Platform.OS === 'web' ? ('move' as any) : undefined,
    justifyContent: 'center',
    minHeight: 36,
    width: 40,
  },
  dragHandleText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  newButton: {
    alignItems: 'center',
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 36,
    minWidth: 44,
    paddingHorizontal: 8,
  },
  newButtonText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
  stepButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
    width: 26,
  },
  stepButtonText: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 18,
  },
  stepper: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 36,
    overflow: 'hidden',
  },
  stepperValue: {
    alignItems: 'center',
    minWidth: 48,
    paddingHorizontal: 4,
  },
  opacityValue: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 14,
  },
})
