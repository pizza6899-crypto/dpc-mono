<script setup lang="ts">
const route = useRoute()
const userId = route.params.id

const { t } = useI18n()
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="`User ${userId}`">
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            to="/users"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-4">
        <p>User Details for ID: {{ userId }}</p>
        <!-- User details implementation will go here -->
      </div>
    </template>
  </UDashboardPanel>
</template>
