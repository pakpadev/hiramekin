import { Platform } from 'react-native'
import { AsyncStorageAdapter } from './AsyncStorageAdapter'
import type { IStorage } from './IStorage'
import { IndexedDBAdapter } from './IndexedDBAdapter'

let storage: IStorage | null = null

export function getStorage(): IStorage {
  if (storage) return storage

  storage =
    Platform.OS === 'web' ? new IndexedDBAdapter() : new AsyncStorageAdapter()

  return storage
}
