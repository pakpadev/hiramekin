import { act, renderHook } from '@testing-library/react-native'
import { useCalc } from '@/hooks/useCalc'

describe('useCalc', () => {
  it('数式行の結果を返す', () => {
    const { result } = renderHook(() => useCalc('100 + 200\nテキスト\n5 * 6'))

    expect(result.current.getLineResult(0)).toBe('300')
    expect(result.current.getLineResult(1)).toBeNull()
    expect(result.current.getLineResult(2)).toBe('30')
  })

  it('範囲外の行はnullを返す', () => {
    const { result } = renderHook(() => useCalc('100 + 200'))

    expect(result.current.getLineResult(5)).toBeNull()
  })

  it('toggleCollapse で行が折り畳まれる', () => {
    const { result } = renderHook(() => useCalc('100 + 200'))

    expect(result.current.isCollapsed(0)).toBe(false)

    act(() => result.current.toggleCollapse(0))
    expect(result.current.isCollapsed(0)).toBe(true)

    act(() => result.current.toggleCollapse(0))
    expect(result.current.isCollapsed(0)).toBe(false)
  })

  it('getDisplayLine は折り畳み行では計算結果を返す', () => {
    const { result } = renderHook(() => useCalc('100 + 200'))

    expect(result.current.getDisplayLine(0)).toBe('100 + 200')

    act(() => result.current.toggleCollapse(0))

    expect(result.current.getDisplayLine(0)).toBe('300')
  })

  it('content 変更時にcollapsed状態がリセットされる', () => {
    const { result, rerender } = renderHook(
      ({ content }: { content: string }) => useCalc(content),
      {
        initialProps: { content: '100 + 200' },
      },
    )

    act(() => result.current.toggleCollapse(0))
    expect(result.current.isCollapsed(0)).toBe(true)

    rerender({ content: '200 + 300' })

    expect(result.current.isCollapsed(0)).toBe(false)
    expect(result.current.getLineResult(0)).toBe('500')
  })
})
