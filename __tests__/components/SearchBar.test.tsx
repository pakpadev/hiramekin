import { fireEvent, render, screen } from '@testing-library/react-native'
import { SearchBar } from '@/components/SearchBar'

describe('SearchBar', () => {
  it('入力値を onChange に渡す', () => {
    const onChange = jest.fn()
    render(<SearchBar value="" onChange={onChange} />)

    fireEvent.changeText(screen.getByPlaceholderText('検索'), 'テスト')

    expect(onChange).toHaveBeenCalledWith('テスト')
  })

  it('クリアボタンで空文字を渡す', () => {
    const onChange = jest.fn()
    render(<SearchBar value="テスト" onChange={onChange} />)

    fireEvent.press(screen.getByTestId('clear-button'))

    expect(onChange).toHaveBeenCalledWith('')
  })

  it('value が空のときクリアボタンを非表示にする', () => {
    render(<SearchBar value="" onChange={jest.fn()} />)

    expect(screen.queryByTestId('clear-button')).toBeNull()
  })
})
