
import { fileURLToPath } from 'node:url';
import { defineNuxtConfig } from 'nuxt/config';

// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false, // CSR 모드
  css: ['~/assets/css/main.css'],

  modules: [
    '@nuxtjs/i18n',
    '@nuxt/ui',
    '@pinia/nuxt',
    'pinia-plugin-persistedstate',
    '@vueuse/nuxt',
    '@nuxt/eslint',
  ],

  i18n: {
    locales: [
      { code: 'ko', file: 'ko.json', name: '한국어' },
      { code: 'en', file: 'en.json', name: 'English' }
    ],
    defaultLocale: 'ko',
    lazy: false,
    strategy: 'no_prefix', // URL에 /ko, /en 붙이지 않음
  },

  eslint: {
    config: {
      standalone: false
    }
  },

  tailwind: {
    config: {
      theme: {
        extend: {
          colors: {
            // 커스텀 색상 추가 등
          }
        }
      }
    }
  },
  alias: {
    '@app': fileURLToPath(new URL('./app', import.meta.url)),
    '@stores': fileURLToPath(new URL('./app/stores', import.meta.url)),
    '@apis': fileURLToPath(new URL('./apis', import.meta.url)),
  },

  imports: {
    dirs: [
      'app/constants/**',
      'app/stores/**',
      'app/composables/**',
      'app/utils/**',
      'apis/services/**' // API 서비스 함수들이 모여있는 곳을 명시
    ]
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.VITE_API_BASE_URL || '/api'
    }
  }
})