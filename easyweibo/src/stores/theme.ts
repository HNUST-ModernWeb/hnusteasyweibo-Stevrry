import { defineStore } from 'pinia'
import { ref, watchEffect } from 'vue'
import type { ThemeMode } from '@/types'

const STORAGE_KEY = 'theme_mode'

function getSavedTheme(): ThemeMode {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
  return 'system'
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement
  if (mode === 'dark') {
    root.setAttribute('data-theme', 'dark')
  } else if (mode === 'light') {
    root.setAttribute('data-theme', 'light')
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
  }
}

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>(getSavedTheme())

  watchEffect(() => {
    applyTheme(mode.value)
    localStorage.setItem(STORAGE_KEY, mode.value)
  })

  // Listen for system theme changes
  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (mode.value === 'system') {
        applyTheme('system')
      }
    })
  }

  function setTheme(newMode: ThemeMode) {
    mode.value = newMode
  }

  function nextTheme() {
    const modes: ThemeMode[] = ['light', 'dark', 'system']
    const idx = modes.indexOf(mode.value)
    mode.value = modes[(idx + 1) % modes.length]
  }

  const themeLabel: Record<ThemeMode, string> = {
    light: '☀',
    dark: '☾',
    system: '◐',
  }

  return { mode, setTheme, nextTheme, themeLabel }
})
