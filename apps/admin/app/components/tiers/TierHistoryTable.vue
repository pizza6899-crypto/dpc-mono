<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { useTierAdminControllerGetTierHistory } from '~/api/generated/endpoints/dPCBackendAPI'
import type { TierHistoryResponseDto } from '~/api/generated/models'
import { format } from 'date-fns'
import { UButton } from '#components'

const { t } = useI18n()
const toast = useToast()

const props = defineProps<{
  userId?: string
}>()

const search = ref('')
const debouncedSearch = refDebounced(search, 300)

const uiStore = useUIStore()
const page = ref(1)
const pageLimit = computed({
  get: () => uiStore.tableSettings.tierHistory.itemsPerPage,
  set: (val) => uiStore.tableSettings.tierHistory.itemsPerPage = val
})
const pageCountOptions = [10, 20, 50, 100].map(v => ({ label: String(v), value: v }))

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
const total = computed(() => (data.value as any)?.pagination?.total || 0)
const loading = computed(() => status.value === 'pending')

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    toast.add({ title: t('common.clipboard.copy_success'), icon: 'i-lucide-check-circle', color: 'success' })
  } catch (err) {
    toast.add({ title: t('common.clipboard.copy_error'), color: 'error' })
  }
}

const columns = computed<TableColumn<TierHistoryResponseDto>[]>(() => {
  const baseColumns: TableColumn<TierHistoryResponseDto>[] = [
    {
      accessorKey: 'createdAt',
      header: t('common.date'),
      cell: ({ row }) => h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'text-sm font-bold text-neutral-900 dark:text-white tabular-nums' }, 
          format(new Date(row.original.createdAt), 'yyyy-MM-dd')),
        h('span', { class: 'text-[10px] text-neutral-400 font-medium' }, 
          format(new Date(row.original.createdAt), 'HH:mm:ss'))
      ])
    }
  ]

  if (!props.userId) {
    baseColumns.push({
      accessorKey: 'userEmail',
      header: t('common.users'),
      cell: ({ row }) => h('div', { 
        class: 'flex items-center gap-2 group cursor-pointer hover:text-primary-500 transition-colors',
        onClick: (e: MouseEvent) => {
          e.stopPropagation()
          copyToClipboard(row.original.userEmail || '')
        }
      }, [
        h('span', { class: 'text-sm' }, row.original.userEmail || ''),
        h(UButton, {
          icon: 'i-lucide-copy',
          color: 'neutral',
          variant: 'ghost',
          size: 'xs',
          class: 'opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto w-auto'
        })
      ])
    })
  }

  baseColumns.push(
    {
      accessorKey: 'oldTierCode',
      header: t('tiers.history.old_tier'),
      cell: ({ row }) => h('span', { class: 'font-mono text-xs' }, row.original.oldTierCode || '-')
    },
    {
      accessorKey: 'newTierCode',
      header: t('tiers.history.new_tier'),
      cell: ({ row }) => h('span', { class: 'font-mono text-xs font-bold' }, row.original.newTierCode)
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
  )

  return baseColumns
})
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

    <div>
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
        <template #changeType-cell="{ row }">
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
    </div>

    <div class="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 gap-4">
      <div class="flex items-center gap-4">
        <div class="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
          {{ t('users.wallet.showing_items', { count: histories.length, total }) }}
        </div>
        
        <div class="hidden sm:flex items-center gap-2 border-l border-gray-200 dark:border-gray-800 pl-4">
          <label for="history-page-count" class="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
            {{ t('common.itemsPerPage') }}
          </label>
          <USelect
            id="history-page-count"
            v-model="pageLimit"
            :items="pageCountOptions"
            size="xs"
            color="neutral"
            variant="subtle"
            class="w-16"
            @update:model-value="page = 1"
          />
        </div>
      </div>

      <UPagination
        v-model:page="page"
        :items-per-page="pageLimit"
        :total="total"
        size="sm"
        color="neutral"
      />
    </div>
  </UCard>
</template>
