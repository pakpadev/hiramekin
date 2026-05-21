import { calcNotifyAt, detectDate } from '@/services/notifications'

jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: {
    DATE: 'date',
  },
  cancelScheduledNotificationAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
}))

describe('detectDate', () => {
  it('YYYY/MM/DD 形式の最初の日付を返す', () => {
    expect(detectDate('2026/05/21 プレゼン準備')).toEqual({
      year: 2026,
      month: 5,
      day: 21,
    })
  })

  it('複数の日付があるとき最初の1件を返す', () => {
    expect(detectDate('2026/05/21 から 2026/06/01 まで')).toEqual({
      year: 2026,
      month: 5,
      day: 21,
    })
  })

  it('日付がないとき null を返す', () => {
    expect(detectDate('ふつうのメモ')).toBeNull()
  })

  it('存在しない日付は null を返す', () => {
    expect(detectDate('2026/02/31 メモ')).toBeNull()
  })
})

describe('calcNotifyAt', () => {
  it('当日朝8時のタイムスタンプを返す', () => {
    const result = calcNotifyAt({ year: 2026, month: 5, day: 21 }, 'sameDay')
    const expected = new Date('2026-05-21T08:00:00+09:00').getTime()

    expect(result).toBe(expected)
  })

  it('1日前朝8時のタイムスタンプを返す', () => {
    const result = calcNotifyAt(
      { year: 2026, month: 5, day: 21 },
      'oneDayBefore',
    )
    const expected = new Date('2026-05-20T08:00:00+09:00').getTime()

    expect(result).toBe(expected)
  })

  it('1週間前朝8時のタイムスタンプを返す', () => {
    const result = calcNotifyAt(
      { year: 2026, month: 5, day: 21 },
      'oneWeekBefore',
    )
    const expected = new Date('2026-05-14T08:00:00+09:00').getTime()

    expect(result).toBe(expected)
  })
})
