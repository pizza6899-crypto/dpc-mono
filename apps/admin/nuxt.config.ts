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
    '@apis': './apis',
  },

  imports: {
    dirs: [
      'constants/**',
      'stores/**',
      'composables/**',
      'apis/**',
    ]
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.VITE_API_BASE_URL || '/api'
    }
  }
})