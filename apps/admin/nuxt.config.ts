import { fileURLToPath } from 'node:url';
import { defineNuxtConfig } from 'nuxt/config';

// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false, // CSR 모드

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate',
    '@vueuse/nuxt'
  ],

  alias: {
    '@apis': fileURLToPath(new URL('./apis', import.meta.url)),
  },

  imports: {
    dirs: [
      'constants/**',
      'stores/**',
      'composables/**',
      'apis/services/**' // API 서비스 함수들이 모여있는 곳을 명시
    ]
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.VITE_API_BASE_URL || '/api'
    }
  }
})