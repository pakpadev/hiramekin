import { formatDateTime, formatTime, formatToday } from '@/utils/dateTime'

describe('formatToday', () => {
  it('YYYY/MM/DD formatで返す', () => {
    const result = formatToday(new Date('2026-05-21T10:00:00'))

    expect(result).toBe('2026/05/21')
  })

  it('月と日が1桁のとき0埋めする', () => {
    const result = formatToday(new Date('2026-01-05T10:00:00'))

    expect(result).toBe('2026/01/05')
  })
})

describe('formatTime', () => {
  it('HH:MM formatで返す', () => {
    const result = formatTime(new Date('2026-05-21T09:05:00'))

    expect(result).toBe('09:05')
  })
})

describe('formatDateTime', () => {
  it('YYYY/MM/DD HH:MM formatで返す', () => {
    const result = formatDateTime(new Date('2026-05-21T09:05:00'))

    expect(result).toBe('2026/05/21 09:05')
  })
})
