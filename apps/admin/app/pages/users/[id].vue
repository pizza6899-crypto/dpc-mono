<script setup lang="ts">
import { useUserAdminControllerFindOne } from '~/api/generated/endpoints/dPCBackendAPI'

const route = useRoute()
const userId = route.params.id as string

const { data: user, isPending: isUserLoading } = useUserAdminControllerFindOne(userId)
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
        <div class="flex-1 overflow-hidden">
          <UsersDetailTabs :user="user.data" />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
