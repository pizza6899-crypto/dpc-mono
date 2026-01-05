<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import {
  useTierAdminControllerFindAll,
  useTierAdminControllerSyncMissingUserTiers,
  useTierAdminControllerGetTierUserCounts
} from '~/api/generated/endpoints/dPCBackendAPI'
import type { TierResponseDto, TierUserCountResponseDto } from '~/api/generated/models'
import TiersForm from '~/components/tiers/TiersForm.vue'
import TiersTranslationForm from '~/components/tiers/TiersTranslationForm.vue'

const { t } = useI18n()
const toast = useToast()

const { data: response, isPending, refetch } = useTierAdminControllerFindAll()
const { data: userCountsResponse } = useTierAdminControllerGetTierUserCounts()

const tiers = computed(() => response.value?.data || [])
const userCounts = computed<Record<string, number>>(() => {
  const counts: Record<string, number> = {}
  userCountsResponse.value?.data?.forEach((item: TierUserCountResponseDto) => {
    counts[item.tierId] = item.count
  })
  return counts
})

// Modal states
const isFormModalOpen = ref(false)
const isTranslationModalOpen = ref(false)
const selectedTier = ref<TierResponseDto | undefined>()

const { mutate: syncMissingUsers, isPending: isSyncing } = useTierAdminControllerSyncMissingUserTiers({
  mutation: {
    onSuccess: (res) => {
      toast.add({
        title: t('common.success'),
        description: `Successfully synced ${res.data?.processedCount || 0} users`,
        icon: 'i-lucide-check-circle'
      })
      refetch()
    },
    onError: (err: any) => {
      toast.add({
        title: t('common.error'),
        description: err.response?.data?.message || 'Failed to sync missing users',
        color: 'error'
      })
    }
  }
})

function openCreateModal() {
  selectedTier.value = undefined
  isFormModalOpen.value = true
}

function openEditModal(tier: TierResponseDto) {
  selectedTier.value = tier
  isFormModalOpen.value = true
}

function openTranslationModal(tier: TierResponseDto) {
  selectedTier.value = tier
  isTranslationModalOpen.value = true
}

function onFormSuccess() {
  isFormModalOpen.value = false
  refetch()
}

function onTranslationSuccess() {
  isTranslationModalOpen.value = false
  refetch()
}

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
    cell: ({ row }) => userCounts.value[row.original.id] || 0
  },
  {
    id: 'actions',
    header: ''
  }
])
</script>

<template>
  <UDashboardPanelContent>
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-neutral-900 dark:text-white">
            {{ t('common.tiers') }}
          </h2>
          <p class="text-sm text-neutral-500 mt-1">
            {{ t('tiers.description') }}
          </p>
        </div>
        
        <div class="flex items-center gap-2">
          <UButton
            icon="i-lucide-refresh-cw"
            :label="t('tiers.sync_missing')"
            :loading="isSyncing"
            variant="subtle"
            color="neutral"
            @click="syncMissingUsers()"
          />
          <UButton
            icon="i-lucide-plus"
            :label="t('tiers.add_tier')"
            color="neutral"
            variant="solid"
            @click="openCreateModal"
          />
        </div>
      </div>

      <UCard :ui="{ body: 'p-0' }">
        <UTable
          :data="tiers"
          :columns="columns"
          :loading="isPending"
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
                      onSelect: () => openEditModal(row.original)
                    },
                    {
                      label: t('tiers.manage_translations'),
                      icon: 'i-lucide-languages',
                      onSelect: () => openTranslationModal(row.original)
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
        </UTable>
      </UCard>

      <!-- Tier form modal -->
      <UModal
        v-model:open="isFormModalOpen"
        :title="selectedTier ? t('tiers.edit_tier') : t('tiers.add_tier')"
        :description="selectedTier ? undefined : t('tiers.messages.add_tier_desc')"
      >
        <template #body>
          <TiersForm
            :tier="selectedTier"
            @success="onFormSuccess"
            @close="isFormModalOpen = false"
          />
        </template>
      </UModal>

      <!-- Translation modal -->
      <UModal
        v-model:open="isTranslationModalOpen"
        :title="t('tiers.manage_translations')"
        :description="selectedTier ? `${t('tiers.manage_translations')}: ${selectedTier.code}` : undefined"
      >
        <template #body>
          <TiersTranslationForm
            v-if="selectedTier"
            :tier="selectedTier"
            @success="onTranslationSuccess"
            @close="isTranslationModalOpen = false"
          />
        </template>
      </UModal>
    </div>
  </UDashboardPanelContent>
</template>
