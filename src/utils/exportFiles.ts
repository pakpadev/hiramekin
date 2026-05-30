import { join } from '@tauri-apps/api/path'
import { writeTextFile } from '@tauri-apps/plugin-fs'
import type { Memo } from '@/types'

export function memoToTextFilename(memo: Memo, index: number): string {
  const prefix = sanitizeFilename(memo.content).slice(0, 40) || 'memo'
  const stamp = new Date(memo.createdAt).toISOString().replace(/[:.]/g, '-')

  return `${String(index + 1).padStart(3, '0')}-${prefix}-${stamp}.txt`
}

export async function exportMemosAsTextFiles(
  directory: string,
  memos: Memo[],
): Promise<void> {
  await Promise.all(
    memos.map(async (memo, index) => {
      const path = await join(directory, memoToTextFilename(memo, index))
      await writeTextFile(path, memo.content)
    }),
  )
}

function sanitizeFilename(value: string): string {
  return value
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, ' ')
}
