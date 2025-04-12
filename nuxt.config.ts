// eslint-disable-next-line no-undef
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/eslint'],
  css: ['~/app/assets/css/main.css'],
  eslint: {
    config: {
      stylistic: true
    }
  }
})