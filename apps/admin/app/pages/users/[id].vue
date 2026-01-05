<script setup lang="ts">
import { useUserAdminControllerFindOne } from '~/api/generated/endpoints/dPCBackendAPI'

const route = useRoute()
const { t } = useI18n()
const userId = route.params.id as string

const { data: user, isPending: isUserLoading } = useUserAdminControllerFindOne(userId)

const historyRefreshKey = ref(0)
const refreshHistory = () => {
    historyRefreshKey.value++
}

const tabs = computed(() => [
  {
    slot: 'overview',
    label: t('common.overview')
  },
  {
    slot: 'tier-history',
    label: t('tiers.history.title')
  },
  {
    slot: 'transaction-history',
    label: t('users.wallet.transaction_history')
  }
])
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

      <div v-else-if="user?.data" class="flex-1 flex flex-col h-full overflow-hidden">
        <UTabs :items="tabs" variant="link" class="w-full h-full flex flex-col" :ui="{ root: 'h-full flex flex-col', content: 'flex-1 overflow-y-auto p-4', list: 'px-4 pt-4 border-b border-neutral-200 dark:border-neutral-800' }">
          <template #overview>
            <div class="space-y-6 max-w-6xl mx-auto pb-10">
              <!-- Basic Info Grid -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="md:col-span-1 space-y-6">
                  <UsersUserInfoCard :user="user.data" />
                  <UsersUserWalletCard :user-id="user.data.id" />
                </div>

                <!-- Tier Info Card -->
                <div class="md:col-span-2">
                  <UsersUserTierCard :user-id="user.data.id" @refresh-history="refreshHistory" />
                </div>
              </div>
            </div>
          </template>

          <template #tier-history>
            <div class="max-w-6xl mx-auto py-2">
              <TiersTierHistoryTable :key="historyRefreshKey" :user-id="user.data.id" />
            </div>
          </template>
          
          <template #transaction-history>
            <div class="max-w-6xl mx-auto py-2">
              <UsersUserTransactionLogs :user-id="user.data.id" />
            </div>
          </template>
        </UTabs>
      </div>
    </template>
  </UDashboardPanel>
</template>
