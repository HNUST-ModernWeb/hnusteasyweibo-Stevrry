<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const authStore = useAuthStore()
const router = useRouter()
const themeStore = useThemeStore()

onMounted(async () => {
  await authStore.fetchUser()
})

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div id="app">
    <header v-if="authStore.isLoggedIn" class="navbar">
      <div class="navbar-inner">
        <router-link to="/" class="logo">校园微博</router-link>
        <nav>
          <router-link to="/">&#127968; 首页</router-link>
          <router-link to="/profile" v-if="authStore.user" class="user-info">
            &#128100; {{ authStore.user.nickname }}
          </router-link>
          <button class="theme-btn" :title="themeStore.mode" @click="themeStore.nextTheme()">
            {{ themeStore.themeLabel[themeStore.mode] }}
          </button>
          <button class="logout-btn" @click="handleLogout">退出登录</button>
        </nav>
      </div>
    </header>
    <main :class="{ 'no-header': !authStore.isLoggedIn }">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.navbar {
  background: var(--navbar-bg);
  box-shadow: 0 1px 4px var(--navbar-shadow);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: background 0.3s, box-shadow 0.3s;
}

.navbar-inner {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 20px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary);
}

nav {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 14px;
}

nav a {
  color: var(--text-secondary);
  transition: color 0.2s;
}

nav a:hover {
  color: var(--primary);
}

.user-info {
  color: var(--text);
}

.theme-btn {
  background: none;
  border: 1px solid var(--input-border);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1;
}

.theme-btn:hover {
  border-color: var(--primary);
}

.logout-btn {
  background: none;
  border: 1px solid var(--input-border);
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  color: var(--text-muted);
  transition: all 0.2s;
}

.logout-btn:hover {
  border-color: var(--danger);
  color: var(--danger);
}

main {
  max-width: 800px;
  margin: 24px auto;
  padding: 0 20px;
}

main.no-header {
  margin: 0;
  max-width: none;
  padding: 0;
}
</style>
