export interface UserReplay {
  uploadtime: number
  id: string
  format: string
  players: string[]
  rating: number
  private: 0 | 1
  password: string | null
}

export interface BattleReplay {
  id: string
  format: string
  players: string[]
  log: string
  uploadtime: number
  views: number
  formatid: string
  rating: number
  private: 0 | 1
  password: null | string
}
