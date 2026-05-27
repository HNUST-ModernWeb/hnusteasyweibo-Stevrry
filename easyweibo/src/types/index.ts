export interface User {
  id: number
  username: string
  nickname: string
  avatar: string
  gender: string
  cardColor: string
  createdAt: string
}

export interface LoginParams {
  username: string
  password: string
}

export interface RegisterParams {
  username: string
  password: string
  nickname: string
}

export interface UpdateProfileParams {
  nickname?: string
  avatar?: string
  gender?: string
  cardColor?: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface Post {
  id: number
  title: string
  content: string
  userId: number
  username: string
  nickname: string
  avatar: string
  createdAt: string
  commentCount: number
  likeCount: number
  isLiked: boolean
  tags: string[]
}

export interface Comment {
  id: number
  content: string
  userId: number
  username: string
  nickname: string
  avatar: string
  postId: number
  parentId: number | null
  replyToUserId: number | null
  replyToUsername: string
  replyToNickname: string
  createdAt: string
}

export type ThemeMode = 'light' | 'dark' | 'system'

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}
