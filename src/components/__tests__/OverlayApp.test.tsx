import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { OverlayApp } from '../OverlayApp'

jest.mock('@tauri-apps/api/core', () => ({
  invoke: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/services/storage', () => ({
  getStorage: () => ({
    save: jest.fn().mockResolvedValue(undefined),
  }),
}))

describe('OverlayApp', () => {
  it('renders input and submit button', () => {
    const { getByPlaceholderText, getByText } = render(<OverlayApp />)

    expect(getByPlaceholderText('ひらめきを入力...')).toBeTruthy()
    expect(getByText('保存')).toBeTruthy()
  })

  it('clears input after submit', async () => {
    const { getByDisplayValue, getByPlaceholderText, getByText } = render(
      <OverlayApp />,
    )

    fireEvent.changeText(getByPlaceholderText('ひらめきを入力...'), 'テストメモ')
    fireEvent.press(getByText('保存'))

    await waitFor(() => {
      expect(getByDisplayValue('')).toBeTruthy()
    })
  })
})
