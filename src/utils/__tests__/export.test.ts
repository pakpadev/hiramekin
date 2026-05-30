import type { Memo } from '@/types'
import { memosToJson, memosToText } from '../export'

const mockMemo: Memo = {
  id: '1',
  content: 'テストメモ',
  isPinned: false,
  isArchived: false,
  notifyAt: null,
  createdAt: 1000000,
  updatedAt: 1000000,
}

describe('memosToText', () => {
  it('joins memo contents with separator', () => {
    const result = memosToText([mockMemo, { ...mockMemo, content: '2つ目' }])
    expect(result).toBe('テストメモ\n\n---\n\n2つ目')
  })
})

describe('memosToJson', () => {
  it('serializes memos to JSON string', () => {
    const result = memosToJson([mockMemo])
    const parsed = JSON.parse(result)
    expect(parsed[0].content).toBe('テストメモ')
  })
})
