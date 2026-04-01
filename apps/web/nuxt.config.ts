// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: true,
  nitro: {
    preset: 'cloudflare-pages'
  },
  devtools: { enabled: true }
})
