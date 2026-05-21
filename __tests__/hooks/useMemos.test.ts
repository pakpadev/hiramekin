import { act, renderHook, waitFor } from '@testing-library/react-native'
import { useMemos } from '@/hooks/useMemos'
import type { Memo } from '@/types'

const storedMemos: Memo[] = []

jest.mock('@/utils/uuid', () => {
  let counter = 0

  return {
    generateId: jest.fn(() => {
      counter += 1
      return `memo-${counter}`
    }),
  }
})

jest.mock('@/services/storage', () => ({
  getStorage: () => ({
    getAll: jest.fn(async () =>
      storedMemos.filter((memo) => !memo.isArchived),
    ),
    getArchived: jest.fn(async () =>
      storedMemos.filter((memo) => memo.isArchived),
    ),
    save: jest.fn(async (memo: Memo) => {
      const index = storedMemos.findIndex((item) => item.id === memo.id)

      if (index >= 0) {
        storedMemos[index] = memo
      } else {
        storedMemos.push(memo)
      }
    }),
    archive: jest.fn(async (id: string) => {
      const memo = storedMemos.find((item) => item.id === id)
      if (memo) memo.isArchived = true
    }),
    restore: jest.fn(async (id: string) => {
      const memo = storedMemos.find((item) => item.id === id)
      if (memo) memo.isArchived = false
    }),
    deletePermanently: jest.fn(async (id: string) => {
      const index = storedMemos.findIndex((item) => item.id === id)
      if (index >= 0) storedMemos.splice(index, 1)
    }),
    search: jest.fn(async (query: string) =>
      storedMemos.filter(
        (memo) => !memo.isArchived && memo.content.includes(query),
      ),
    ),
  }),
}))

describe('useMemos', () => {
  beforeEach(() => {
    storedMemos.splice(0)
    jest.clearAllMocks()
  })

  it('createMemo でメモが追加される', async () => {
    const { result } = renderHook(() => useMemos())

    await waitFor(() => expect(result.current.memos).toHaveLength(0))

    await act(async () => {
      await result.current.createMemo('テスト内容')
    })

    expect(result.current.memos).toHaveLength(1)
    expect(result.current.memos[0].content).toBe('テスト内容')
  })

  it('updateMemo でcontentが更新される', async () => {
    const { result } = renderHook(() => useMemos())
    let id = ''

    await act(async () => {
      id = await result.current.createMemo('元の内容')
    })
    await act(async () => {
      await result.current.updateMemo(id, '新しい内容')
    })

    expect(result.current.memos[0].content).toBe('新しい内容')
  })

  it('togglePin でisPinnedが反転する', async () => {
    const { result } = renderHook(() => useMemos())
    let id = ''

    await act(async () => {
      id = await result.current.createMemo('テスト')
    })
    await act(async () => {
      await result.current.togglePin(id)
    })

    expect(result.current.memos[0].isPinned).toBe(true)
  })

  it('archiveMemo でメモがmemosから消える', async () => {
    const { result } = renderHook(() => useMemos())
    let id = ''

    await act(async () => {
      id = await result.current.createMemo('テスト')
    })
    await act(async () => {
      await result.current.archiveMemo(id)
    })

    expect(result.current.memos).toHaveLength(0)
  })

  it('pinnedMemos と regularMemos が正しく分かれる', async () => {
    const { result } = renderHook(() => useMemos())

    await act(async () => {
      const id = await result.current.createMemo('固定')
      await result.current.togglePin(id)
      await result.current.createMemo('通常')
    })

    expect(result.current.pinnedMemos).toHaveLength(1)
    expect(result.current.regularMemos).toHaveLength(1)
  })

  it('searchMemos で保存済みメモを検索できる', async () => {
    const { result } = renderHook(() => useMemos())

    await act(async () => {
      await result.current.createMemo('ひらめき')
      await result.current.createMemo('別のメモ')
    })

    const results = await result.current.searchMemos('ひらめき')

    expect(results).toHaveLength(1)
    expect(results[0].content).toBe('ひらめき')
  })

  it('setNotifyAt で通知時刻を更新する', async () => {
    const { result } = renderHook(() => useMemos())
    let id = ''

    await act(async () => {
      id = await result.current.createMemo('2026/06/01 発表')
    })
    await act(async () => {
      await result.current.setNotifyAt(id, 1800000000000)
    })

    expect(result.current.memos[0].notifyAt).toBe(1800000000000)
  })
})
