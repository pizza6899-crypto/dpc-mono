<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { useTierAdminControllerGetTierHistory } from '~/api/generated/endpoints/dPCBackendAPI'
import type { TierHistoryResponseDto } from '~/api/generated/models'

const { t, d } = useI18n()

const props = defineProps<{
  userId?: string
}>()

const search = ref('')
const debouncedSearch = refDebounced(search, 300)

const page = ref(1)
const pageLimit = ref(20)

const effectiveUserId = computed(() => {
  if (props.userId) return props.userId
  return debouncedSearch.value || undefined
})

const params = computed(() => ({
  page: page.value,
  limit: pageLimit.value,
  userId: effectiveUserId.value
}))

const { data, status } = useTierAdminControllerGetTierHistory(params)

const histories = computed(() => (data.value as any)?.data || [])
const total = computed(() => (data.value as any)?.total || 0)
const loading = computed(() => status.value === 'pending')

const columns = computed<TableColumn<TierHistoryResponseDto>[]>(() => [
  {
    accessorKey: 'createdAt',
    header: t('common.date'),
    cell: ({ row }) => d(new Date(row.original.createdAt), 'short')
  },
  {
    accessorKey: 'userEmail',
    header: t('common.users'),
  },
  {
    accessorKey: 'oldTierCode',
    header: t('tiers.history.old_tier'),
    cell: ({ row }) => row.original.oldTierCode || '-'
  },
  {
    accessorKey: 'newTierCode',
    header: t('tiers.history.new_tier')
  },
  {
    id: 'changeType',
    accessorKey: 'changeType',
    header: t('tiers.history.type') || 'Type' 
  },
  {
    accessorKey: 'reason',
    header: t('tiers.history.reason')
  }
])
</script>

<template>
  <UCard :ui="{ body: 'p-0', header: 'p-4 border-b border-gray-200 dark:border-gray-800' }">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-gray-900 dark:text-white">
          {{ t('tiers.history.title') }}
        </h3>
        <UInput
          v-if="!userId"
          v-model="search"
          icon="i-heroicons-magnifying-glass-20-solid"
          :placeholder="t('common.search_by_user_id')"
          class="w-64"
        />
      </div>
    </template>

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
      <template #changeType-data="{ row }">
        <UBadge 
          :color="row.original.changeType === 'UPGRADE' ? 'success' : row.original.changeType === 'DOWNGRADE' ? 'error' : row.original.changeType === 'MANUAL_UPDATE' ? 'warning' : 'neutral'" 
          variant="subtle" 
          size="sm"
        >
          {{ row.original.changeType }}
        </UBadge>
      </template>

      <template #empty-state>
        <div class="flex flex-col items-center justify-center py-12 gap-3">
          <UIcon name="i-lucide-history" class="w-12 h-12 text-neutral-400 dark:text-neutral-600" />
          <div class="text-center">
            <p class="text-neutral-900 dark:text-white font-medium">{{ t('tiers.history.no_history') }}</p>
          </div>
        </div>
      </template>
    </UTable>

    <div class="flex justify-end p-4 border-t border-gray-200 dark:border-gray-800">
      <UPagination
        v-model="page"
        :page-count="pageLimit"
        :total="total"
      />
    </div>
  </UCard>
</template>
