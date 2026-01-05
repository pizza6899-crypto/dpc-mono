<script setup lang="ts">
import { useUserAdminControllerFindOne } from '~/api/generated/endpoints/dPCBackendAPI'

const route = useRoute()
const userId = route.params.id as string

const { data: user, isPending: isUserLoading } = useUserAdminControllerFindOne(userId)

const historyRefreshKey = ref(0)
const refreshHistory = () => {
    historyRefreshKey.value++
}
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
          <div class="md:col-span-1">
            <UsersUserInfoCard :user="user.data" />
          </div>

          <!-- Tier Info Card -->
          <div class="md:col-span-2">
            <UsersUserTierCard :user-id="user.data.id" @refresh-history="refreshHistory" />
          </div>
        </div>

        <!-- History Table -->
        <div class="hidden md:block">
          <TiersTierHistoryTable :key="historyRefreshKey" :user-id="user.data.id" />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
