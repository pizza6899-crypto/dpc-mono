<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- 사이드바나 헤더가 들어갈 자리 -->
    <header class="h-16 border-b bg-white dark:bg-gray-800 flex items-center px-6">
      <h1 class="text-xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h1>
    </header>
    
    <main class="p-6">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
// 레이아웃 기본 로직
</script>
