import { openDB, type IDBPDatabase } from 'idb'
import type { Memo } from '@/types'
import type { IStorage } from './IStorage'

const DB_NAME = 'hiramekin'
const STORE_NAME = 'memos'
const DB_VERSION = 1

type HiramekinDB = IDBPDatabase<{
  memos: {
    key: string
    value: Memo
  }
}>

export class IndexedDBAdapter implements IStorage {
  private readonly dbPromise: Promise<HiramekinDB>

  constructor() {
    this.dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      },
    }) as Promise<HiramekinDB>
  }

  async getAll(): Promise<Memo[]> {
    const memos = await this.readAll()

    return memos.filter((memo) => !memo.isArchived)
  }

  async getArchived(): Promise<Memo[]> {
    const memos = await this.readAll()

    return memos.filter((memo) => memo.isArchived)
  }

  async save(memo: Memo): Promise<void> {
    const db = await this.dbPromise

    await db.put(STORE_NAME, memo)
  }

  async clear(): Promise<void> {
    const db = await this.dbPromise

    await db.clear(STORE_NAME)
  }

  close(): void {
    void this.dbPromise.then((db) => db.close())
  }

  async archive(id: string): Promise<void> {
    await this.updateMemo(id, (memo) => ({ ...memo, isArchived: true }))
  }

  async restore(id: string): Promise<void> {
    await this.updateMemo(id, (memo) => ({ ...memo, isArchived: false }))
  }

  async deletePermanently(id: string): Promise<void> {
    const db = await this.dbPromise

    await db.delete(STORE_NAME, id)
  }

  async search(query: string): Promise<Memo[]> {
    const memos = await this.getAll()
    const normalizedQuery = query.toLowerCase()

    return memos.filter((memo) =>
      memo.content.toLowerCase().includes(normalizedQuery),
    )
  }

  private async readAll(): Promise<Memo[]> {
    const db = await this.dbPromise

    return db.getAll(STORE_NAME)
  }

  private async updateMemo(
    id: string,
    updater: (memo: Memo) => Memo,
  ): Promise<void> {
    const db = await this.dbPromise
    const memo = await db.get(STORE_NAME, id)

    if (!memo) return

    await db.put(STORE_NAME, updater(memo))
  }
}
