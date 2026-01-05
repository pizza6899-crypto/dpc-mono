<script setup lang="ts">
import { format } from 'date-fns'
import type { TableColumn } from '@nuxt/ui'
import {
  useUserAdminControllerFindOne,
  useTierAdminControllerGetUserTier,
  useTierAdminControllerGetUserTierHistory,
  useTierAdminControllerFindAll,
  useTierAdminControllerForceUpdateUserTier
} from '~/api/generated/endpoints/dPCBackendAPI'
import type { TierHistoryResponseDto } from '~/api/generated/models'

const route = useRoute()
const { t } = useI18n()
const toast = useToast()
const userId = route.params.id as string

const { data: user, isPending: isUserLoading } = useUserAdminControllerFindOne(userId)
const { data: userTierResponse, isPending: isTierLoading, refetch: refetchTier } = useTierAdminControllerGetUserTier(userId)
const { data: historyResponse, isPending: isHistoryLoading, refetch: refetchHistory } = useTierAdminControllerGetUserTierHistory(userId)
const { data: allTiersResponse } = useTierAdminControllerFindAll()

const userTier = computed(() => userTierResponse.value?.data)
const history = computed(() => historyResponse.value?.data || [])
const tiers = computed(() => allTiersResponse.value?.data || [])

// Force Update Modal
const isForceUpdateModalOpen = ref(false)
const forceUpdateState = reactive({
  tierCode: '',
  reason: ''
})

const { mutate: forceUpdate, isPending: isForceUpdating } = useTierAdminControllerForceUpdateUserTier({
  mutation: {
    onSuccess: () => {
      toast.add({ title: t('common.success'), icon: 'i-lucide-check-circle' })
      isForceUpdateModalOpen.value = false
      refetchTier()
      refetchHistory()
    },
    onError: (err: any) => {
      toast.add({
        title: t('common.error'),
        description: err.response?.data?.message || 'Failed to force update tier',
        color: 'error'
      })
    }
  }
})

function onForceUpdate() {
  forceUpdate({
    userId,
    data: {
      tierCode: forceUpdateState.tierCode,
      reason: forceUpdateState.reason
    }
  })
}

