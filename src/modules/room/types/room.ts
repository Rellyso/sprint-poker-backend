export interface UserSession {
  userId: string
  socketIds: Set<string>
  userData: {
    name: string
    email: string
  }
}

export interface UserJoinData {
  userId: string
  name: string
  email: string
  vote: string | null
}

export interface Vote {
  userId: string
  value: string | number
  isRevealed: boolean
}
