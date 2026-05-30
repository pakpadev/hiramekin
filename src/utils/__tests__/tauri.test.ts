import { isTauri } from '../tauri'

describe('isTauri', () => {
  it('returns false when __TAURI__ is not present', () => {
    delete (window as any).__TAURI__
    delete (window as any).__TAURI_INTERNALS__
    expect(isTauri()).toBe(false)
  })

  it('returns true when __TAURI__ is present', () => {
    ;(window as any).__TAURI__ = {}
    expect(isTauri()).toBe(true)
    delete (window as any).__TAURI__
  })

  it('returns true when __TAURI_INTERNALS__ is present', () => {
    ;(window as any).__TAURI_INTERNALS__ = {}
    expect(isTauri()).toBe(true)
    delete (window as any).__TAURI_INTERNALS__
  })
})
