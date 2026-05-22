import { ScrollView, StyleSheet, Text } from 'react-native'
import { MemoItem } from './MemoItem'
import type { Memo } from '@/types'

interface MemoListProps {
  pinnedMemos: Memo[]
  regularMemos: Memo[]
  onSelectMemo: (id: string) => void
  isDark?: boolean
}

export function MemoList({
  pinnedMemos,
  regularMemos,
  onSelectMemo,
  isDark = false,
}: MemoListProps) {
  const isEmpty = pinnedMemos.length === 0 && regularMemos.length === 0

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {pinnedMemos.length > 0 ? (
        <>
          <Text
            style={[
              styles.sectionHeader,
              { color: isDark ? '#aaa' : '#777' },
            ]}
          >
            ピン留め
          </Text>
          {pinnedMemos.map((memo) => (
            <MemoItem
              key={memo.id}
              memo={memo}
              onPress={onSelectMemo}
              isDark={isDark}
            />
          ))}
        </>
      ) : null}
      {regularMemos.map((memo) => (
        <MemoItem
          key={memo.id}
          memo={memo}
          onPress={onSelectMemo}
          isDark={isDark}
        />
      ))}
      {isEmpty ? (
        <Text style={[styles.empty, { color: isDark ? '#888' : '#888' }]}>
          メモはありません
        </Text>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  empty: {
    color: '#888',
    fontSize: 14,
    padding: 24,
    textAlign: 'center',
  },
  sectionHeader: {
    color: '#777',
    fontSize: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
})
