<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePostStore } from '@/stores/post'
import PostCard from '@/components/PostCard.vue'

const postStore = usePostStore()
const title = ref('')
const newPost = ref('')
const submitting = ref(false)
const searchText = ref('')
const filterTag = ref('')
const rawTagInput = ref('')

onMounted(() => {
  postStore.fetchPosts(true)
})

async function handleCreate() {
  const content = newPost.value.trim()
  if (!content || submitting.value) return
  submitting.value = true
  try {
    await postStore.addPost(title.value.trim(), content)
    title.value = ''
    newPost.value = ''
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id: number) {
  await postStore.removePost(id)
}

function handleSearch() {
  const tag = rawTagInput.value.trim()
  filterTag.value = tag
  postStore.fetchPosts(true, searchText.value, tag)
}

function handleTagClick(tag: string) {
  filterTag.value = tag
  rawTagInput.value = tag
  postStore.fetchPosts(true, searchText.value, tag)
}

function clearFilter() {
  searchText.value = ''
  filterTag.value = ''
  rawTagInput.value = ''
  postStore.fetchPosts(true, '', '')
}
</script>

<template>
  <div class="home">
    <div class="create-post">
      <input
        v-model="title"
        type="text"
        placeholder="文章标题"
        maxlength="100"
        class="title-input"
      />
      <textarea
        v-model="newPost"
        placeholder="分享新鲜事...  #话题标签"
        maxlength="500"
        rows="3"
      ></textarea>
      <div class="create-footer">
        <span class="char-count">{{ newPost.length }}/500</span>
        <button :disabled="!newPost.trim() || submitting" @click="handleCreate">
          &#9998; {{ submitting ? '发布中...' : '发布' }}
        </button>
      </div>
    </div>

    <div class="search-bar">
      <input
        v-model="searchText"
        type="text"
        placeholder="&#128269; 按标题搜索..."
        class="search-input"
        @keyup.enter="handleSearch"
      />
      <div class="tag-input-wrap">
        <span class="hash-prefix">#</span>
        <input
          v-model="rawTagInput"
          type="text"
          placeholder="按标签筛选..."
          class="search-input tag-input"
          @keyup.enter="handleSearch"
        />
      </div>
      <button class="search-btn" @click="handleSearch">&#128269;</button>
      <button v-if="searchText || filterTag" class="clear-btn" @click="clearFilter">&#10005;</button>
    </div>

    <div v-if="postStore.loading && postStore.posts.length === 0" class="loading">
      加载中...
    </div>

    <div v-else-if="postStore.posts.length === 0" class="empty">
      还没有帖子，快来发布第一条吧！
    </div>

    <template v-else>
      <PostCard
        v-for="post in postStore.posts"
        :key="post.id"
        :post="post"
        @delete="handleDelete"
      />
      <div v-if="postStore.posts.length < postStore.total" class="load-more">
        <button :disabled="postStore.loading" @click="postStore.loadMore(searchText, filterTag)">
          {{ postStore.loading ? '加载中...' : '加载更多 &#8595;' }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.home {
  max-width: 640px;
  margin: 0 auto;
}

.create-post {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px var(--card-shadow);
  transition: background 0.3s;
}

.title-input {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 10px 12px;
  font-size: 16px;
  font-weight: 600;
  outline: none;
  font-family: inherit;
  margin-bottom: 10px;
  background: var(--card-bg);
  color: var(--text);
  transition: border-color 0.2s, background 0.3s, color 0.3s;
}

.title-input:focus,
.create-post textarea:focus {
  border-color: var(--primary);
}

.create-post textarea {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 12px;
  font-size: 15px;
  resize: vertical;
  outline: none;
  font-family: inherit;
  background: var(--card-bg);
  color: var(--text);
  transition: border-color 0.2s, background 0.3s, color 0.3s;
}

.create-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
}

.char-count {
  font-size: 12px;
  color: var(--text-extra);
}

.create-footer button {
  padding: 8px 24px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.create-footer button:hover:not(:disabled) {
  background: var(--primary-hover);
}

.create-footer button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--input-border);
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  background: var(--card-bg);
  color: var(--text);
  transition: border-color 0.2s, background 0.3s, color 0.3s;
}

.search-input:focus {
  border-color: var(--primary);
}

.tag-input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  border: 1px solid var(--input-border);
  border-radius: 6px;
  background: var(--card-bg);
  overflow: hidden;
  transition: border-color 0.2s, background 0.3s;
}

.tag-input-wrap:focus-within {
  border-color: var(--primary);
}

.hash-prefix {
  color: #7c8cf8;
  font-size: 15px;
  font-weight: 600;
  padding-left: 12px;
  user-select: none;
  pointer-events: none;
}

.tag-input {
  border: none !important;
  background: transparent !important;
  padding-left: 2px;
}

.tag-input:focus {
  outline: none;
  box-shadow: none;
}

.search-btn {
  padding: 8px 14px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  white-space: nowrap;
}

.clear-btn {
  padding: 8px 14px;
  background: none;
  color: var(--text-muted);
  border: 1px solid var(--input-border);
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
}

.loading,
.empty {
  text-align: center;
  padding: 60px 0;
  color: var(--text-muted);
  font-size: 15px;
}

.load-more {
  text-align: center;
  padding: 20px 0 40px;
}

.load-more button {
  padding: 10px 32px;
  background: var(--card-bg);
  color: var(--primary);
  border: 1px solid var(--primary);
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.load-more button:hover:not(:disabled) {
  background: var(--primary);
  color: #fff;
}

.load-more button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
