<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import request from '@/api/request'
import type { Post } from '@/types'
import { useAuthStore } from '@/stores/auth'
import { usePostStore } from '@/stores/post'
import PostCard from '@/components/PostCard.vue'
import CommentSection from '@/components/CommentSection.vue'

const route = useRoute()
const authStore = useAuthStore()
const postStore = usePostStore()

const post = ref<Post | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const id = Number(route.params.id)
    const res = await request.get<Post>(`/posts/${id}`)
    post.value = res.data
  } catch {
    post.value = null
  } finally {
    loading.value = false
  }
})

async function handleDelete() {
  if (!post.value) return
  await postStore.removePost(post.value.id)
  window.history.back()
}
</script>

<template>
  <div class="post-detail">
    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="!post" class="empty">帖子不存在或已被删除</div>

    <template v-else>
      <PostCard :post="post" @delete="handleDelete" />
      <CommentSection :post-id="post.id" />
    </template>
  </div>
</template>

<style scoped>
.post-detail {
  max-width: 640px;
  margin: 0 auto;
}

.loading,
.empty {
  text-align: center;
  padding: 60px 0;
  color: var(--text-muted);
  font-size: 15px;
}
</style>
