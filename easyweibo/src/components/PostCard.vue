<script setup lang="ts">
import { ref } from 'vue'
import type { Post } from '@/types'
import { useAuthStore } from '@/stores/auth'
import { usePostStore } from '@/stores/post'

const props = defineProps<{
  post: Post
}>()

const emit = defineEmits<{
  delete: [id: number]
}>()

const authStore = useAuthStore()
const postStore = usePostStore()
const heartAnimating = ref(false)

function isOwner() {
  return authStore.user?.id === props.post.userId
}

function handleDelete() {
  emit('delete', props.post.id)
}

function handleLike() {
  postStore.toggleLike(props.post.id)
  heartAnimating.value = true
  setTimeout(() => {
    heartAnimating.value = false
  }, 400)
}
</script>

<template>
  <div class="post-card">
    <div class="post-header">
      <div class="avatar">{{ post.nickname.charAt(0) }}</div>
      <div class="meta">
        <span class="nickname">{{ post.nickname }}</span>
        <span class="time">{{ new Date(post.createdAt).toLocaleString() }}</span>
      </div>
      <button v-if="isOwner()" class="delete-btn" title="删除" @click="handleDelete">
        &#128465;
      </button>
    </div>

    <h3 v-if="post.title" class="post-title">{{ post.title }}</h3>
    <div class="post-content">{{ post.content }}</div>

    <div v-if="post.tags && post.tags.length > 0" class="post-tags">
      <span v-for="tag in post.tags" :key="tag" class="tag">#{{ tag }}</span>
    </div>

    <div class="post-footer">
      <router-link :to="`/post/${post.id}`" class="comment-count" title="评论">
        &#128172; 评论({{ post.commentCount || 0 }})
      </router-link>
      <button class="like-btn" :class="{ liked: post.isLiked }" title="点赞" @click="handleLike">
        <span :class="{ 'heart-animate': heartAnimating }">{{ post.isLiked ? '❤' : '♡' }}</span>
        点赞({{ post.likeCount || 0 }})
      </button>
    </div>
  </div>
</template>

<style scoped>
.post-card {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px var(--card-shadow);
  transition: background 0.3s;
}

.post-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}

.meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nickname {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.time {
  font-size: 12px;
  color: var(--text-extra);
}

.delete-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
  opacity: 0.4;
}

.delete-btn:hover {
  opacity: 1;
  color: var(--danger);
  background: var(--danger-bg);
}

.post-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  margin-top: 14px;
  margin-bottom: 8px;
}

.post-content {
  font-size: 15px;
  line-height: 1.7;
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-word;
}

.post-tags {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  color: var(--tag-color);
  font-size: 13px;
  cursor: pointer;
  transition: color 0.2s;
}

.tag:hover {
  color: var(--primary-hover);
}

.post-footer {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--border-light);
  display: flex;
  gap: 24px;
}

.comment-count {
  font-size: 13px;
  color: var(--text-muted);
  transition: color 0.2s;
}

.comment-count:hover {
  color: var(--primary);
}

.like-btn {
  background: none;
  border: none;
  font-size: 13px;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;
}

.like-btn:hover {
  color: var(--danger);
}

.like-btn.liked {
  color: var(--danger);
}
</style>
