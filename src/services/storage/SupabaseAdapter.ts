import type { Memo } from '@/types'
import type { IStorage } from './IStorage'

export class SupabaseAdapter implements IStorage {
  async getAll(): Promise<Memo[]> {
    throw new Error('Not implemented')
  }

  async getArchived(): Promise<Memo[]> {
    throw new Error('Not implemented')
  }

  async save(_memo: Memo): Promise<void> {
    throw new Error('Not implemented')
  }

  async archive(_id: string): Promise<void> {
    throw new Error('Not implemented')
  }

  async restore(_id: string): Promise<void> {
    throw new Error('Not implemented')
  }

  async deletePermanently(_id: string): Promise<void> {
    throw new Error('Not implemented')
  }

  async search(_query: string): Promise<Memo[]> {
    throw new Error('Not implemented')
  }
}
