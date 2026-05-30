import { check } from '@tauri-apps/plugin-updater'
import { ask, message } from '@tauri-apps/plugin-dialog'
import { isTauri } from '@/utils/tauri'

export async function checkForDesktopUpdate(): Promise<void> {
  if (!isTauri()) return

  try {
    const update = await check()

    if (!update) return

    const shouldInstall = await ask(
      `新しいバージョン（v${update.version}）が利用可能です。今すぐ更新しますか？`,
      {
        title: 'Hiramekin',
        kind: 'info',
        okLabel: '更新する',
        cancelLabel: '後で',
      },
    )

    if (!shouldInstall) return

    await update.downloadAndInstall()
  } catch (error) {
    console.error('Update check failed:', error)
    await message('アップデート確認に失敗しました。時間をおいて再度お試しください。', {
      title: 'Hiramekin',
      kind: 'error',
    }).catch(() => {})
  }
}
