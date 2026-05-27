import request from './request'
import type { Post } from '@/types'

export function getPosts(params: { page?: number; pageSize?: number; search?: string; tag?: string }) {
  return request.get<{ list: Post[]; total: number }>('/posts', { params })
}

export function createPost(title: string, content: string) {
  return request.post<Post>('/posts', { title, content })
}

export function deletePost(id: number) {
  return request.delete(`/posts/${id}`)
}

export function toggleLike(postId: number) {
  return request.post<{ liked: boolean; likeCount: number }>(`/posts/${postId}/like`)
}
