<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="t('common.games')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UPageCard :title="t('common.games')" description="Manage games and providers here.">
         <div class="p-4 text-center text-gray-500">
            Coming Soon
         </div>
      </UPageCard>
    </template>
  </UDashboardPanel>
</template>
