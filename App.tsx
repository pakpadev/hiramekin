import { StatusBar } from 'expo-status-bar'
import * as Notifications from 'expo-notifications'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native'
import { InputArea } from '@/components/InputArea'
import { KeyboardToolbar } from '@/components/KeyboardToolbar'
import { MemoList } from '@/components/MemoList'
import { NotifyPicker } from '@/components/NotifyPicker'
import { SearchBar } from '@/components/SearchBar'
import { VoiceInput } from '@/components/VoiceInput'
import { useHaptics } from '@/hooks/useHaptics'
import { useMemos } from '@/hooks/useMemos'
import { useNotifications } from '@/hooks/useNotifications'
import { useVoice } from '@/hooks/useVoice'
import { detectDate } from '@/services/notifications'
import { getTheme } from '@/theme'
import type { NotifyTiming } from '@/services/notifications'
import { SettingsScreen } from '@/screens/SettingsScreen'
import type { Memo, UIState } from '@/types'

export default function App() {
  const [uiState, setUiState] = useState<UIState>({
    editingMemoId: null,
    searchQuery: '',
    showArchive: false,
    isListening: false,
  })
  const [inputContent, setInputContent] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [showNotifyPicker, setShowNotifyPicker] = useState(false)
  const [searchResults, setSearchResults] = useState<Memo[]>([])
  const insertRef = useRef<((text: string) => void) | null>(null)
  const focusInputRef = useRef<(() => void) | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const creatingMemoRef = useRef(false)
  const latestInputContentRef = useRef('')
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'

  const {
    pinnedMemos,
    regularMemos,
    loadMemos,
    createMemo,
    updateMemo,
    togglePin,
    archiveMemo,
    searchMemos,
    setNotifyAt,
  } = useMemos()
  const { trigger } = useHaptics()
  const { schedule: scheduleNotification, cancel: cancelNotification } =
    useNotifications()

  const allMemos = [...pinnedMemos, ...regularMemos]
  const currentMemo = uiState.editingMemoId
    ? allMemos.find((memo) => memo.id === uiState.editingMemoId) ?? null
    : null
  const detectedDate = detectDate(inputContent)

  const voice = useVoice((text) => {
    insertRef.current?.(text)
    setUiState((state) => ({ ...state, isListening: false }))
  })

  const scheduleSave = useCallback(
    (id: string, content: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

      saveTimerRef.current = setTimeout(async () => {
        if (content.trim()) {
          await updateMemo(id, content)
          await trigger('save')
        }
      }, 500)
    },
    [trigger, updateMemo],
  )

  const handleSelectMemo = useCallback(
    (id: string) => {
      const memo = [...pinnedMemos, ...regularMemos].find(
        (item) => item.id === id,
      )

      if (!memo) return

      setInputContent(memo.content)
      setUiState((state) => ({ ...state, editingMemoId: id }))
    },
    [pinnedMemos, regularMemos],
  )

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const memoId = response.notification.request.content.data?.memoId

        if (typeof memoId === 'string') {
          handleSelectMemo(memoId)
        }
      },
    )

    return () => subscription.remove()
  }, [handleSelectMemo])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  const handleInputChange = useCallback(
    async (text: string) => {
      setInputContent(text)
      latestInputContentRef.current = text

      if (uiState.editingMemoId) {
        scheduleSave(uiState.editingMemoId, text)
        return
      }

      if (
        inputContent.length === 0 &&
        text.length > 0 &&
        !creatingMemoRef.current
      ) {
        creatingMemoRef.current = true
        try {
          const id = await createMemo(text)
          const latestContent = latestInputContentRef.current

          if (latestContent.trim() && latestContent !== text) {
            await updateMemo(id, latestContent)
          }

          setUiState((state) => ({ ...state, editingMemoId: id }))
        } finally {
          creatingMemoRef.current = false
        }
      }
    },
    [
      createMemo,
      inputContent.length,
      scheduleSave,
      uiState.editingMemoId,
      updateMemo,
    ],
  )

  const handleBlur = useCallback(async () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    const editingMemoId = uiState.editingMemoId

    if (editingMemoId) {
      if (inputContent.trim()) {
        await updateMemo(editingMemoId, inputContent)
        await trigger('save')
      } else {
        if (currentMemo?.notifyAt) await cancelNotification(editingMemoId)
        await archiveMemo(editingMemoId)
      }
    } else if (inputContent.trim()) {
      await createMemo(inputContent)
      await trigger('save')
    }

    setInputContent('')
    setUiState((state) => ({ ...state, editingMemoId: null }))
  }, [
    archiveMemo,
    cancelNotification,
    createMemo,
    currentMemo?.notifyAt,
    inputContent,
    trigger,
    uiState.editingMemoId,
    updateMemo,
  ])

  const handleSearch = useCallback(
    async (query: string) => {
      setUiState((state) => ({ ...state, searchQuery: query }))

      if (!query.trim()) {
        setSearchResults([])
        return
      }

      setSearchResults(await searchMemos(query))
    },
    [searchMemos],
  )

  const handleNotifySelect = async (timing: NotifyTiming | null) => {
    setShowNotifyPicker(false)

    if (!uiState.editingMemoId || !detectedDate) return

    if (timing === null) {
      await cancelNotification(uiState.editingMemoId)
      await setNotifyAt(uiState.editingMemoId, null)
      return
    }

    const notifyAt = await scheduleNotification(
      uiState.editingMemoId,
      inputContent,
      detectedDate,
      timing,
    )

    if (notifyAt) {
      await setNotifyAt(uiState.editingMemoId, notifyAt)
    }
  }

  const handlePin = async () => {
    if (!uiState.editingMemoId) return

    await togglePin(uiState.editingMemoId)
    await trigger('pin')
  }

  const handleArchive = async () => {
    if (!uiState.editingMemoId) return

    if (currentMemo?.notifyAt) {
      await cancelNotification(uiState.editingMemoId)
    }

    await archiveMemo(uiState.editingMemoId)
    await trigger('archive')
    setInputContent('')
    setUiState((state) => ({ ...state, editingMemoId: null }))
    Keyboard.dismiss()
  }

  const isEditing = uiState.editingMemoId !== null || inputContent.length > 0
  const isSearching = uiState.searchQuery.trim().length > 0
  const displayedPinned = isSearching
    ? searchResults.filter((memo) => memo.isPinned)
    : pinnedMemos
  const displayedRegular = isSearching
    ? searchResults.filter((memo) => !memo.isPinned)
    : regularMemos
  const theme = getTheme(isDark)

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Text style={[styles.logo, { color: theme.textPrimary }]}>閃筋</Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setShowSettings(true)}
          >
            <Text style={[styles.settingsButton, { color: theme.accent }]}>
              設定
            </Text>
          </TouchableOpacity>
        </View>

        <InputArea
          content={inputContent}
          onChange={handleInputChange}
          onBlur={handleBlur}
          autoFocus={true}
          insertRef={insertRef}
          focusRef={focusInputRef}
          isDark={isDark}
        />

        {isEditing ? (
          <View style={styles.actionBar}>
            <TouchableOpacity accessibilityRole="button" onPress={handlePin}>
              <Text style={[styles.action, { color: theme.accent }]}>ピン</Text>
            </TouchableOpacity>
            {detectedDate ? (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setShowNotifyPicker(true)}
              >
                <Text style={[styles.action, { color: theme.accent }]}>通知</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity accessibilityRole="button" onPress={handleArchive}>
              <Text style={[styles.action, { color: theme.danger }]}>
                アーカイブ
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <SearchBar
          value={uiState.searchQuery}
          onChange={handleSearch}
          isDark={isDark}
        />
        <MemoList
          pinnedMemos={displayedPinned}
          regularMemos={displayedRegular}
          onSelectMemo={handleSelectMemo}
          isDark={isDark}
        />

        <TouchableOpacity
          accessibilityRole="button"
          style={[
            styles.fab,
            { backgroundColor: theme.accent, shadowColor: theme.accent },
          ]}
          accessibilityLabel="新規メモ"
          onPress={() => {
            setInputContent('')
            setUiState((state) => ({ ...state, editingMemoId: null }))
            requestAnimationFrame(() => {
              focusInputRef.current?.()
            })
          }}
        >
          <Text style={[styles.fabPlus, { color: '#000' }]}>＋</Text>
        </TouchableOpacity>

        <KeyboardToolbar
          onInsert={(text) => insertRef.current?.(text)}
          onMic={() => {
            setUiState((state) => ({ ...state, isListening: true }))
            voice.startListening()
          }}
          isDark={isDark}
        />

        <VoiceInput
          visible={uiState.isListening || voice.isListening}
          onCancel={() => {
            voice.stopListening()
            setUiState((state) => ({ ...state, isListening: false }))
          }}
        />

        {showSettings ? (
          <View
            style={[
              styles.settingsOverlay,
              { backgroundColor: theme.background },
            ]}
          >
            <SettingsScreen
              isDark={isDark}
              onClose={() => {
                setShowSettings(false)
                loadMemos()
              }}
            />
          </View>
        ) : null}

        <NotifyPicker
          visible={showNotifyPicker}
          hasExisting={!!currentMemo?.notifyAt}
          onSelect={handleNotifySelect}
          onDismiss={() => setShowNotifyPicker(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  action: {
    fontSize: 14,
  },
  actionBar: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 8,
    paddingHorizontal: 16,
  },
  container: {
    flex: 1,
  },
  fab: {
    alignItems: 'center',
    borderRadius: 26,
    bottom: 80,
    elevation: 8,
    height: 52,
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    width: 52,
  },
  fabPlus: {
    fontSize: 28,
    lineHeight: 32,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  logo: {
    fontSize: 18,
    fontWeight: '700',
  },
  safe: {
    flex: 1,
  },
  settingsButton: {
    fontSize: 14,
  },
  settingsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    elevation: 10,
    zIndex: 10,
  },
})
