import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { OverlayApp } from '../OverlayApp'

const mockSave = jest.fn().mockResolvedValue(undefined)

jest.mock('@tauri-apps/api/core', () => ({
  invoke: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('expo-speech-recognition', () => ({
  ExpoSpeechRecognitionModule: {
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
    start: jest.fn(),
    stop: jest.fn(),
  },
}))

jest.mock('@/services/storage', () => ({
  getStorage: () => ({
    save: mockSave,
  }),
}))

describe('OverlayApp', () => {
  beforeEach(() => {
    mockSave.mockClear()
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: jest.fn().mockReturnValue(null),
        setItem: jest.fn(),
      },
    })
  })

  it('renders the regular input tools without a save button', () => {
    const { getByPlaceholderText, getByText, queryByText } = render(<OverlayApp />)

    expect(getByPlaceholderText('メモを書く　　100+200 で計算できます')).toBeTruthy()
    expect(getByText('タイム ▾')).toBeTruthy()
    expect(getByText('= 計算')).toBeTruthy()
    expect(getByText('議事録')).toBeTruthy()
    expect(getByText('マイク')).toBeTruthy()
    expect(getByText('透明度 88%')).toBeTruthy()
    expect(getByText('新規')).toBeTruthy()
    expect(queryByText('保存')).toBeNull()
  })

  it('auto-saves input changes', async () => {
    jest.useFakeTimers()
    const { getByPlaceholderText } = render(<OverlayApp />)

    fireEvent.changeText(
      getByPlaceholderText('メモを書く　　100+200 で計算できます'),
      'テストメモ',
    )
    jest.runOnlyPendingTimers()

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalled()
    })
    jest.useRealTimers()
  })

  it('can start a new memo without a save button', async () => {
    jest.useFakeTimers()
    const { getByPlaceholderText, getByText } = render(<OverlayApp />)
    const input = getByPlaceholderText('メモを書く　　100+200 で計算できます')

    fireEvent.changeText(input, '1つ目')
    fireEvent.press(getByText('新規'))

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalled()
    })
    const firstSavedId = mockSave.mock.calls[0][0].id

    fireEvent.changeText(input, '2つ目')
    jest.runOnlyPendingTimers()

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(2)
    })
    expect(mockSave.mock.calls[1][0].id).not.toBe(firstSavedId)
    expect(getByPlaceholderText('メモを書く　　100+200 で計算できます')).toBeTruthy()
    jest.useRealTimers()
  })
})
