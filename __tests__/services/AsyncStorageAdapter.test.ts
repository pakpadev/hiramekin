import AsyncStorage from '@react-native-async-storage/async-storage'
import { AsyncStorageAdapter } from '@/services/storage/AsyncStorageAdapter'
import type { Memo } from '@/types'

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)

const makeMemo = (overrides: Partial<Memo> = {}): Memo => ({
  id: 'test-id',
  content: 'テストメモ',
  isPinned: false,
  isArchived: false,
  notifyAt: null,
  createdAt: 1000,
  updatedAt: 1000,
  ...overrides,
})

describe('AsyncStorageAdapter', () => {
  let adapter: AsyncStorageAdapter

  beforeEach(async () => {
    await AsyncStorage.clear()
    adapter = new AsyncStorageAdapter()
  })

  it('メモを保存して全件取得できる', async () => {
    const memo = makeMemo()

    await adapter.save(memo)

    const all = await adapter.getAll()
    expect(all).toHaveLength(1)
    expect(all[0].id).toBe('test-id')
  })

  it('getAll はアーカイブ済みを除外する', async () => {
    await adapter.save(makeMemo({ id: 'a', isArchived: false }))
    await adapter.save(makeMemo({ id: 'b', isArchived: true }))

    const all = await adapter.getAll()

    expect(all).toHaveLength(1)
    expect(all[0].id).toBe('a')
  })

  it('アーカイブするとgetAllから消える', async () => {
    await adapter.save(makeMemo({ id: 'a' }))

    await adapter.archive('a')

    expect(await adapter.getAll()).toHaveLength(0)
    expect(await adapter.getArchived()).toHaveLength(1)
  })

  it('復元するとgetAllに戻る', async () => {
    await adapter.save(makeMemo({ id: 'a', isArchived: true }))

    await adapter.restore('a')

    expect(await adapter.getAll()).toHaveLength(1)
    expect(await adapter.getArchived()).toHaveLength(0)
  })

  it('完全削除するとgetAllから消える', async () => {
    await adapter.save(makeMemo({ id: 'a' }))

    await adapter.deletePermanently('a')

    expect(await adapter.getAll()).toHaveLength(0)
  })

  it('content の部分一致で検索できる', async () => {
    await adapter.save(makeMemo({ id: 'a', content: 'ひらめき' }))
    await adapter.save(makeMemo({ id: 'b', content: '別のメモ' }))

    const results = await adapter.search('ひらめき')

    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('a')
  })
})
