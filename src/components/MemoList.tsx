import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { getTheme } from '@/theme'
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
  const theme = getTheme(isDark)
  const isEmpty = pinnedMemos.length === 0 && regularMemos.length === 0

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {pinnedMemos.length > 0 ? (
        <>
          <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>
            ピン留め
          </Text>
          <View style={styles.cardList}>
            {pinnedMemos.map((memo, index) => (
              <MemoItem
                key={memo.id}
                memo={memo}
                onPress={onSelectMemo}
                isDark={isDark}
                index={index}
              />
            ))}
          </View>
        </>
      ) : null}
      <View style={styles.cardList}>
        {regularMemos.map((memo, index) => (
          <MemoItem
            key={memo.id}
            memo={memo}
            onPress={onSelectMemo}
            isDark={isDark}
            index={pinnedMemos.length + index}
          />
        ))}
      </View>
      {isEmpty ? (
        <Text style={[styles.empty, { color: theme.textMuted }]}>
          メモはありません
        </Text>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  cardList: {
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  container: {
    flex: 1,
  },
  empty: {
    fontSize: 14,
    padding: 24,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 12,
    paddingHorizontal: 16,
    paddingBottom: 2,
    paddingTop: 8,
  },
})
