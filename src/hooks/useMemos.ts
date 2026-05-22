import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getStorage } from '@/services/storage'
import type { Memo } from '@/types'
import { generateId } from '@/utils/uuid'

export function useMemos() {
  const [memos, setMemos] = useState<Memo[]>([])
  const memosRef = useRef<Memo[]>([])
  const storage = useMemo(() => getStorage(), [])

  const setSortedMemos = useCallback((nextMemos: Memo[]) => {
    const sortedMemos = sortMemos(nextMemos)

    memosRef.current = sortedMemos
    setMemos(sortedMemos)
  }, [])

  const loadMemos = useCallback(async () => {
    const loadedMemos = await storage.getAll()
    setSortedMemos(loadedMemos)
  }, [setSortedMemos, storage])

  useEffect(() => {
    let isMounted = true

    storage.getAll().then((loadedMemos) => {
      if (isMounted) setSortedMemos(loadedMemos)
    })

    return () => {
      isMounted = false
    }
  }, [setSortedMemos, storage])

  const createMemo = useCallback(
    async (content: string): Promise<string> => {
      const now = Date.now()
      const memo: Memo = {
        id: generateId(),
        content,
        isPinned: false,
        isArchived: false,
        notifyAt: null,
        createdAt: now,
        updatedAt: now,
      }

      await storage.save(memo)
      setSortedMemos([memo, ...memosRef.current])

      return memo.id
    },
    [setSortedMemos, storage],
  )

  const updateMemo = useCallback(
    async (id: string, content: string): Promise<void> => {
      const updatedMemo = findUpdatedMemo(id, memosRef.current, (memo) => ({
        ...memo,
        content,
        updatedAt: Date.now(),
      }))

      if (!updatedMemo) return

      await storage.save(updatedMemo)
      setSortedMemos(
        memosRef.current.map((memo) =>
          memo.id === id ? updatedMemo : memo,
        ),
      )
    },
    [setSortedMemos, storage],
  )

  const togglePin = useCallback(
    async (id: string): Promise<void> => {
      const updatedMemo = findUpdatedMemo(id, memosRef.current, (memo) => ({
        ...memo,
        isPinned: !memo.isPinned,
        updatedAt: Date.now(),
      }))

      if (!updatedMemo) return

      await storage.save(updatedMemo)
      setSortedMemos(
        memosRef.current.map((memo) =>
          memo.id === id ? updatedMemo : memo,
        ),
      )
    },
    [setSortedMemos, storage],
  )

  const archiveMemo = useCallback(
    async (id: string): Promise<void> => {
      await storage.archive(id)
      setSortedMemos(memosRef.current.filter((memo) => memo.id !== id))
    },
    [setSortedMemos, storage],
  )

  const restoreMemo = useCallback(
    async (id: string): Promise<void> => {
      await storage.restore(id)
      await loadMemos()
    },
    [loadMemos, storage],
  )

  const deletePermanently = useCallback(
    async (id: string): Promise<void> => {
      await storage.deletePermanently(id)
      setSortedMemos(memosRef.current.filter((memo) => memo.id !== id))
    },
    [setSortedMemos, storage],
  )

  const searchMemos = useCallback(
    async (query: string): Promise<Memo[]> => {
      if (!query.trim()) return []

      return storage.search(query)
    },
    [storage],
  )

  const getArchivedMemos = useCallback(async (): Promise<Memo[]> => {
    return storage.getArchived()
  }, [storage])

  const setNotifyAt = useCallback(
    async (id: string, notifyAt: number | null): Promise<void> => {
      const updatedMemo = findUpdatedMemo(id, memosRef.current, (memo) => ({
        ...memo,
        notifyAt,
        updatedAt: Date.now(),
      }))

      if (!updatedMemo) return

      await storage.save(updatedMemo)
      setSortedMemos(
        memosRef.current.map((memo) =>
          memo.id === id ? updatedMemo : memo,
        ),
      )
    },
    [setSortedMemos, storage],
  )

  const pinnedMemos = useMemo(
    () => memos.filter((memo) => memo.isPinned),
    [memos],
  )
  const regularMemos = useMemo(
    () => memos.filter((memo) => !memo.isPinned),
    [memos],
  )

  return {
    memos,
    pinnedMemos,
    regularMemos,
    loadMemos,
    createMemo,
    updateMemo,
    togglePin,
    archiveMemo,
    restoreMemo,
    deletePermanently,
    searchMemos,
    getArchivedMemos,
    setNotifyAt,
  }
}

function sortMemos(memos: Memo[]): Memo[] {
  return [...memos].sort((a, b) => b.updatedAt - a.updatedAt)
}

function findUpdatedMemo(
  id: string,
  memos: Memo[],
  updater: (memo: Memo) => Memo,
): Memo | null {
  const memo = memos.find((item) => item.id === id)

  return memo ? updater(memo) : null
}
