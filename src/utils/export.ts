import type { Memo } from '@/types'

export function memosToText(memos: Memo[]): string {
  return memos.map((memo) => memo.content).join('\n\n---\n\n')
}

export function memosToJson(memos: Memo[]): string {
  return JSON.stringify(memos, null, 2)
}
