import request from './request'
import type { Comment } from '@/types'

export function getComments(postId: number) {
  return request.get<Comment[]>(`/posts/${postId}/comments`)
}

export function createComment(postId: number, content: string, parentId?: number, replyToUserId?: number) {
  return request.post<Comment>(`/posts/${postId}/comments`, { content, parentId, replyToUserId })
}

export function deleteComment(commentId: number) {
  return request.delete(`/comments/${commentId}`)
}
