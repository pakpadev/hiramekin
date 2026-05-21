import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Memo } from '@/types'
import type { IStorage } from './IStorage'

const STORAGE_KEY = 'hiramekin_memos'

export class AsyncStorageAdapter implements IStorage {
  async getAll(): Promise<Memo[]> {
    const memos = await this.readAll()

    return memos.filter((memo) => !memo.isArchived)
  }

  async getArchived(): Promise<Memo[]> {
    const memos = await this.readAll()

    return memos.filter((memo) => memo.isArchived)
  }

  async save(memo: Memo): Promise<void> {
    const memos = await this.readAll()
    const index = memos.findIndex((item) => item.id === memo.id)

    if (index >= 0) {
      memos[index] = memo
    } else {
      memos.push(memo)
    }

    await this.writeAll(memos)
  }

  async archive(id: string): Promise<void> {
    await this.updateMemo(id, (memo) => ({ ...memo, isArchived: true }))
  }

  async restore(id: string): Promise<void> {
    await this.updateMemo(id, (memo) => ({ ...memo, isArchived: false }))
  }

  async deletePermanently(id: string): Promise<void> {
    const memos = await this.readAll()

    await this.writeAll(memos.filter((memo) => memo.id !== id))
  }

  async search(query: string): Promise<Memo[]> {
    const memos = await this.getAll()
    const normalizedQuery = query.toLowerCase()

    return memos.filter((memo) =>
      memo.content.toLowerCase().includes(normalizedQuery),
    )
  }

  private async updateMemo(
    id: string,
    updater: (memo: Memo) => Memo,
  ): Promise<void> {
    const memos = await this.readAll()
    const index = memos.findIndex((memo) => memo.id === id)

    if (index < 0) return

    memos[index] = updater(memos[index])
    await this.writeAll(memos)
  }

  private async readAll(): Promise<Memo[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)

    if (!raw) return []

    return JSON.parse(raw) as Memo[]
  }

  private async writeAll(memos: Memo[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memos))
  }
}
