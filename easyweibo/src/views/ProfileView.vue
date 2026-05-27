<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getUserPosts } from '@/api/user'
import { deleteAccount } from '@/api/auth'
import type { Post } from '@/types'
import PostCard from '@/components/PostCard.vue'

const router = useRouter()
const authStore = useAuthStore()
const user = authStore.user

const posts = ref<Post[]>([])
const loading = ref(false)

const showEdit = ref(false)
const editNickname = ref('')
const editGender = ref('')
const editAvatar = ref('')
const editCardColor = ref('#667eea')

const showDeleteConfirm = ref(false)
const showDeleteFinal = ref(false)
const deleting = ref(false)
const saving = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const colorOptions = ['#667eea', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#3498db']

onMounted(async () => {
  if (!user) return
  loading.value = true
  try {
    const res = await getUserPosts(user.id)
    posts.value = res.data.list
  } finally {
    loading.value = false
  }
})

function openEdit() {
  if (!user) return
  editNickname.value = user.nickname
  editGender.value = user.gender
  editAvatar.value = user.avatar
  editCardColor.value = user.cardColor
  showEdit.value = true
}

async function saveProfile() {
  saving.value = true
  try {
    await authStore.updateProfile({
      nickname: editNickname.value,
      gender: editGender.value,
      avatar: editAvatar.value,
      cardColor: editCardColor.value,
    })
    showEdit.value = false
  } catch (err) {
    console.error('Save profile failed:', err)
  } finally {
    saving.value = false
  }
}

async function handleDeletePost(id: number) {
  posts.value = posts.value.filter((p) => p.id !== id)
}

function selectColor(color: string) {
  editCardColor.value = color
}

function triggerUpload() {
  fileInput.value?.click()
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    editAvatar.value = reader.result as string
  }
  reader.readAsDataURL(file)
}

function requestDelete() {
  showDeleteConfirm.value = true
}

function confirmFirstStep() {
  showDeleteConfirm.value = false
  showDeleteFinal.value = true
}

