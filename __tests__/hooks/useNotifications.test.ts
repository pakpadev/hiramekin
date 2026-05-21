import { Alert } from 'react-native'
import { act, renderHook } from '@testing-library/react-native'
import { useNotifications } from '@/hooks/useNotifications'
import {
  calcNotifyAt,
  cancelNotification,
  requestPermission,
  scheduleNotification,
} from '@/services/notifications'

jest.mock('@/services/notifications', () => ({
  calcNotifyAt: jest.fn(() => 1779298800000),
  cancelNotification: jest.fn(async () => undefined),
  requestPermission: jest.fn(async () => true),
  scheduleNotification: jest.fn(async () => 'memo-1'),
}))

describe('useNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn())
  })

  it('権限が許可されると通知をスケジュールしてnotifyAtを返す', async () => {
    const { result } = renderHook(() => useNotifications())

    const notifyAt = await act(async () =>
      result.current.schedule(
        'memo-1',
        '2026/05/21 プレゼン',
        { year: 2026, month: 5, day: 21 },
        'oneDayBefore',
      ),
    )

    expect(requestPermission).toHaveBeenCalled()
    expect(calcNotifyAt).toHaveBeenCalledWith(
      { year: 2026, month: 5, day: 21 },
      'oneDayBefore',
    )
    expect(scheduleNotification).toHaveBeenCalledWith(
      'memo-1',
      '2026/05/21 プレゼン',
      1779298800000,
    )
    expect(notifyAt).toBe(1779298800000)
  })

  it('権限が拒否されるとnullを返してアラートを出す', async () => {
    jest.mocked(requestPermission).mockResolvedValueOnce(false)
    const { result } = renderHook(() => useNotifications())

    const notifyAt = await act(async () =>
      result.current.schedule(
        'memo-1',
        '内容',
        { year: 2026, month: 5, day: 21 },
        'sameDay',
      ),
    )

    expect(notifyAt).toBeNull()
    expect(scheduleNotification).not.toHaveBeenCalled()
    expect(Alert.alert).toHaveBeenCalled()
  })

  it('cancel で通知をキャンセルする', async () => {
    const { result } = renderHook(() => useNotifications())

    await act(async () => {
      await result.current.cancel('memo-1')
    })

    expect(cancelNotification).toHaveBeenCalledWith('memo-1')
  })
})
