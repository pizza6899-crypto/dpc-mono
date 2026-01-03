<template>
  <div class="space-y-6">
    <!-- Stats Section -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <UCard v-for="stat in stats" :key="stat.label">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ stat.label }}</span>
            <UIcon :name="stat.icon" class="w-5 h-5 text-primary" />
          </div>
        </template>
        <div class="text-2xl font-bold">{{ stat.value }}</div>
        <p class="text-xs mt-1 flex items-center" :class="stat.trend > 0 ? 'text-green-500' : 'text-red-500'">
          <UIcon :name="stat.trend > 0 ? 'i-heroicons-arrow-trending-up' : 'i-heroicons-arrow-trending-down'" class="mr-1" />
          {{ Math.abs(stat.trend) }}% from last month
        </p>
      </UCard>
    </div>

    <!-- Orval API Data Section -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Recent Affiliate Codes</h2>
            <UBadge :color="status === 'pending' ? 'orange' : status === 'error' ? 'red' : 'green'" size="xs" variant="subtle">
              {{ status }}
            </UBadge>
          </div>
          <UButton color="primary" variant="ghost" icon="i-heroicons-arrow-path" @click="refresh" :loading="status === 'pending'" />
        </div>
      </template>

      <div v-if="status === 'pending'" class="py-12 flex flex-col items-center justify-center gap-3">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin h-8 w-8 text-primary" />
        <span class="text-sm text-gray-500">데이터를 불러오는 중...</span>
      </div>

      <div v-else-if="status === 'error'" class="py-12 text-center text-red-500">
        <UIcon name="i-heroicons-exclamation-triangle" class="h-10 w-10 mx-auto mb-2" />
        <p>데이터 로드 실패: {{ error?.message || '알 수 없는 에러' }}</p>
      </div>

      <div v-else class="overflow-x-auto">
        <UTable :rows="data?.items || []" :columns="columns">
           <template #createdAt-data="{ row }">
            {{ formatDate((row as any).createdAt) }}
          </template>
        </UTable>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { useAffiliateCodeAdminControllerListCodes } from '@apis/services/admin-affiliate-codes/admin-affiliate-codes'

// Orval API Fetching
const { data, status, error, refetch } = useAffiliateCodeAdminControllerListCodes({
  page: 1,
  limit: 5
})

const refresh = () => { refetch() }

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'code', label: '코드' },
  { key: 'description', label: '설명' },
  { key: 'createdAt', label: '생성일' }
]

const stats = [
  { label: '전체 유저', value: '1,234', icon: 'i-heroicons-users', trend: 12 },
  { label: '금일 입금', value: '$12,400', icon: 'i-heroicons-banknotes', trend: 8 },
  { label: '신규 문의', value: '5', icon: 'i-heroicons-chat-bubble-left-right', trend: -2 },
  { label: '서버 상태', value: 'Stable', icon: 'i-heroicons-cpu-chip', trend: 0 }
]
</script>
