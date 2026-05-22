import { fireEvent, render, screen } from '@testing-library/react-native'
import { KeyboardToolbar } from '@/components/KeyboardToolbar'

describe('KeyboardToolbar', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('「今日」ボタンで onInsert が今日の日付で呼ばれる', () => {
    const onInsert = jest.fn()
    jest.useFakeTimers().setSystemTime(new Date('2026-05-21T10:00:00'))

    render(<KeyboardToolbar onInsert={onInsert} onMic={jest.fn()} />)
    fireEvent.press(screen.getByText('今日'))

    expect(onInsert).toHaveBeenCalledWith('2026/05/21')
  })

  it('「時刻」ボタンで onInsert が時刻で呼ばれる', () => {
    const onInsert = jest.fn()
    jest.useFakeTimers().setSystemTime(new Date('2026-05-21T09:05:00'))

    render(<KeyboardToolbar onInsert={onInsert} onMic={jest.fn()} />)
    fireEvent.press(screen.getByText('時刻'))

    expect(onInsert).toHaveBeenCalledWith('09:05')
  })

  it('「マイク」ボタンで onMic が呼ばれる', () => {
    const onMic = jest.fn()
    render(<KeyboardToolbar onInsert={jest.fn()} onMic={onMic} />)

    fireEvent.press(screen.getByTestId('mic-button'))

    expect(onMic).toHaveBeenCalled()
  })
})
