<script setup lang="ts">
import { useUserAdminControllerListUsers } from '~/api/generated/endpoints/dPCBackendAPI'
import UsersAddForm from '~/components/users/UsersAddForm.vue'

const { t } = useI18n()

const page = ref(1)
const uiStore = useUIStore()
const pageCount = computed({
  get: () => uiStore.tableSettings.users.itemsPerPage,
  set: (val) => uiStore.tableSettings.users.itemsPerPage = val
})

const { data, status, isPending, refetch } = useUserAdminControllerListUsers(computed(() => ({
  page: page.value,
  limit: pageCount.value
})))

// Modal state
const isAddModalOpen = ref(false)

defineShortcuts({
  o: () => isAddModalOpen.value = !isAddModalOpen.value
})

function onUserCreated() {
  isAddModalOpen.value = false
  refetch()
}

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
            :label="t('users.add_user')"
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

      <!-- User Add Modal -->
      <UModal
        v-model:open="isAddModalOpen"
        :dismissible="false"
        :title="t('users.add_user')"
        :description="t('users.messages.add_user_desc')"
      >
        <template #body>
          <UsersAddForm
            @close="isAddModalOpen = false"
            @success="onUserCreated"
          />
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
