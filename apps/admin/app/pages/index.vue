<script setup lang="ts">

const authStore = useAuthStore()

// Root route (/) acts as a traffic controller
if (authStore.isLoggedIn) {
  navigateTo('/dashboard')
} else {
  navigateTo('/login')
}

definePageMeta({
  layout: false
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
    <UIcon name="i-lucide-loader-2" class="w-10 h-10 animate-spin text-primary" />
  </div>
</template>
