<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCommentStore } from '@/stores/comment'
import { useAuthStore } from '@/stores/auth'
import type { Comment } from '@/types'

const props = defineProps<{
  postId: number
}>()

const commentStore = useCommentStore()
const authStore = useAuthStore()

const newComment = ref('')
const submitting = ref(false)
const replyTo = ref<Comment | null>(null)

onMounted(() => {
  commentStore.fetchComments(props.postId)
})

function isOwner(comment: Comment) {
  return authStore.user?.id === comment.userId
}

async function handleAdd() {
  const content = newComment.value.trim()
  if (!content || submitting.value) return
  submitting.value = true
  try {
    if (replyTo.value) {
      await commentStore.addComment(props.postId, content, replyTo.value.id, replyTo.value.userId)
      replyTo.value = null
    } else {
      await commentStore.addComment(props.postId, content)
    }
    newComment.value = ''
  } finally {
    submitting.value = false
  }
}

async function handleDelete(commentId: number) {
  await commentStore.removeComment(commentId)
}

function startReply(comment: Comment) {
  replyTo.value = comment
  newComment.value = ''
}

function cancelReply() {
  replyTo.value = null
  newComment.value = ''
}
</script>

<template>
  <div class="comment-section">
    <h3>评论 ({{ commentStore.comments.length }})</h3>

    <div class="comment-input">
      <div v-if="replyTo" class="reply-indicator">
        回复 <strong>{{ replyTo.nickname }}</strong>
        <button class="cancel-reply" @click="cancelReply">取消</button>
      </div>
      <textarea
        v-model="newComment"
        :placeholder="replyTo ? '写下你的回复...' : '写下你的评论...'"
        maxlength="200"
        rows="2"
      ></textarea>
      <button :disabled="!newComment.trim() || submitting" @click="handleAdd">
        {{ submitting ? '发送中...' : '发送' }}
      </button>
    </div>

    <div v-if="commentStore.loading" class="loading">加载评论中...</div>

    <div v-else-if="commentStore.comments.length === 0" class="empty">
      暂无评论，来发表第一条评论吧
    </div>

    <div v-else class="comment-list">
      <div v-for="comment in commentStore.comments" :key="comment.id" class="comment-item">
        <div class="comment-avatar">{{ comment.nickname.charAt(0) }}</div>
        <div class="comment-body">
          <div class="comment-header">
            <span class="comment-nickname">{{ comment.nickname }}</span>
            <span class="comment-time">{{ new Date(comment.createdAt).toLocaleString() }}</span>
          </div>
          <div v-if="comment.replyToNickname" class="reply-context">
            {{ comment.nickname }} 回复 {{ comment.replyToNickname }}
          </div>
          <div class="comment-content">{{ comment.content }}</div>
          <button class="reply-btn" @click="startReply(comment)">回复</button>
        </div>
        <button
          v-if="isOwner(comment)"
          class="comment-delete"
          @click="handleDelete(comment.id)"
        >
          删除
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.comment-section {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px var(--card-shadow);
}

h3 {
  font-size: 16px;
  color: var(--text);
  margin-bottom: 16px;
}

.comment-input {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.reply-indicator {
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--bg);
  padding: 6px 12px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.cancel-reply {
  background: none;
  border: none;
  color: var(--danger);
  font-size: 12px;
  cursor: pointer;
  margin-left: auto;
}

.comment-input textarea {
  flex: 1;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 14px;
  resize: vertical;
  outline: none;
  font-family: inherit;
  background: var(--card-bg);
  color: var(--text);
  transition: border-color 0.2s;
}

.comment-input textarea:focus {
  border-color: var(--primary);
}

.comment-input button {
  padding: 8px 18px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  align-self: flex-end;
  transition: background 0.2s;
  white-space: nowrap;
}

.comment-input button:hover:not(:disabled) {
  background: var(--primary-hover);
}

.comment-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading,
.empty {
  text-align: center;
  padding: 30px 0;
  color: var(--text-muted);
  font-size: 14px;
}

.comment-item {
  display: flex;
  gap: 10px;
  padding: 14px 0;
  border-bottom: 1px solid var(--border-light);
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #764ba2;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.comment-body {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.comment-nickname {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
}

.comment-time {
  font-size: 11px;
  color: var(--text-extra);
}

.reply-context {
  font-size: 12px;
  color: var(--reply-color);
  margin-bottom: 4px;
}

.comment-content {
  font-size: 14px;
  color: var(--text);
  line-height: 1.6;
  word-break: break-word;
  margin-bottom: 4px;
}

.reply-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;
}

.reply-btn:hover {
  color: var(--primary);
}

.comment-delete {
  background: none;
  border: none;
  color: #ccc;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  align-self: flex-start;
  transition: all 0.2s;
  white-space: nowrap;
}

.comment-delete:hover {
  color: var(--danger);
  background: var(--danger-bg);
}
</style>
