export interface Memo {
  id: string
  content: string
  isPinned: boolean
  isArchived: boolean
  notifyAt: number | null
  createdAt: number
  updatedAt: number
}

export interface AppSettings {
  theme: 'system' | 'light' | 'dark'
}

export interface UIState {
  editingMemoId: string | null
  searchQuery: string
  showArchive: boolean
  isListening: boolean
}