const historyColumns: TableColumn<TierHistoryResponseDto>[] = [
  { accessorKey: 'createdAt', header: 'Date' },
  { accessorKey: 'oldTierCode', header: 'Old Tier' },
  { accessorKey: 'newTierCode', header: 'New Tier' },
  { accessorKey: 'changeType', header: 'Type' },
  { accessorKey: 'reason', header: 'Reason' }
]
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="user?.data?.email || `User ${userId}`">
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            to="/users"
          />
        </template>
        <template #right>
           <UBadge v-if="user?.data" :color="user.data.status === 'ACTIVE' ? 'success' : 'neutral'" variant="subtle">
            {{ user.data.status }}
          </UBadge>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="isUserLoading" class="p-8 flex justify-center">
        <UIcon name="i-lucide-loader-2" class="animate-spin w-8 h-8 text-neutral-400" />
      </div>

      <div v-else-if="user?.data" class="p-4 space-y-6 max-w-6xl mx-auto">
        <!-- Basic Info Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <UCard class="md:col-span-1">
            <template #header>
              <h3 class="font-semibold">User Info</h3>
            </template>
            <div class="space-y-4 text-sm">
              <div class="flex justify-between">
                <span class="text-neutral-500">ID</span>
                <span class="font-mono">{{ user.data.id }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-500">UID</span>
                <span class="font-mono text-xs">{{ user.data.uid }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-500">Role</span>
                <UBadge variant="outline" size="sm">{{ user.data.role }}</UBadge>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-500">Country</span>
                <span>{{ user.data.country || 'N/A' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-neutral-500">Joined</span>
                <span>{{ format(new Date(user.data.createdAt), 'yyyy-MM-dd HH:mm') }}</span>
              </div>
            </div>
          </UCard>

          <!-- Tier Info Card -->
          <UCard class="md:col-span-2">
            <template #header>
              <div class="flex items-center justify-between w-full">
                <h3 class="font-semibold">Tier & VIP</h3>
                <UButton
                  icon="i-lucide-shield-alert"
                  label="Force Update"
                  size="xs"
                  color="warning"
                  variant="subtle"
                  @click="isForceUpdateModalOpen = true"
                />
              </div>
            </template>
            
            <div v-if="isTierLoading" class="p-4 flex justify-center">
              <UIcon name="i-lucide-loader-2" class="animate-spin w-5 h-5" />
            </div>
            <div v-else-if="userTier" class="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div class="space-y-4">
                <div>
                  <label class="text-xs text-neutral-500 uppercase tracking-wider">Current Tier</label>
                  <div class="flex items-center gap-3 mt-1">
                    <span class="text-3xl font-bold text-neutral-900 dark:text-white">{{ userTier.tierCode }}</span>
                    <UBadge v-if="userTier.isManualLock" color="warning" variant="subtle" icon="i-lucide-lock">Locked</UBadge>
                  </div>
                  <p class="text-sm text-neutral-500 mt-1">{{ userTier.tierDisplayName || 'No Display Name' }}</p>
                </div>

                <div>
                  <label class="text-xs text-neutral-500 uppercase tracking-wider">Total Rolling Progress</label>
                  <div class="mt-1">
                    <span class="text-xl font-semibold">${{ Number(userTier.totalRollingUsd).toLocaleString() }}</span>
                    <span class="text-neutral-400 mx-2">/</span>
                    <span class="text-neutral-500 text-sm">${{ Number(userTier.tierRequirementUsd || 0).toLocaleString() }}</span>
                  </div>
                  <!-- Progress Bar -->
                   <div class="mt-2 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div 
                      class="h-full bg-primary-500" 
                      :style="{ width: `${Math.min(100, (Number(userTier.totalRollingUsd) / (Number(userTier.tierRequirementUsd) || 1)) * 100)}%` }"
                    ></div>
                  </div>
                </div>
              </div>

              <div class="space-y-4">
                <div class="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                  <div class="flex items-center gap-2 text-sm font-medium mb-3">
                    <UIcon name="i-lucide-info" />
                    Tier Details
                  </div>
                  <ul class="text-xs space-y-2 text-neutral-600 dark:text-neutral-400">
                    <li class="flex justify-between">
                      <span>Highest Reached:</span>
                      <span class="font-semibold">{{ userTier.highestPromotedPriority }}</span>
                    </li>
                    <li class="flex justify-between">
                      <span>Last Promoted:</span>
                      <span>{{ userTier.lastPromotedAt ? format(new Date(userTier.lastPromotedAt), 'yyyy-MM-dd') : 'Never' }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div v-else class="p-8 text-center text-neutral-500">
              No tier information found for this user.
              <div class="mt-4">
                 <UButton label="Initialize Tier" color="neutral" variant="outline" size="sm" />
              </div>
            </div>
          </UCard>
        </div>

        <!-- History Table -->
        <UCard>
          <template #header>
            <h3 class="font-semibold">Tier History</h3>
          </template>
          <UTable
            :columns="historyColumns"
            :data="history"
            :loading="isHistoryLoading"
          >
            <template #createdAt-cell="{ row }">
              {{ format(new Date(row.original.createdAt), 'MM-dd HH:mm') }}
            </template>
            <template #changeType-cell="{ row }">
              <UBadge :color="row.original.changeType === 'PROMOTION' ? 'success' : row.original.changeType === 'DEMOTION' ? 'error' : 'neutral'" variant="subtle" size="sm">
                {{ row.original.changeType }}
              </UBadge>
            </template>
          </UTable>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Force Update Modal -->
  <UModal v-model:open="isForceUpdateModalOpen" title="Force Update User Tier">
    <template #body>
      <div class="space-y-4">
        <UFormField label="New Tier">
          <USelect
            v-model="forceUpdateState.tierCode"
            :items="tiers.map(t => ({ label: t.code, value: t.code }))"
            placeholder="Select a tier"
          />
        </UFormField>
        <UFormField label="Reason">
          <UTextarea v-model="forceUpdateState.reason" placeholder="Enter reason for manual update" />
        </UFormField>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton :label="t('common.cancel')" color="neutral" variant="ghost" @click="isForceUpdateModalOpen = false" />
        <UButton label="Update" color="warning" :loading="isForceUpdating" @click="onForceUpdate" />
      </div>
    </template>
  </UModal>
</template>
