<script setup lang="ts">
import {
  useTierAdminControllerFindAll,
  useTierAdminControllerSyncMissingUserTiers,
  useTierAdminControllerGetTierUserCounts
} from '~/api/generated/endpoints/dPCBackendAPI'
import type { TierUserCountResponseDto } from '~/api/generated/models'
import TiersActionModals from '~/components/tiers/TiersActionModals.vue'
import TiersTable from '~/components/tiers/TiersTable.vue'

const { t } = useI18n()
const toast = useToast()

const { data: response, isPending, refetch: refetchTiers } = useTierAdminControllerFindAll()
const { data: userCountsResponse, refetch: refetchUserCounts } = useTierAdminControllerGetTierUserCounts()

const refreshData = () => {
  refetchTiers()
  refetchUserCounts()
}

const tiers = computed(() => response.value?.data || [])
const userCounts = computed<Record<string, number>>(() => {
  const counts: Record<string, number> = {}
  userCountsResponse.value?.data?.forEach((item: TierUserCountResponseDto) => {
    counts[item.tierId] = item.count
  })
  return counts
})

// Modal states managed by child component
const modals = ref<InstanceType<typeof TiersActionModals>>()

const { mutate: syncMissingUsers, isPending: isSyncing } = useTierAdminControllerSyncMissingUserTiers({
  mutation: {
    onSuccess: (res) => {
      toast.add({
        title: t('common.success'),
        description: `Successfully synced ${res.data?.processedCount || 0} users`,
        icon: 'i-lucide-check-circle'
      })
      refreshData()
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

</script>

<template>
  <UDashboardPanel>
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
            @click="modals?.openCreate()"
          />
        </div>
      </div>

      <TiersTable
        :tiers="tiers"
        :user-counts="userCounts"
        :loading="isPending"
        class="mt-4"
        @edit="(tier) => modals?.openEdit(tier)"
        @manage-translations="(tier) => modals?.openTranslation(tier)"
        @create="() => modals?.openCreate()"
      />

      <TiersActionModals ref="modals" @success="refreshData" />
    </div>
  </UDashboardPanel>
</template>
