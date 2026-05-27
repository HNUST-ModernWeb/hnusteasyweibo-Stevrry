import request from './request'
import type { Post, User, UpdateProfileParams } from '@/types'

export function getUserProfile(userId: number) {
  return request.get<User>(`/users/${userId}`)
}

export function getUserPosts(userId: number, page = 1, pageSize = 10) {
  return request.get<{ list: Post[]; total: number }>(`/users/${userId}/posts`, {
    params: { page, pageSize },
  })
}

export function updateProfile(data: UpdateProfileParams) {
  return request.put<User>('/auth/profile', data)
}
