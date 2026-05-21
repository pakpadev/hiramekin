import { evaluateLine, isCalculableLine } from '@/services/calculator'

describe('isCalculableLine', () => {
  it('数字と演算子を含む行をtrueにする', () => {
    expect(isCalculableLine('100 + 200')).toBe(true)
    expect(isCalculableLine('1000 * 0.08')).toBe(true)
    expect(isCalculableLine('(100 + 200) * 3')).toBe(true)
  })

  it('テキストのみの行をfalseにする', () => {
    expect(isCalculableLine('ふつうのテキスト')).toBe(false)
    expect(isCalculableLine('会議メモ')).toBe(false)
  })

  it('数字だけの行をfalseにする', () => {
    expect(isCalculableLine('1000')).toBe(false)
  })

  it('空行をfalseにする', () => {
    expect(isCalculableLine('')).toBe(false)
  })
})

describe('evaluateLine', () => {
  it('四則演算を計算する', () => {
    expect(evaluateLine('100 + 200')).toBe('300')
    expect(evaluateLine('10 - 3')).toBe('7')
    expect(evaluateLine('5 * 6')).toBe('30')
    expect(evaluateLine('10 / 4')).toBe('2.5')
  })

  it('パーセントを計算する', () => {
    expect(evaluateLine('1000 * 0.08')).toBe('80')
  })

  it('括弧を計算する', () => {
    expect(evaluateLine('(100 + 200) * 3')).toBe('900')
  })

  it('不正な数式はnullを返す', () => {
    expect(evaluateLine('100 +')).toBeNull()
    expect(evaluateLine('abc + def')).toBeNull()
  })

  it('= 以降を無視して計算する', () => {
    expect(evaluateLine('100 + 200 =')).toBe('300')
    expect(evaluateLine('100 + 200 = 999')).toBe('300')
  })
})
