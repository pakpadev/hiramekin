import type { Memo } from '@/types'

export interface IStorage {
  getAll(): Promise<Memo[]>
  getArchived(): Promise<Memo[]>
  save(memo: Memo): Promise<void>
  archive(id: string): Promise<void>
  restore(id: string): Promise<void>
  deletePermanently(id: string): Promise<void>
  search(query: string): Promise<Memo[]>
}
