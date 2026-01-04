<script setup lang="ts">
import { useUserAdminControllerListUsers } from '~/api/generated/endpoints/dPCBackendAPI'

const { t } = useI18n()

const page = ref(1)
const uiStore = useUIStore()
const pageCount = computed({
  get: () => uiStore.tableSettings.users.itemsPerPage,
  set: (val) => uiStore.tableSettings.users.itemsPerPage = val
})
const isAddModalOpen = ref(false)

const { data, status, isPending } = useUserAdminControllerListUsers(computed(() => ({
  page: page.value,
  limit: pageCount.value
})))

// Reset to first page when page count changes
watch(pageCount, () => {
  page.value = 1
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="t('common.users')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            label="Add user"
            trailing-icon="i-lucide-plus"
            color="neutral"
            variant="outline"
            @click="isAddModalOpen = true"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UsersTable
        :users="data?.data || []"
        :loading="isPending"
        :total="data?.pagination?.total || 0"
        v-model:page-count="pageCount"
        v-model:page="page"
        class="flex-1"
      />
    </template>
  </UDashboardPanel>
</template>
