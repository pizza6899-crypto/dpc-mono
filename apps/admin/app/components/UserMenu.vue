<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const colorMode = useColorMode()
const { locale, locales, setLocale, t } = useI18n()
const authStore = useAuthStore()

const isLogoutModalOpen = ref(false)

const user = computed(() => ({
  name: authStore.user?.email || 'Admin',
  avatar: {
    src: `https://ui-avatars.com/api/?name=${authStore.user?.email || 'A'}&background=random`,
    alt: authStore.user?.email || 'Admin'
  }
}))

const items = computed<DropdownMenuItem[][]>(() => ([[{
  type: 'label',
  label: user.value.name,
  avatar: user.value.avatar
}], [{
  label: t('user_menu.settings'),
  icon: 'i-lucide-settings',
  to: '/settings'
}], [{
  label: t('user_menu.language'),
  icon: 'i-lucide-languages',
  children: locales.value.map((l: any) => ({
    label: l.name,
    type: 'checkbox',
    checked: locale.value === l.code,
    onSelect: (e: Event) => {
      e.preventDefault()
      setLocale(l.code)
    }
  }))
}, {
  label: t('user_menu.appearance'),
  icon: 'i-lucide-sun-moon',
  children: [{
    label: t('user_menu.light'),
    icon: 'i-lucide-sun',
    type: 'checkbox',
    checked: colorMode.value === 'light',
    onSelect(e: Event) {
      e.preventDefault()

      colorMode.preference = 'light'
    }
  }, {
    label: t('user_menu.dark'),
    icon: 'i-lucide-moon',
    type: 'checkbox',
    checked: colorMode.value === 'dark',
    onUpdateChecked(checked: boolean) {
      if (checked) {
        colorMode.preference = 'dark'
      }
    },
    onSelect(e: Event) {
      e.preventDefault()
    }
  }]
}], [{
  label: t('user_menu.logout'),
  icon: 'i-lucide-log-out',
  onSelect: () => {
    isLogoutModalOpen.value = true
  }
}]]))

async function handleLogout() {
  await authStore.logout()
  isLogoutModalOpen.value = false
}
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      v-bind="{
        ...user,
        label: collapsed ? undefined : user?.name,
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down'
      }"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{
        trailingIcon: 'text-dimmed'
      }"
    />

    <template #chip-leading="{ item }">
      <div class="inline-flex items-center justify-center shrink-0 size-5">
        <span
          class="rounded-full ring ring-bg bg-(--chip-light) dark:bg-(--chip-dark) size-2"
          :style="{
            '--chip-light': `var(--color-${(item as any).chip}-500)`,
            '--chip-dark': `var(--color-${(item as any).chip}-400)`
          }"
        />
      </div>
    </template>
  </UDropdownMenu>

  <UModal
    v-model:open="isLogoutModalOpen"
    :title="t('user_menu.logout_confirm_title')"
    :description="t('user_menu.logout_confirm_description')"
  >
    <template #footer>
      <UButton
        color="neutral"
        variant="subtle"
        @click="isLogoutModalOpen = false"
      >
        {{ t('common.cancel') }}
      </UButton>
      <UButton
        color="error"
        @click="handleLogout"
      >
        {{ t('user_menu.logout') }}
      </UButton>
    </template>
  </UModal>
</template>
