import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginParams, RegisterParams, UpdateProfileParams } from '@/types'
import { login as loginApi, register as registerApi, getCurrentUser } from '@/api/auth'
import { updateProfile as updateProfileApi } from '@/api/user'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string>(localStorage.getItem('token') || '')

  const isLoggedIn = computed(() => !!token.value)

  async function login(params: LoginParams) {
    const res = await loginApi(params)
    token.value = res.data.token
    user.value = res.data.user
    localStorage.setItem('token', res.data.token)
  }

  async function register(params: RegisterParams) {
    const res = await registerApi(params)
    token.value = res.data.token
    user.value = res.data.user
    localStorage.setItem('token', res.data.token)
  }

  async function fetchUser() {
    if (!token.value) return
    try {
      const res = await getCurrentUser()
      user.value = res.data
    } catch {
      logout()
    }
  }

  async function updateProfile(data: UpdateProfileParams) {
    const res = await updateProfileApi(data)
    user.value = res.data
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
  }

  return { user, token, isLoggedIn, login, register, fetchUser, updateProfile, logout }
})
