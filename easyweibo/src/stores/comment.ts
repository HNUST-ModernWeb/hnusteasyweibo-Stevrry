import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Comment } from '@/types'
import { getComments, createComment as createCommentApi, deleteComment as deleteCommentApi } from '@/api/comment'

export const useCommentStore = defineStore('comment', () => {
  const comments = ref<Comment[]>([])
  const loading = ref(false)

  async function fetchComments(postId: number) {
    loading.value = true
    try {
      const res = await getComments(postId)
      comments.value = res.data
    } finally {
      loading.value = false
    }
  }

  async function addComment(postId: number, content: string, parentId?: number, replyToUserId?: number) {
    const res = await createCommentApi(postId, content, parentId, replyToUserId)
    comments.value.push(res.data)
  }

  async function removeComment(commentId: number) {
    await deleteCommentApi(commentId)
    comments.value = comments.value.filter((c) => c.id !== commentId)
  }

  return { comments, loading, fetchComments, addComment, removeComment }
})
