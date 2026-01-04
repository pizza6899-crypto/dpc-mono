<script setup lang="ts">
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Users">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            label="Add user"
            trailing-icon="i-lucide-plus"
            color="neutral"
            variant="outline"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-1 items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-800">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          User content goes here
        </p>
      </div>
    </template>
  </UDashboardPanel>
</template>
