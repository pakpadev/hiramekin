import { render, screen } from '@testing-library/react-native'
import { MemoList } from '@/components/MemoList'
import type { Memo } from '@/types'

const makeMemo = (id: string, content: string, isPinned = false): Memo => ({
  id,
  content,
  isPinned,
  isArchived: false,
  notifyAt: null,
  createdAt: 1000,
  updatedAt: 1000,
})

describe('MemoList', () => {
  it('ピン留めと通常メモを両方表示する', () => {
    render(
      <MemoList
        pinnedMemos={[makeMemo('1', 'ピン留めメモ', true)]}
        regularMemos={[makeMemo('2', '通常メモ')]}
        onSelectMemo={jest.fn()}
      />,
    )

    expect(screen.getByText('ピン留め')).toBeTruthy()
    expect(screen.getByText('ピン留めメモ')).toBeTruthy()
    expect(screen.getByText('通常メモ')).toBeTruthy()
  })

  it('ピン留めがない場合はセクションヘッダーを非表示にする', () => {
    render(
      <MemoList
        pinnedMemos={[]}
        regularMemos={[makeMemo('1', '通常メモ')]}
        onSelectMemo={jest.fn()}
      />,
    )

    expect(screen.queryByText('ピン留め')).toBeNull()
    expect(screen.getByText('通常メモ')).toBeTruthy()
  })

  it('メモがない場合は空表示を出す', () => {
    render(
      <MemoList pinnedMemos={[]} regularMemos={[]} onSelectMemo={jest.fn()} />,
    )

    expect(screen.getByText('メモはありません')).toBeTruthy()
  })
})
