import type { Memo } from '@/types'
import { memoToTextFilename } from '../exportFiles'

const mockMemo: Memo = {
  id: '1',
  content: 'テスト/メモ:タイトル',
  isPinned: false,
  isArchived: false,
  notifyAt: null,
  createdAt: Date.UTC(2026, 4, 30, 12, 0, 0),
  updatedAt: Date.UTC(2026, 4, 30, 12, 0, 0),
}

describe('memoToTextFilename', () => {
  it('creates a filesystem-safe numbered txt filename', () => {
    expect(memoToTextFilename(mockMemo, 0)).toBe(
      '001-テスト_メモ_タイトル-2026-05-30T12-00-00-000Z.txt',
    )
  })
})
