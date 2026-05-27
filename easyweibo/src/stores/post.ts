import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Post } from '@/types'
import { getPosts, createPost as createPostApi, deletePost as deletePostApi, toggleLike as toggleLikeApi } from '@/api/post'

export const usePostStore = defineStore('post', () => {
  const posts = ref<Post[]>([])
  const total = ref(0)
  const page = ref(1)
  const loading = ref(false)

  async function fetchPosts(reset = false, search = '', tag = '') {
    if (reset) page.value = 1
    loading.value = true
    try {
      const res = await getPosts({ page: page.value, search, tag })
      if (reset) {
        posts.value = res.data.list
      } else {
        posts.value.push(...res.data.list)
      }
      total.value = res.data.total
    } finally {
      loading.value = false
    }
  }

  async function addPost(title: string, content: string) {
    const res = await createPostApi(title, content)
    posts.value.unshift(res.data)
  }

  async function removePost(id: number) {
    await deletePostApi(id)
    posts.value = posts.value.filter((p) => p.id !== id)
  }

  async function toggleLike(postId: number) {
    const res = await toggleLikeApi(postId)
    const post = posts.value.find((p) => p.id === postId)
    if (post) {
      post.isLiked = res.data.liked
      post.likeCount = res.data.likeCount
    }
  }

  function loadMore(search = '', tag = '') {
    page.value++
    fetchPosts(false, search, tag)
  }

  return { posts, total, page, loading, fetchPosts, addPost, removePost, toggleLike, loadMore }
})
