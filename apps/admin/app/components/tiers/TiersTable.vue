<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { TierResponseDto } from '~/api/generated/models'

const { t } = useI18n()

const props = defineProps<{
  tiers: TierResponseDto[]
  userCounts: Record<string, number>
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'edit', tier: TierResponseDto): void
  (e: 'manage-translations', tier: TierResponseDto): void
  (e: 'create'): void
}>()

const columns = computed<TableColumn<TierResponseDto>[]>(() => [
  {
    accessorKey: 'priority',
    header: t('tiers.priority')
  },
  {
    accessorKey: 'code',
    header: t('tiers.code')
  },
  {
    id: 'name',
    header: t('tiers.name'),
    cell: ({ row }) => {
      const { locale } = useI18n()
      const currentLang = locale.value.toUpperCase()
      const translation = row.original.translations.find(tr => tr.language === currentLang)
        || row.original.translations.find(tr => tr.language === 'EN')
      return translation?.name || row.original.code
    }
  },
  {
    accessorKey: 'requirementUsd',
    header: t('tiers.requirement_usd'),
    cell: ({ row }) => `$${Number(row.original.requirementUsd).toLocaleString()}`
  },
  {
    accessorKey: 'levelUpBonusUsd',
    header: t('tiers.level_up_bonus_usd'),
    cell: ({ row }) => `$${Number(row.original.levelUpBonusUsd).toLocaleString()}`
  },
  {
    accessorKey: 'compRate',
    header: t('tiers.comp_rate'),
    cell: ({ row }) => `${(Number(row.original.compRate || 0) * 100).toFixed(2)}%`
  },
  {
    id: 'userCount',
    header: t('common.users'),
    cell: ({ row }) => props.userCounts[row.original.id] || 0
  },
  {
    id: 'actions',
    header: ''
  }
])
</script>

<template>
  <UCard :ui="{ body: 'p-0' }">
    <UTable
      :data="tiers"
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
      <template #priority-header>
        <div class="flex items-center gap-1">
          {{ t('tiers.priority') }}
          <UPopover mode="hover" :open-delay="200">
            <UIcon name="i-lucide-circle-help" class="size-3.5 text-neutral-400 cursor-help" />
            <template #content>
              <div class="p-2 text-xs max-w-48">
                {{ t('tiers.priority_help') }}
              </div>
            </template>
          </UPopover>
        </div>
      </template>
      <template #code-header>
        <div class="flex items-center gap-1">
          {{ t('tiers.code') }}
          <UPopover mode="hover" :open-delay="200">
            <UIcon name="i-lucide-circle-help" class="size-3.5 text-neutral-400 cursor-help" />
            <template #content>
              <div class="p-2 text-xs max-w-48">
                {{ t('tiers.code_help') }}
              </div>
            </template>
          </UPopover>
        </div>
      </template>

      <template #actions-cell="{ row }">
        <div class="flex justify-end">
          <UDropdownMenu
            :items="[
              [
                {
                  label: t('common.edit'),
                  icon: 'i-lucide-pencil',
                  onSelect: () => emit('edit', row.original)
                },
                {
                  label: t('tiers.manage_translations'),
                  icon: 'i-lucide-languages',
                  onSelect: () => emit('manage-translations', row.original)
                }
              ]
            ]"
            :content="{ align: 'end' }"
          >
            <UButton
              icon="i-lucide-ellipsis-vertical"
              color="neutral"
              variant="ghost"
            />
          </UDropdownMenu>
        </div>
      </template>

      <template #empty-state>
        <div class="flex flex-col items-center justify-center py-12 gap-3">
          <UIcon name="i-lucide-layers" class="w-12 h-12 text-neutral-400 dark:text-neutral-600" />
          <div class="text-center">
            <p class="text-neutral-900 dark:text-white font-medium">{{ t('tiers.messages.no_tiers_found') }}</p>
            <p class="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
              {{ t('tiers.messages.empty_state_desc') }}
            </p>
          </div>
          <UButton
            icon="i-lucide-plus"
            :label="t('tiers.add_tier')"
            color="neutral"
            variant="soft"
            class="mt-2"
            @click="emit('create')"
          />
        </div>
      </template>
    </UTable>
  </UCard>
</template>
