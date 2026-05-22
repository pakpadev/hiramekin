import { fireEvent, render, screen } from '@testing-library/react-native'
import { VoiceInput } from '@/components/VoiceInput'

describe('VoiceInput', () => {
  it('visible が true のとき音声入力オーバーレイを表示する', () => {
    render(<VoiceInput visible={true} onCancel={jest.fn()} />)

    expect(screen.getByText('聞いています...')).toBeTruthy()
    expect(screen.getByText('キャンセル')).toBeTruthy()
  })

  it('キャンセルボタンで onCancel が呼ばれる', () => {
    const onCancel = jest.fn()
    render(<VoiceInput visible={true} onCancel={onCancel} />)

    fireEvent.press(screen.getByText('キャンセル'))

    expect(onCancel).toHaveBeenCalled()
  })
})
