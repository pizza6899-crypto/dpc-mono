<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const toast = useToast()

const open = ref(false)

const { t } = useI18n()

const links = computed<NavigationMenuItem[][]>(() => [[{
  label: t('common.dashboard'),
  icon: 'i-lucide-house',
  to: '/',
  onSelect: () => {
    open.value = false
  }
}, {
  label: t('common.users'),
  icon: 'i-lucide-user',
  to: '/users',
  onSelect: () => {
    open.value = false
  }
}, {
  label: t('common.tiers'),
  icon: 'i-lucide-layers',
  to: '/tiers/policy',
  defaultOpen: true,
  children: [{
    label: t('common.policy'),
    to: '/tiers/policy',
    exact: true,
    onSelect: () => {
      open.value = false
    }
  }, {
    label: t('tiers.history.title'),
    to: '/tiers/history',
    exact: true,
    onSelect: () => {
      open.value = false
    }
  }]
}, {
  label: t('common.settings'),
  to: '/settings',
  icon: 'i-lucide-settings',
  defaultOpen: true,
  type: 'trigger',
  children: [{
    label: t('common.general'),
    to: '/settings',
    exact: true,
    onSelect: () => {
      open.value = false
    }
  }]
}]])

const groups = computed(() => [{
  id: 'links',
  label: t('common.goTo'),
  items: links.value.flat()
}])

</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>
