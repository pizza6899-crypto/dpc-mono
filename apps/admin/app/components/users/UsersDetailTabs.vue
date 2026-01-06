<script setup lang="ts">
import type { UserDetailResponseDto } from '~/api/generated/models'

const props = defineProps<{
  user: UserDetailResponseDto
}>()

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

// History refresh logic
const historyRefreshKey = ref(0)
const refreshHistory = () => {
    historyRefreshKey.value++
}

// Tabs configuration
const tabs = computed(() => [
  {
    value: 'overview',
    label: t('common.overview')
  },
  {
    value: 'tier-history',
    label: t('tiers.history.title')
  },
  {
    value: 'transaction-history',
    label: t('users.wallet.transaction_history')
  }
])

// Tab state synchronized with URL
const active = computed({
  get() {
    return (route.query.tab as string) || 'overview'
  },
  set(tab) {
    router.replace({
      query: { ...route.query, tab },
    })
  }
})
</script>

<template>
  <UTabs 
    v-model="active" 
    :items="tabs" 
    variant="link" 
    class="w-full h-full flex flex-col" 
    :ui="{ root: 'h-full flex flex-col', content: 'flex-1 overflow-y-auto p-4', list: 'px-4 pt-4 border-b border-neutral-200 dark:border-neutral-800' }"
  >
    <template #content="{ item }">
      <div v-show="item.value === 'overview'">
        <div class="space-y-6 max-w-6xl mx-auto pb-10">
          <!-- Basic Info Grid -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="md:col-span-1 space-y-6">
              <UsersUserInfoCard :user="props.user" />
            </div>
            
            <!-- Tier Info & Wallet Card -->
            <div class="md:col-span-2 space-y-6">
              <UsersUserTierCard :user-id="props.user.id" @refresh-history="refreshHistory" />
              <UsersUserWalletCard :user-id="props.user.id" />
            </div>
          </div>
        </div>
      </div>
      
      <div v-show="item.value === 'tier-history'">
        <div class="max-w-6xl mx-auto py-2">
          <TiersTierHistoryTable :key="historyRefreshKey" :user-id="props.user.id" />
        </div>
      </div>
      
      <div v-show="item.value === 'transaction-history'">
        <div class="max-w-6xl mx-auto py-2">
          <UsersUserTransactionLogs :user-id="props.user.id" />
        </div>
      </div>
    </template>
  </UTabs>
</template>
