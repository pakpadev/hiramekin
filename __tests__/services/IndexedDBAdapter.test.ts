import 'fake-indexeddb/auto'
import { IndexedDBAdapter } from '@/services/storage/IndexedDBAdapter'
import type { Memo } from '@/types'

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

describe('IndexedDBAdapter', () => {
  let adapter: IndexedDBAdapter

  beforeEach(async () => {
    adapter = new IndexedDBAdapter()
    await adapter.clear()
  })

  afterEach(() => {
    adapter.close()
  })

  it('メモを保存して全件取得できる', async () => {
    await adapter.save(makeMemo())

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

  it('getArchived はアーカイブ済みだけを返す', async () => {
    await adapter.save(makeMemo({ id: 'a', isArchived: false }))
    await adapter.save(makeMemo({ id: 'b', isArchived: true }))

    const archived = await adapter.getArchived()

    expect(archived).toHaveLength(1)
    expect(archived[0].id).toBe('b')
  })

  it('アーカイブ・復元・完全削除が正しく動作する', async () => {
    await adapter.save(makeMemo({ id: 'a' }))

    await adapter.archive('a')
    expect(await adapter.getAll()).toHaveLength(0)
    expect(await adapter.getArchived()).toHaveLength(1)

    await adapter.restore('a')
    expect(await adapter.getAll()).toHaveLength(1)

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
