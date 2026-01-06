<script setup lang="ts" generic="T">
import type { TableColumn } from '@nuxt/ui'

const { t } = useI18n()

// Generic props for the table
const props = defineProps<{
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  total?: number
  itemsPerPage?: number
  page?: number
  title?: string
  icon?: string
  exportable?: boolean
  copyableColumns?: string[]
  search?: string
  searchPlaceholder?: string
  sort?: { column: string, direction: 'asc' | 'desc' }
  modelValue?: T[] // For row selection
  ui?: any // Pass-through for UTable ui prop
}>()

const emit = defineEmits<{
  'update:page': [value: number]
  'update:itemsPerPage': [value: number]
  'update:modelValue': [value: T[]]
  'update:search': [value: string]
  'update:sort': [value: { column: string, direction: 'asc' | 'desc' } | undefined]
  'export': [format: string]
}>()

const toast = useToast()

const copyToClipboard = async (text: string) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(String(text))
    toast.add({ 
      title: t('common.clipboard.copy_success'), 
      icon: 'i-lucide-check-circle', 
      color: 'success'
    })
  } catch (err) {
    toast.add({ 
      title: t('common.clipboard.copy_error'), 
      color: 'error'
    })
  }
}

const searchTerm = computed({
  get: () => props.search ?? '',
  set: (val) => emit('update:search', val)
})

const currentSort = computed({
  get: () => props.sort,
  set: (val) => emit('update:sort', val)
})

// Internal computed properties for v-model bindings
const currentPage = computed({
  get: () => props.page || 1,
  set: (val) => emit('update:page', val)
})

const currentLimit = computed({
  get: () => props.itemsPerPage || 10,
  set: (val) => emit('update:itemsPerPage', val)
})

const selectedRows = computed({
  get: () => props.modelValue || [],
  set: (val) => emit('update:modelValue', val)
})

const exportOptions = computed(() => [
  [{
    label: 'CSV',
    icon: 'i-lucide-file-spreadsheet',
    click: () => emit('export', 'csv')
  }, {
    label: 'Excel',
    icon: 'i-lucide-file-type-2',
    click: () => emit('export', 'excel')
  }]
])

// Default UI styling - matching the design system
const defaultTableUI = {
  base: 'min-w-full border-separate border-spacing-0',
  thead: '[&>tr]:bg-neutral-50 dark:[&>tr]:bg-neutral-800/50 [&>tr]:after:content-none sticky top-0 z-10',
  tbody: '[&>tr]:last:[&>td]:border-b-0 [&>tr]:hover:bg-neutral-50/50 dark:[&>tr]:hover:bg-neutral-800/50',
  th: 'py-2 text-neutral-700 dark:text-neutral-200 font-bold text-xs uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800 px-4',
  td: 'py-1.5 border-b border-neutral-100 dark:border-neutral-800 px-4 text-[13px] tabular-nums whitespace-nowrap',
  separator: 'h-0'
}

const mergedUI = computed(() => {
  return { ...defaultTableUI, ...props.ui }
})
</script>

<template>
  <UCard :ui="{ body: 'p-0', header: 'p-4 border-b border-gray-200 dark:border-gray-800' }">
    <!-- Header Slot -->
    <template v-if="title || $slots.header" #header>
      <slot name="header">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
             <UIcon v-if="icon" :name="icon" class="w-5 h-5 text-neutral-500" />
             <h3 class="font-bold text-base tracking-tight text-neutral-900 dark:text-white">
               {{ title }}
             </h3>
          </div>
          <div class="flex items-center gap-2">
            <slot name="header-right" />
            
            <UDropdownMenu 
              v-if="exportable" 
              :items="exportOptions"
              :content="{ align: 'end' }"
            >
              <UButton 
                icon="i-lucide-download" 
                :label="t('common.export') || 'Export'" 
                color="neutral" 
                variant="subtle" 
                size="xs" 
              />
            </UDropdownMenu>
          </div>
        </div>
      </slot>
    </template>

    <!-- Filters / Search Toolbar -->
    <div v-if="search !== undefined || $slots.filters" class="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
      <div v-if="search !== undefined" class="w-full sm:max-w-xs">
        <UInput
          v-model="searchTerm"
          icon="i-lucide-search"
          :placeholder="searchPlaceholder || t('common.search')"
          size="sm"
        />
      </div>
      <div v-if="$slots.filters" class="flex items-center gap-2 flex-wrap">
        <slot name="filters" />
      </div>
    </div>

    <!-- Main Table -->
    <UTable
      v-model="selectedRows"
      v-model:sort="currentSort"
      :data="data"
      :columns="columns"
      :loading="loading"
      class="flex-1"
      :ui="mergedUI"
    >
      <!-- Dynamic Slot Pass-through -->
      <template v-for="(_, name) in $slots" #[name]="slotData">
        <slot :name="name" v-bind="slotData" />
      </template>

      <!-- Auto-generated Copyable Columns -->
      <template v-for="col in copyableColumns" :key="col" #[`${col}-cell`]="{ row }">
         <div class="flex items-center gap-1.5 group cursor-pointer hover:text-primary-500 max-w-[200px]" @click.stop="copyToClipboard((row.original as any)[col])">
           <span class="truncate text-[13px] font-mono">{{ (row.original as any)[col] }}</span>
           <UIcon name="i-lucide-copy" class="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-neutral-400 hover:text-primary-500" />
         </div>
      </template>
      
      <!-- Empty State Default (can be overridden) -->
      <template #empty-state>
        <slot name="empty-state">
           <div class="flex flex-col items-center justify-center py-16 gap-4 text-neutral-400">
             <div class="w-16 h-16 rounded-full bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-center">
               <UIcon :name="icon || 'i-lucide-inbox'" class="w-8 h-8 opacity-20" />
             </div>
             <div class="text-center">
               <p class="text-base font-bold text-neutral-900 dark:text-white">{{ t('common.no_data') || 'No data available' }}</p>
             </div>
           </div>
        </slot>
      </template>
    </UTable>

    <!-- Footer / Pagination -->
    <div v-if="total !== undefined" class="flex items-center justify-between p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
      <div class="flex items-center gap-4">
        <!-- Page Size Selector -->
        <USelect
          v-if="itemsPerPage !== undefined"
          v-model="currentLimit"
          :items="[10, 20, 30, 50, 100]"
          size="xs"
          class="w-20"
        />
        
        <div class="text-[11px] font-medium text-neutral-500">
          {{ t('users.wallet.showing_items', { count: data.length, total }) }}
        </div>
      </div>
      
      <UPagination
        v-model="currentPage"
        :items-per-page="itemsPerPage || 10"
        :total="total"
        size="sm"
        color="neutral"
      />
    </div>
  </UCard>
</template>
