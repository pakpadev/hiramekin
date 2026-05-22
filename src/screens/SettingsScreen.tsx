import { useCallback, useEffect, useMemo, useState } from 'react'
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

interface SettingsScreenProps {
  onClose: () => void
  isDark?: boolean
}

const APK_DOWNLOAD_URL =
  'https://github.com/pakpadev/hiramekin/releases/download/v1.0.0-beta/hiramekin-v1.0.0-beta.apk'

export function SettingsScreen({ onClose, isDark = false }: SettingsScreenProps) {
  const [archivedMemos, setArchivedMemos] = useState<Memo[]>([])
  const [showArchive, setShowArchive] = useState(false)
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
          v1.0.0 beta の直接配布ページを開く
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
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
})
