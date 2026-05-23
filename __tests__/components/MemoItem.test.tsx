import { fireEvent, render, screen } from '@testing-library/react-native'
import { MemoItem } from '@/components/MemoItem'
import type { Memo } from '@/types'

const memo: Memo = {
  id: '1',
  content: 'テストメモの内容',
  isPinned: false,
  isArchived: false,
  notifyAt: null,
  createdAt: new Date('2026-05-21T10:00:00').getTime(),
  updatedAt: new Date('2026-05-21T10:00:00').getTime(),
}

describe('MemoItem', () => {
  it('content の先頭行を表示する', () => {
    render(
      <MemoItem
        memo={{ ...memo, content: '1行目\n2行目' }}
        onPress={jest.fn()}
        onPin={jest.fn()}
        onArchive={jest.fn()}
      />,
    )

    expect(screen.getByText('1行目')).toBeTruthy()
    expect(screen.queryByText('2行目')).toBeNull()
  })

  it('タップで onPress が呼ばれる', () => {
    const onPress = jest.fn()
    render(
      <MemoItem
        memo={memo}
        onPress={onPress}
        onPin={jest.fn()}
        onArchive={jest.fn()}
      />,
    )

    fireEvent.press(screen.getByText('テストメモの内容'))

    expect(onPress).toHaveBeenCalledWith(memo.id)
  })

  it('isPinned のときピン表示を出す', () => {
    render(
      <MemoItem
        memo={{ ...memo, isPinned: true }}
        onPress={jest.fn()}
        onPin={jest.fn()}
        onArchive={jest.fn()}
      />,
    )

    expect(screen.getByTestId('pin-icon')).toBeTruthy()
  })
})
