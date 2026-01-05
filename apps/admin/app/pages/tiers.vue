<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { t } = useI18n()

const links = computed<NavigationMenuItem[][]>(() => [[{
  label: t('common.general'),
  icon: 'i-lucide-list',
  to: '/tiers',
  exact: true
}]])
</script>

<template>
  <UDashboardPanel id="tiers">
    <template #header>
      <UDashboardNavbar :title="t('common.tiers')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="w-full h-full">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>
