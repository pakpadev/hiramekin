import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { getStorage } from '@/services/storage'
import type { Memo } from '@/types'

interface SettingsScreenProps {
  onClose: () => void
}

export function SettingsScreen({ onClose }: SettingsScreenProps) {
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

  if (showArchive) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowArchive(false)}>
            <Text style={styles.back}>戻る</Text>
          </TouchableOpacity>
          <Text style={styles.title}>アーカイブ</Text>
        </View>
        <FlatList
          data={archivedMemos}
          keyExtractor={(memo) => memo.id}
          renderItem={({ item }) => (
            <View style={styles.archiveItem}>
              <Text style={styles.archiveContent} numberOfLines={1}>
                {item.content}
              </Text>
              <View style={styles.archiveActions}>
                <TouchableOpacity onPress={() => handleRestore(item.id)}>
                  <Text style={styles.restoreButton}>復元</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onLongPress={() => handleDeletePermanently(item.id)}
                >
                  <Text style={styles.deleteButton}>長押しで削除</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>アーカイブはありません</Text>
          }
        />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.back}>閉じる</Text>
        </TouchableOpacity>
        <Text style={styles.title}>設定</Text>
      </View>
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => setShowArchive(true)}
      >
        <Text style={styles.menuLabel}>アーカイブを見る</Text>
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
    borderBottomColor: '#eee',
    borderBottomWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  back: {
    color: '#007AFF',
    fontSize: 16,
    marginRight: 16,
  },
  container: {
    backgroundColor: '#fff',
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
    borderBottomColor: '#ccc',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    padding: 16,
  },
  menuItem: {
    borderBottomColor: '#eee',
    borderBottomWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  menuLabel: {
    fontSize: 16,
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
