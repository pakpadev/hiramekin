import { useCallback, useEffect, useMemo, useState } from 'react'
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart'
import { open, save } from '@tauri-apps/plugin-dialog'
import { writeTextFile } from '@tauri-apps/plugin-fs'
import {
  Alert,
  FlatList,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { getStorage } from '@/services/storage'
import type { Memo } from '@/types'
import { exportMemosAsTextFiles } from '@/utils/exportFiles'
import { memosToJson } from '@/utils/export'
import { isTauri } from '@/utils/tauri'

interface SettingsScreenProps {
  onClose: () => void
  isDark?: boolean
}

const APK_DOWNLOAD_URL =
  'https://github.com/pakpadev/hiramekin/releases/download/v1.0.1-beta/hiramekin-v1.0.1-beta.apk'
const OVERLAY_OPACITY_KEY = 'hiramekin-overlay-opacity'
const OVERLAY_OPACITY_OPTIONS = [0.8, 0.88, 0.95] as const

export function SettingsScreen({ onClose, isDark = false }: SettingsScreenProps) {
  const [archivedMemos, setArchivedMemos] = useState<Memo[]>([])
  const [showArchive, setShowArchive] = useState(false)
  const [autostart, setAutostart] = useState(false)
  const [overlayOpacity, setOverlayOpacity] = useState(0.88)
  const storage = useMemo(() => getStorage(), [])

  const loadArchived = useCallback(async () => {
    const archived = await storage.getArchived()
    setArchivedMemos(archived)
  }, [storage])

  useEffect(() => {
    if (showArchive) {
      loadArchived()
    }
  }, [loadArchived, showArchive])

  useEffect(() => {
    if (!isTauri()) return

    isEnabled()
      .then(setAutostart)
      .catch(() => {})

    const storedOpacity = Number(window.localStorage.getItem(OVERLAY_OPACITY_KEY))
    if (OVERLAY_OPACITY_OPTIONS.includes(storedOpacity as any)) {
      setOverlayOpacity(storedOpacity)
    }
  }, [])

  const handleRestore = async (id: string) => {
    await storage.restore(id)
    await loadArchived()
  }

  const handleDeletePermanently = (id: string) => {
    Alert.alert('完全削除', 'このメモを完全に削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          await storage.deletePermanently(id)
          await loadArchived()
        },
      },
    ])
  }

  const handleOpenDownload = () => {
    const downloadUrl = Platform.OS === 'web' ? '/download.html' : APK_DOWNLOAD_URL
    Linking.openURL(downloadUrl)
  }

  const handleAutostartToggle = async () => {
    try {
      if (autostart) {
        await disable()
      } else {
        await enable()
      }
      setAutostart((value) => !value)
    } catch (error) {
      console.error('Autostart toggle failed:', error)
    }
  }

  const handleExport = async (format: 'json' | 'txt') => {
    try {
      const activeMemos = await storage.getAll()
      const archived = await storage.getArchived()
      const memos = [...activeMemos, ...archived]

      if (format === 'txt') {
        const directory = await open({
          directory: true,
          multiple: false,
          title: 'テキストエクスポート先を選択',
        })

        if (typeof directory === 'string') {
          await exportMemosAsTextFiles(directory, memos)
        }

        return
      }

      const data = memosToJson(memos)
      const path = await save({
        defaultPath: 'hiramekin-export.json',
        filters: [{ name: 'JSON', extensions: ['json'] }],
      })

      if (path) {
        await writeTextFile(path, data)
      }
    } catch (error) {
      console.error('Memo export failed:', error)
    }
  }

  const handleOverlayOpacityChange = (opacity: number) => {
    setOverlayOpacity(opacity)
    window.localStorage.setItem(OVERLAY_OPACITY_KEY, String(opacity))
  }

  if (showArchive) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? '#111' : '#fff' },
        ]}
      >
        <View
          style={[
            styles.header,
            { borderBottomColor: isDark ? '#303030' : '#ccc' },
          ]}
        >
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setShowArchive(false)}
          >
            <Text style={styles.back}>戻る</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: isDark ? '#f2f2f2' : '#111' }]}>
            アーカイブ
          </Text>
        </View>
        <FlatList
          data={archivedMemos}
          keyExtractor={(memo) => memo.id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.archiveItem,
                { borderBottomColor: isDark ? '#303030' : '#eee' },
              ]}
            >
              <Text
                style={[
                  styles.archiveContent,
                  { color: isDark ? '#f2f2f2' : '#111' },
                ]}
                numberOfLines={1}
              >
                {item.content}
              </Text>
              <View style={styles.archiveActions}>
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => handleRestore(item.id)}
                >
                  <Text style={styles.restoreButton}>復元</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  onLongPress={() => handleDeletePermanently(item.id)}
                >
                  <Text style={styles.deleteButton}>長押しで削除</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: isDark ? '#888' : '#999' }]}>
              アーカイブはありません
            </Text>
          }
        />
      </View>
    )
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? '#111' : '#fff' },
      ]}
    >
      <View
        style={[
          styles.header,
          { borderBottomColor: isDark ? '#303030' : '#ccc' },
        ]}
      >
        <TouchableOpacity accessibilityRole="button" onPress={onClose}>
          <Text style={styles.back}>閉じる</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDark ? '#f2f2f2' : '#111' }]}>
          設定
        </Text>
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        style={[
          styles.menuItem,
          { borderBottomColor: isDark ? '#303030' : '#eee' },
        ]}
        onPress={() => setShowArchive(true)}
      >
        <Text style={[styles.menuLabel, { color: isDark ? '#f2f2f2' : '#111' }]}>
          アーカイブを見る
        </Text>
      </TouchableOpacity>
      {isTauri() ? (
        <TouchableOpacity
          accessibilityRole="button"
          style={[
            styles.menuItem,
            { borderBottomColor: isDark ? '#303030' : '#eee' },
          ]}
          onPress={handleAutostartToggle}
        >
          <Text style={[styles.menuLabel, { color: isDark ? '#f2f2f2' : '#111' }]}>
            ログイン時に自動起動
          </Text>
          <Text style={[styles.menuDescription, { color: isDark ? '#aaa' : '#666' }]}>
            {autostart ? '有効' : '無効'}
          </Text>
        </TouchableOpacity>
      ) : null}
      {isTauri() ? (
        <View
          style={[
            styles.menuItem,
            { borderBottomColor: isDark ? '#303030' : '#eee' },
          ]}
        >
          <Text style={[styles.menuLabel, { color: isDark ? '#f2f2f2' : '#111' }]}>
            オーバーレイ透明度
          </Text>
          <View style={styles.segmented}>
            {OVERLAY_OPACITY_OPTIONS.map((opacity) => {
              const selected = overlayOpacity === opacity

              return (
                <TouchableOpacity
                  key={opacity}
                  accessibilityRole="button"
                  style={[
                    styles.segment,
                    {
                      backgroundColor: selected ? '#00acc1' : 'transparent',
                      borderColor: isDark ? '#404040' : '#d0d7de',
                    },
                  ]}
                  onPress={() => handleOverlayOpacityChange(opacity)}
                >
                  <Text
                    style={[
                      styles.segmentLabel,
                      { color: selected ? '#000' : isDark ? '#f2f2f2' : '#111' },
                    ]}
                  >
                    {Math.round(opacity * 100)}%
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      ) : null}
      {isTauri() ? (
        <TouchableOpacity
          accessibilityRole="button"
          style={[
            styles.menuItem,
            { borderBottomColor: isDark ? '#303030' : '#eee' },
          ]}
          onPress={() => handleExport('json')}
        >
          <Text style={[styles.menuLabel, { color: isDark ? '#f2f2f2' : '#111' }]}>
            メモをエクスポート (JSON)
          </Text>
          <Text style={[styles.menuDescription, { color: isDark ? '#aaa' : '#666' }]}>
            全メモをJSONファイルに保存
          </Text>
        </TouchableOpacity>
      ) : null}
      {isTauri() ? (
        <TouchableOpacity
          accessibilityRole="button"
          style={[
            styles.menuItem,
            { borderBottomColor: isDark ? '#303030' : '#eee' },
          ]}
          onPress={() => handleExport('txt')}
        >
          <Text style={[styles.menuLabel, { color: isDark ? '#f2f2f2' : '#111' }]}>
            メモをエクスポート (テキスト)
          </Text>
          <Text style={[styles.menuDescription, { color: isDark ? '#aaa' : '#666' }]}>
            メモごとにテキストファイルを保存
          </Text>
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity
        accessibilityRole="link"
        style={[
          styles.menuItem,
          { borderBottomColor: isDark ? '#303030' : '#eee' },
        ]}
        onPress={handleOpenDownload}
      >
        <Text style={[styles.menuLabel, { color: isDark ? '#f2f2f2' : '#111' }]}>
          Android APKをダウンロード
        </Text>
        <Text style={[styles.menuDescription, { color: isDark ? '#aaa' : '#666' }]}>
          v1.0.1 beta の直接配布ページを開く
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  archiveActions: {
    flexDirection: 'row',
    gap: 16,
  },
  archiveContent: {
    fontSize: 15,
    marginBottom: 8,
  },
  archiveItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  back: {
    color: '#007AFF',
    fontSize: 16,
    marginRight: 16,
  },
  container: {
    flex: 1,
  },
  deleteButton: {
    color: '#ccc',
    fontSize: 14,
  },
  empty: {
    color: '#999',
    padding: 32,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    padding: 16,
  },
  menuItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  menuLabel: {
    fontSize: 16,
  },
  menuDescription: {
    fontSize: 13,
    marginTop: 4,
  },
  restoreButton: {
    color: '#007AFF',
    fontSize: 14,
  },
  segmented: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  segment: {
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 36,
    minWidth: 68,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
})
