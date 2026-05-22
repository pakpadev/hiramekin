import { fireEvent, render, screen } from '@testing-library/react-native'
import { createRef } from 'react'
import { InputArea } from '@/components/InputArea'

describe('InputArea', () => {
  it('content を表示する', () => {
    render(
      <InputArea
        content="テストテキスト"
        onChange={jest.fn()}
        onBlur={jest.fn()}
        autoFocus={false}
      />,
    )

    expect(screen.getByDisplayValue('テストテキスト')).toBeTruthy()
  })

  it('テキスト変更で onChange が呼ばれる', () => {
    const onChange = jest.fn()
    render(
      <InputArea
        content=""
        onChange={onChange}
        onBlur={jest.fn()}
        autoFocus={false}
      />,
    )

    fireEvent.changeText(screen.getByTestId('memo-input'), '新しいテキスト')

    expect(onChange).toHaveBeenCalledWith('新しいテキスト')
  })

  it('数式行の結果を表示してタップで折り畳む', () => {
    render(
      <InputArea
        content="100 + 200"
        onChange={jest.fn()}
        onBlur={jest.fn()}
        autoFocus={false}
      />,
    )

    fireEvent.press(screen.getByText('300'))

    expect(screen.getByText('300')).toBeTruthy()
  })

  it('insertRef で選択範囲にテキストを挿入する', () => {
    const insertRef = createRef<((text: string) => void) | null>()
    const onChange = jest.fn()
    render(
      <InputArea
        content="abc"
        onChange={onChange}
        onBlur={jest.fn()}
        autoFocus={false}
        insertRef={insertRef}
      />,
    )

    fireEvent(screen.getByTestId('memo-input'), 'selectionChange', {
      nativeEvent: { selection: { start: 1, end: 2 } },
    })
    insertRef.current?.('Z')

    expect(onChange).toHaveBeenCalledWith('aZc')
  })
})
