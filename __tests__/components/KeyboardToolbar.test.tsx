import { fireEvent, render, screen } from '@testing-library/react-native'
import { KeyboardToolbar } from '@/components/KeyboardToolbar'

describe('KeyboardToolbar', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('「タイム」ボタンで onInsert が日時で呼ばれる', () => {
    const onInsert = jest.fn()
    jest.useFakeTimers().setSystemTime(new Date('2026-05-21T10:30:00'))

    render(<KeyboardToolbar onInsert={onInsert} onMic={jest.fn()} />)
    fireEvent.press(screen.getByText('タイム ▾'))

    expect(onInsert).toHaveBeenCalledWith('2026/05/21 10:30')
  })

  it('「タイム」ボタンの長押しメニューから日付のみを挿入できる', () => {
    const onInsert = jest.fn()
    jest.useFakeTimers().setSystemTime(new Date('2026-05-21T10:30:00'))

    render(<KeyboardToolbar onInsert={onInsert} onMic={jest.fn()} />)
    fireEvent(screen.getByText('タイム ▾'), 'longPress')
    fireEvent.press(screen.getByText('日付のみ'))

    expect(onInsert).toHaveBeenCalledWith('2026/05/21')
  })

  it('「タイム」ボタンの長押しメニューから時刻のみを挿入できる', () => {
    const onInsert = jest.fn()
    jest.useFakeTimers().setSystemTime(new Date('2026-05-21T09:05:00'))

    render(<KeyboardToolbar onInsert={onInsert} onMic={jest.fn()} />)
    fireEvent(screen.getByText('タイム ▾'), 'longPress')
    fireEvent.press(screen.getByText('時刻のみ'))

    expect(onInsert).toHaveBeenCalledWith('09:05')
  })

  it('「= 計算」ボタンでサンプル式を挿入する', () => {
    const onInsert = jest.fn()
    render(<KeyboardToolbar onInsert={onInsert} onMic={jest.fn()} />)

    fireEvent.press(screen.getByText('= 計算'))

    expect(onInsert).toHaveBeenCalledWith('合計: 100 + 200')
  })

  it('「議事録」ボタンで日時入りテンプレートを挿入する', () => {
    const onInsert = jest.fn()
    jest.useFakeTimers().setSystemTime(new Date('2026-05-21T09:05:00'))

    render(<KeyboardToolbar onInsert={onInsert} onMic={jest.fn()} />)
    fireEvent.press(screen.getByText('議事録'))

    expect(onInsert).toHaveBeenCalledWith(
      [
        '## 議事録',
        '日時: 2026/05/21 09:05',
        '参加者: ',
        '',
        '### 議題',
        '- ',
        '',
        '### 決定事項',
        '- ',
        '',
        '### アクションアイテム',
        '- [ ] 担当:  期日: ',
      ].join('\n'),
    )
  })

  it('「マイク」ボタンで onMic が呼ばれる', () => {
    const onMic = jest.fn()
    render(<KeyboardToolbar onInsert={jest.fn()} onMic={onMic} />)

    fireEvent.press(screen.getByTestId('mic-button'))

    expect(onMic).toHaveBeenCalled()
  })
})
