<script setup lang="ts">
definePageMeta({
  layout: false
})

const { t } = useI18n()

</script>

<template>
  <div class="relative min-h-screen flex items-center justify-center overflow-hidden bg-white dark:bg-gray-950">
    <!-- Animated Background Gradients -->
    <div class="absolute inset-0 z-0">
      <div class="absolute -top-24 -left-24 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse" />
      <div class="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-700" />
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-linear-to-tr from-primary-500/5 to-transparent rounded-full blur-3xl" />
    </div>

    <!-- Top Navigation Hooks -->
    <div class="absolute top-6 right-6 flex items-center gap-3 z-20">
      <LanguagePicker :show-label="true" class="w-32" />
      <ColorModeToggle round />
    </div>

    <div class="w-full max-w-md px-6 relative z-10 animate-in fade-in zoom-in duration-700">
      <!-- Logo / Header -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-primary-500 to-indigo-600 shadow-lg shadow-primary-500/30 mb-6">
          <UIcon name="i-heroicons-bolt-20-solid" class="w-10 h-10 text-white" />
        </div>
        <h1 class="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
          {{ t('login.title') }}
        </h1>
        <p class="text-gray-500 dark:text-gray-400 font-medium">
          {{ t('login.description') }}
        </p>
      </div>

      <!-- Domain Component: Login Form -->
      <DomainAuthLoginForm />

      <!-- Footer -->
      <p class="mt-8 text-center text-sm text-gray-400">
        &copy; {{ new Date().getFullYear() }} DPC Admin Portal. 
        <br>
        Crafted with precision for modern management.
      </p>
    </div>
  </div>
</template>

<style scoped>
.animate-in {
  animation-duration: 0.7s;
  animation-fill-mode: both;
}

@keyframes pulse {
  0%, 100% { opacity: 0.2; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.1); }
}

.animate-pulse {
  animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
