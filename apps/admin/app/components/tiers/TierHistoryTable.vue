<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

const { t } = useI18n()

// Temporary mock type until API is ready
interface TierHistoryDto {
  id: string
  user: {
    email: string
    id: string
  }
  oldTier: string | null
  newTier: string
  reason: string
  createdAt: string
  createdBy: string
}

const props = defineProps<{
  loading?: boolean
}>()

// TODO: Replace with real API call
const histories = ref<TierHistoryDto[]>([
  {
    id: '1',
    user: { email: 'user1@example.com', id: 'u1' },
    oldTier: 'BRONZE',
    newTier: 'SILVER',
    reason: 'Requirements met',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    createdBy: 'SYSTEM'
  },
  {
    id: '2',
    user: { email: 'user2@example.com', id: 'u2' },
    oldTier: 'SILVER',
    newTier: 'GOLD',
    reason: 'Manual upgrade by admin',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    createdBy: 'admin@example.com'
  }
])

const columns = computed<TableColumn<TierHistoryDto>[]>(() => [
  {
    accessorKey: 'createdAt',
    header: t('common.date'),
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleString()
  },
  {
    id: 'user',
    header: t('common.users'),
    cell: ({ row }) => row.original.user.email
  },
  {
    accessorKey: 'oldTier',
    header: t('tiers.history.old_tier'),
    cell: ({ row }) => row.original.oldTier || '-'
  },
  {
    accessorKey: 'newTier',
    header: t('tiers.history.new_tier')
  },
  {
    accessorKey: 'reason',
    header: t('tiers.history.reason')
  },
  {
    accessorKey: 'createdBy',
    header: t('tiers.history.changed_by')
  }
])
</script>

<template>
  <UCard :ui="{ body: 'p-0' }">
    <UTable
      :data="histories"
      :columns="columns"
      :loading="loading"
      class="flex-1"
      :ui="{
          base: 'min-w-full border-separate border-spacing-0',
          thead: '[&>tr]:bg-gray-50 dark:[&>tr]:bg-gray-800/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-3 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-800',
          td: 'py-3 border-b border-gray-200 dark:border-gray-800',
          separator: 'h-0'
      }"
    >
      <template #empty-state>
        <div class="flex flex-col items-center justify-center py-12 gap-3">
          <UIcon name="i-lucide-history" class="w-12 h-12 text-neutral-400 dark:text-neutral-600" />
          <div class="text-center">
            <p class="text-neutral-900 dark:text-white font-medium">{{ t('tiers.history.no_history') }}</p>
          </div>
        </div>
      </template>
    </UTable>
  </UCard>
</template>