async function confirmDelete() {
  deleting.value = true
  try {
    await deleteAccount()
    authStore.logout()
    router.push('/login')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="profile" v-if="user">
    <div class="profile-card" :style="{ background: user.cardColor }">
      <div class="avatar-large">
        <span v-if="!user.avatar">{{ user.nickname.charAt(0) }}</span>
        <img v-else :src="user.avatar" alt="avatar" />
      </div>
      <div class="info">
        <h2>{{ user.nickname }}</h2>
        <p class="username">@{{ user.username }}</p>
        <p class="gender" v-if="user.gender">{{ user.gender }}</p>
        <p class="join-date">加入于 {{ new Date(user.createdAt).toLocaleDateString() }}</p>
      </div>
      <button class="edit-btn" title="编辑资料" @click="openEdit">&#9881; 编辑</button>
    </div>

    <div class="logout-wrap">
      <button class="edit-profile-btn" @click="openEdit">
        &#9881; 编辑资料
      </button>
      <button class="delete-account-btn" @click="requestDelete">
        &#10007; 注销账号
      </button>
    </div>

    <div class="posts-section">
      <h3>我的帖子</h3>

      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="posts.length === 0" class="empty">还没有发布过帖子</div>
      <PostCard
        v-for="post in posts"
        :key="post.id"
        :post="post"
        @delete="handleDeletePost"
      />
    </div>

    <!-- 编辑资料弹窗 -->
    <Transition name="modal">
      <div v-if="showEdit" class="modal-overlay" @click.self="showEdit = false">
        <div class="modal">
          <h3>编辑个人资料</h3>
          <div class="avatar-edit-row">
            <div class="avatar-preview">
              <span v-if="!editAvatar">{{ editNickname.charAt(0) }}</span>
              <img v-else :src="editAvatar" alt="avatar" />
            </div>
            <div class="avatar-actions">
              <button class="upload-btn" @click="triggerUpload">本地上传</button>
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                style="display: none"
                @change="handleFileChange"
              />
            </div>
          </div>
          <div class="form-group">
            <label>昵称</label>
            <input v-model="editNickname" type="text" placeholder="请输入昵称" />
          </div>
          <div class="form-group">
            <label>性别</label>
            <select v-model="editGender">
              <option value="">不公开</option>
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </div>
          <div class="form-group">
            <label>名片颜色</label>
            <div class="color-picker">
              <button
                v-for="color in colorOptions"
                :key="color"
                class="color-dot"
                :class="{ active: editCardColor === color }"
                :style="{ background: color }"
                @click="selectColor(color)"
              ></button>
            </div>
          </div>
          <div class="modal-footer">
            <button class="cancel-btn" @click="showEdit = false">取消</button>
            <button class="save-btn" :disabled="saving" @click="saveProfile">
              {{ saving ? '保存中...' : '保存' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 注销第一步确认 -->
    <Transition name="modal">
      <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
        <div class="modal delete-modal">
          <h3>&#9888; 注销账号</h3>
          <p>确定要注销账号吗？</p>
          <p class="warn-text">此操作将删除你的账号和所有帖子，评论内容不会被删除。</p>
          <div class="modal-footer">
            <button class="cancel-btn" @click="showDeleteConfirm = false">取消</button>
            <button class="danger-btn" @click="confirmFirstStep">确认</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 注销第二步（最终确认） -->
    <Transition name="modal">
      <div v-if="showDeleteFinal" class="modal-overlay" @click.self="showDeleteFinal = false">
        <div class="modal delete-modal">
          <h3>&#9888; 最终确认</h3>
          <p>此操作不可撤销！</p>
          <p class="warn-text">确认后将永久删除你的账号及所有帖子数据。</p>
          <div class="modal-footer">
            <button class="cancel-btn" @click="showDeleteFinal = false">取消</button>
            <button class="danger-btn" :disabled="deleting" @click="confirmDelete">
              {{ deleting ? '注销中...' : '确认注销' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.profile {
  max-width: 640px;
  margin: 0 auto;
}

.profile-card {
  border-radius: 12px;
  padding: 30px;
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 16px;
  color: #fff;
  position: relative;
}

.avatar-large {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  flex-shrink: 0;
  overflow: hidden;
}

.avatar-large img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info {
  flex: 1;
}

.info h2 {
  font-size: 22px;
  margin-bottom: 4px;
}

.username {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 2px;
}

.gender {
  font-size: 13px;
  opacity: 0.75;
  margin-bottom: 2px;
}

.join-date {
  font-size: 12px;
  opacity: 0.65;
}

.edit-btn {
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.edit-btn:hover {
  background: rgba(255, 255, 255, 0.35);
}

.avatar-edit-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding: 12px;
  background: var(--bg);
  border-radius: 8px;
}

.avatar-preview {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  flex-shrink: 0;
  overflow: hidden;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.upload-btn {
  padding: 6px 16px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
  width: fit-content;
}

.upload-btn:hover {
  background: var(--primary-hover);
}

.logout-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding: 0 4px;
}

.edit-profile-btn {
  padding: 8px 18px;
  background: var(--card-bg);
  color: var(--text-secondary);
  border: 1px solid var(--input-border);
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-profile-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.delete-account-btn {
  padding: 8px 18px;
  background: var(--card-bg);
  color: var(--danger);
  border: 1px solid var(--danger);
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0.6;
}

.delete-account-btn:hover {
  opacity: 1;
  background: var(--danger);
  color: #fff;
}

.posts-section h3 {
  font-size: 18px;
  color: var(--text);
  margin-bottom: 16px;
  padding-left: 4px;
}

.loading,
.empty {
  text-align: center;
  padding: 40px 0;
  color: var(--text-muted);
  font-size: 14px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--modal-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal {
  background: var(--card-bg);
  border-radius: 12px;
  padding: 30px;
  width: 90%;
  max-width: 420px;
  color: var(--text);
}

.modal h3 {
  font-size: 18px;
  margin-bottom: 20px;
  color: var(--text);
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--input-border);
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  background: var(--card-bg);
  color: var(--text);
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  border-color: var(--primary);
}

.color-picker {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-dot {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s;
}

.color-dot:hover {
  transform: scale(1.15);
}

.color-dot.active {
  border-color: var(--text);
  transform: scale(1.15);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.cancel-btn {
  padding: 8px 20px;
  background: var(--bg);
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  color: var(--text-secondary);
}

.save-btn {
  padding: 8px 20px;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.save-btn:hover:not(:disabled) {
  background: var(--primary-hover);
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.delete-modal p {
  margin-bottom: 8px;
  font-size: 15px;
}

.warn-text {
  color: var(--text-muted);
  font-size: 13px !important;
}

.danger-btn {
  padding: 8px 20px;
  background: var(--danger);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.danger-btn:hover:not(:disabled) {
  background: #c0392b;
}

.danger-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
