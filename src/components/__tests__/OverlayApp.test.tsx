import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { OverlayApp } from '../OverlayApp'

const mockSave = jest.fn().mockResolvedValue(undefined)
const mockStartDragging = jest.fn().mockResolvedValue(undefined)

jest.mock('@tauri-apps/api/core', () => ({
  invoke: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: jest.fn(() => ({
    startDragging: mockStartDragging,
  })),
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
    mockStartDragging.mockClear()
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: jest.fn().mockReturnValue(null),
        setItem: jest.fn(),
      },
    })
  })

  it('renders the regular input tools without a save button', () => {
    const { getByPlaceholderText, getByTestId, getByText, queryByText } = render(<OverlayApp />)

    expect(getByPlaceholderText('メモを書く　　100+200 で計算できます')).toBeTruthy()
    expect(getByText('タイム ▾')).toBeTruthy()
    expect(getByText('= 計算')).toBeTruthy()
    expect(getByText('議事録')).toBeTruthy()
    expect(getByText('マイク')).toBeTruthy()
    expect(getByTestId('normal-opacity-meter')).toBeTruthy()
    expect(getByTestId('overlay-new-memo-button')).toBeTruthy()
    expect(queryByText('保存')).toBeNull()
  })

  it('adjusts normal opacity in five percent steps', () => {
    const setItem = jest.fn()
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: jest.fn().mockReturnValue(null),
        setItem,
      },
    })
    const { getByTestId } = render(<OverlayApp />)

    fireEvent.press(getByTestId('normal-opacity-increase'))

    expect(getByTestId('normal-opacity-meter')).toBeTruthy()
    expect(setItem).toHaveBeenCalledWith('hiramekin-overlay-normal-opacity', '50')
  })

  it('uses the header as the overlay drag region', () => {
    const { getByTestId } = render(<OverlayApp />)

    expect(getByTestId('overlay-drag-region')).toBeTruthy()
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
    const { getByPlaceholderText, getByTestId } = render(<OverlayApp />)
    const input = getByPlaceholderText('メモを書く　　100+200 で計算できます')

    fireEvent.changeText(input, '1つ目')
    fireEvent.press(getByTestId('overlay-new-memo-button'))

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
