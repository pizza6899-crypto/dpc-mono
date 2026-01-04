<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { UserListItemDto } from '~/api/generated/models'
import { format } from 'date-fns'

import { UBadge, UDropdownMenu as _UDropdownMenu, UButton } from '#components'

const UDropdownMenu = _UDropdownMenu as any
const { t } = useI18n()

interface Props {
  loading: boolean
  users: UserListItemDto[]
  total: number
  page: number
  pageCount: number
}

const props = defineProps<Props>()
const emit = defineEmits(['update:page', 'update:pageCount'])

const columns = computed<TableColumn<UserListItemDto>[]>(() => [
  {
    accessorKey: 'id',
    header: 'ID'
  },
  {
    accessorKey: 'uid',
    header: t('users.uid')
  },
  {
    accessorKey: 'email',
    header: t('users.email')
  },
  {
    accessorKey: 'role',
    header: t('users.role'),
    cell: ({ row }) => {
      const color = {
        SUPER_ADMIN: 'primary' as const,
        ADMIN: 'info' as const,
        USER: 'neutral' as const,
        AGENT: 'warning' as const
      }[row.original.role] || 'neutral'
      
      const roleLabel = t(`users.roles.${row.original.role.toLowerCase()}`)
      return h(UBadge, { color, variant: 'subtle', class: 'capitalize' }, () => roleLabel)
    }
  },
  {
    accessorKey: 'status',
    header: t('users.status'),
    cell: ({ row }) => {
      const color = {
        ACTIVE: 'success' as const,
        SUSPENDED: 'warning' as const,
        CLOSED: 'error' as const
      }[row.original.status] || 'neutral'

      const statusLabel = t(`users.status_types.${row.original.status.toLowerCase()}`)
      return h(UBadge, { color, variant: 'subtle', class: 'capitalize' }, () => statusLabel)
    }
  },
  {
    accessorKey: 'country',
    header: t('users.country'),
    class: 'hidden md:table-cell'
  },
  {
    accessorKey: 'timezone',
    header: t('users.timezone'),
    class: 'hidden lg:table-cell'
  },
  {
    accessorKey: 'createdAt',
    header: t('users.joined'),
    class: 'hidden sm:table-cell',
    cell: ({ row }) => format(new Date(row.original.createdAt), 'yyyy-MM-dd HH:mm')
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return h(
        UDropdownMenu,
        {
          content: { align: 'end' },
          items: [
            [{
              label: t('common.viewDetails'),
              icon: 'i-lucide-eye',
              to: `/users/${row.original.id}`
            }]
          ]
        },
        () => h(UButton, {
          icon: 'i-lucide-ellipsis-vertical',
          color: 'neutral',
          variant: 'ghost',
        })
      )
    }
  }
])

// Computed for v-model bindings
const currentPage = computed({
  get: () => props.page,
  set: (value) => emit('update:page', value)
})

const itemsPerPage = computed({
  get: () => props.pageCount,
  set: (value) => emit('update:pageCount', Number(value))
})

const pageCountOptions = [10, 20, 50, 100]

const roleOptions = [
  { label: 'Admin', value: 'ADMIN' },
  { label: 'User', value: 'USER' },
  { label: 'Agent', value: 'AGENT' }
]

const statusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Suspended', value: 'SUSPENDED' },
  { label: 'Closed', value: 'CLOSED' }
]
</script>

<template>
  <div class="flex flex-col h-full bg-white dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-800 shadow-sm">
    <!-- Filters Header -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
      <UInput
        icon="i-lucide-search"
        :placeholder="t('common.search')"
        class="w-full sm:max-w-xs"
      />
      <div class="flex items-center gap-2">
         <USelect 
            :placeholder="t('users.role')"
            :items="roleOptions" 
            class="flex-1 sm:w-32"
         />
         <USelect 
            :placeholder="t('users.status')"
            :items="statusOptions" 
            class="flex-1 sm:w-32"
         />
       </div>
    </div>

    <!-- Table -->
    <UTable
      :data="users"
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
    />

    <!-- Pagination Footer -->
    <div class="flex flex-col md:flex-row items-center justify-between p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 gap-4">
      <div class="text-sm text-gray-500 dark:text-gray-400 order-2 md:order-1">
        {{ t('common.total') }} <span class="font-semibold text-gray-900 dark:text-white">{{ total }}</span> {{ t('common.users') }}
      </div>

      <div class="flex flex-col sm:flex-row items-center gap-4 md:gap-6 w-full md:w-auto order-1 md:order-2">
        <div class="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <label for="page-count" class="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {{ t('common.itemsPerPage') }}
          </label>
          <USelect
            id="page-count"
            v-model="itemsPerPage"
            :items="pageCountOptions"
            size="sm"
            color="neutral"
            class="w-18"
          />
        </div>

        <UPagination
          v-if="total > 0"
          v-model:page="currentPage"
          :items-per-page="itemsPerPage"
          :total="total"
          size="sm"
          color="neutral"
          class="w-full sm:w-auto justify-center"
        />
      </div>
    </div>
  </div>
</template>
