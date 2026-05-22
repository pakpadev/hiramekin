import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { Linking } from 'react-native'
import { SettingsScreen } from '@/screens/SettingsScreen'
import type { IStorage } from '@/services/storage/IStorage'
import type { Memo } from '@/types'

const archivedMemo: Memo = {
  id: 'archived-1',
  content: 'アーカイブ済みメモ',
  isPinned: false,
  isArchived: true,
  notifyAt: null,
  createdAt: 1000,
  updatedAt: 2000,
}

const mockStorage: jest.Mocked<IStorage> = {
  getAll: jest.fn(),
  getArchived: jest.fn(),
  save: jest.fn(),
  archive: jest.fn(),
  restore: jest.fn(),
  deletePermanently: jest.fn(),
  search: jest.fn(),
}

jest.mock('@/services/storage', () => ({
  getStorage: () => mockStorage,
}))

jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined)

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockStorage.getArchived.mockResolvedValue([archivedMemo])
  })

  it('閉じるボタンで onClose が呼ばれる', () => {
    const onClose = jest.fn()
    render(<SettingsScreen onClose={onClose} />)

    fireEvent.press(screen.getByText('閉じる'))

    expect(onClose).toHaveBeenCalled()
  })

  it('アーカイブ一覧を表示する', async () => {
    render(<SettingsScreen onClose={jest.fn()} />)

    fireEvent.press(screen.getByText('アーカイブを見る'))

    expect(await screen.findByText('アーカイブ済みメモ')).toBeTruthy()
    expect(mockStorage.getArchived).toHaveBeenCalled()
  })

  it('復元後にアーカイブ一覧を再読み込みする', async () => {
    render(<SettingsScreen onClose={jest.fn()} />)

    fireEvent.press(screen.getByText('アーカイブを見る'))
    await screen.findByText('アーカイブ済みメモ')
    fireEvent.press(screen.getByText('復元'))

    await waitFor(() => {
      expect(mockStorage.restore).toHaveBeenCalledWith('archived-1')
      expect(mockStorage.getArchived).toHaveBeenCalledTimes(2)
    })
  })

  it('アーカイブが空の場合は空表示を出す', async () => {
    mockStorage.getArchived.mockResolvedValue([])
    render(<SettingsScreen onClose={jest.fn()} />)

    fireEvent.press(screen.getByText('アーカイブを見る'))

    expect(await screen.findByText('アーカイブはありません')).toBeTruthy()
  })

  it('APKダウンロードページを開く', () => {
    render(<SettingsScreen onClose={jest.fn()} />)

    fireEvent.press(screen.getByText('Android APKをダウンロード'))

    expect(Linking.openURL).toHaveBeenCalledWith(
      'https://github.com/pakpadev/hiramekin/releases/download/v1.0.1-beta/hiramekin-v1.0.1-beta.apk',
    )
  })
})
