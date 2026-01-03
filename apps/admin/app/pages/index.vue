<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold">Welcome to Admin Panel</h2>
      </template>
      
      <p class="text-gray-600 dark:text-gray-400">
        이곳은 관리자 페이지의 메인 화면입니다. 제안된 디렉토리 구조가 성공적으로 설정되었습니다.
      </p>
      
      <template #footer>
        <div class="flex items-center gap-4">
          <UButton color="primary" icon="i-heroicons-paper-airplane">
            Get Started
          </UButton>
          <div class="text-xs text-gray-500 font-mono">
            API Base: {{ config.public.apiBase }}
          </div>
        </div>
      </template>
    </UCard>

    <!-- Orval API Test Section -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">Orval API Test (Affiliate Codes)</h2>
          <UBadge :color="status === 'pending' ? 'orange' : status === 'error' ? 'red' : 'green'">
            {{ status }}
          </UBadge>
        </div>
      </template>

      <div v-if="status === 'pending'" class="flex justify-center p-4">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-gray-400" />
      </div>

      <div v-else-if="status === 'error'" class="text-red-500 p-4">
        Error loading data: {{ error?.message || 'Unknown error' }}
      </div>

      <div v-else class="overflow-x-auto">
        <UTable :rows="data?.items || []" :columns="columns" />
      </div>
    </UCard>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <UCard v-for="i in 3" :key="i">
        <template #header>
          <div class="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
        </template>
        <div class="h-20 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
 import { useAffiliateCodeAdminControllerListCodes } from '@apis/services/admin-affiliate-codes/admin-affiliate-codes'

const config = useRuntimeConfig()
const { data, status, error } = useAffiliateCodeAdminControllerListCodes({
  page: 1,
  limit: 10
})

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'uid', label: 'UID' },
  { key: 'code', label: 'Code' },
  { key: 'description', label: 'Description' },
  { key: 'createdAt', label: 'Created At' }
]
</script>
