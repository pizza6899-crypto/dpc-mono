<script setup lang="ts">
import { NAVIGATION_ITEMS } from '@app/constants/navigation'
import { useCredentialAdminControllerLogout } from '@apis/services/admin-auth/admin-auth'

const authStore = useAuthStore()
const { t, locale } = useI18n()
const isSidebarOpen = ref(false)
const route = useRoute()
const toast = useToast()

const { mutate: apiLogout } = useCredentialAdminControllerLogout({
  mutation: {
    onSettled: () => {
      authStore.logout()
      toast.add({ title: t('logout_success') || 'Logged out successfully' })
    }
  }
})

// i18n 및 권한(RBAC)이 적용된 메뉴 데이터
const mappedNavItems = computed(() => {
  const userRole = authStore.user?.role

  return NAVIGATION_ITEMS
    .filter(item => {
      if (!item.roles) return true
      return userRole && item.roles.includes(userRole)
    })
    .map(item => ({
      ...item,
      label: item.labelKey ? t(item.labelKey) : item.label,
      children: item.children
        ?.filter(child => {
          if (!child.roles) return true
          return userRole && child.roles.includes(userRole)
        })
        .map(child => ({
          ...child,
          label: child.labelKey ? t(child.labelKey) : child.label
        }))
    }))
})

const handleLogout = () => {
  apiLogout()
}

const breadcrumbs = computed(() => {
  const paths = route.path.split('/').filter(Boolean)
  return [
    { label: t('dashboard'), icon: 'i-heroicons-home', to: '/' },
    ...paths.map((path, index) => ({
      label: path.charAt(0).toUpperCase() + path.slice(1),
      to: '/' + paths.slice(0, index + 1).join('/')
    }))
  ]
})

// Route change 시 모바일 사이드바 닫기
watch(() => route.fullPath, () => {
  isSidebarOpen.value = false
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 flex shadow-sm">
    <!-- Desktop Sidebar -->
    <aside class="hidden lg:flex w-72 flex-col fixed inset-y-0 z-50 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      <div class="p-6 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800">
        <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <UIcon name="i-heroicons-command-line" class="text-white w-5 h-5" />
        </div>
        <span class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600">
          Admin Portal
        </span>
      </div>

      <div class="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide">
        <UNavigationTree :links="mappedNavItems" />
      </div>

      <!-- Sidebar User Footer -->
      <div class="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
        <div class="flex items-center gap-3 px-2 py-2 rounded-xl transition-colors">
          <UAvatar :alt="authStore.user?.name || 'Admin'" size="sm" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold truncate">{{ authStore.user?.name || 'Admin User' }}</p>
            <p class="text-xs text-gray-500 truncate">{{ authStore.user?.role }}</p>
          </div>
          <UButton 
            variant="ghost" 
            color="gray" 
            icon="i-heroicons-arrow-left-on-rectangle"
            size="xs"
            @click="handleLogout"
          />
        </div>
      </div>
    </aside>

    <!-- Main Wrapper -->
    <div class="flex-1 lg:pl-72 flex flex-col min-w-0">
      <!-- Top Header -->
      <header class="sticky top-0 z-40 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 lg:px-8 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <UButton
            variant="ghost"
            color="gray"
            icon="i-heroicons-bars-3-bottom-left"
            class="lg:hidden"
            @click="isSidebarOpen = true"
          />
          <UBreadcrumb :items="breadcrumbs" class="hidden sm:inline-flex" />
        </div>

        <div class="flex items-center gap-2 sm:gap-4">
          <!-- Search Placeholder (Premium feel) -->
          <div class="hidden md:flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-400 gap-2 cursor-pointer hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-700 transition-all">
            <UIcon name="i-heroicons-magnifying-glass" />
            <span class="text-sm">{{ $t('common.search') || 'Search...' }}</span>
            <UKbd>⌘K</UKbd>
          </div>

          <div class="h-6 w-px bg-gray-200 dark:bg-gray-800 mx-1 hidden sm:block" />

          <LanguagePicker size="sm" />

          <ColorModeToggle size="sm" />

          <UNotifications>
             <UButton variant="ghost" color="gray" icon="i-heroicons-bell" size="sm" />
          </UNotifications>
        </div>
      </header>

      <!-- Main Content Area -->
      <main class="flex-1 p-4 lg:p-8">
        <div class="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <!-- Mobile Breadcrumb -->
          <UBreadcrumb :items="breadcrumbs" class="sm:hidden mb-4" />
          
          <slot />
        </div>
      </main>

      <!-- Footer (Optional) -->
      <footer class="h-12 flex items-center justify-center text-xs text-gray-400 border-t border-gray-100 dark:border-gray-900">
        &copy; {{ new Date().getFullYear() }} DPC Admin. All rights reserved.
      </footer>
    </div>

    <!-- Mobile Slideover Sidebar -->
    <USlideover v-model="isSidebarOpen" side="left" class="lg:hidden">
      <div class="flex flex-col h-full bg-white dark:bg-gray-950">
        <div class="p-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
          <div class="flex items-center gap-2 font-bold text-primary">
             <UIcon name="i-heroicons-command-line" class="w-6 h-6" />
             <span>Admin</span>
          </div>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" @click="isSidebarOpen = false" />
        </div>
        <div class="flex-1 overflow-y-auto p-4">
          <UNavigationTree :links="mappedNavItems" />
        </div>
        <div class="p-4 border-t border-gray-100 dark:border-gray-800">
          <div class="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-900 rounded-xl">
             <UAvatar :alt="authStore.user?.name || 'Admin'" size="sm" />
             <div class="flex-1">
                <p class="text-sm font-semibold truncate">{{ authStore.user?.name }}</p>
                <p class="text-xs text-gray-500 truncate">{{ authStore.user?.email }}</p>
             </div>
             <UButton variant="ghost" color="red" icon="i-heroicons-power" size="xs" @click="handleLogout" />
          </div>
        </div>
      </div>
    </USlideover>
  </div>
</template>

<style scoped>
/* Nuxt UI NavigationTree active styling */
:deep(.router-link-active) {
  color: var(--ui-primary);
  font-weight: 600;
  background-color: color-mix(in srgb, var(--ui-primary) 5%, transparent);
  border-left: 2px solid var(--ui-primary);
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
