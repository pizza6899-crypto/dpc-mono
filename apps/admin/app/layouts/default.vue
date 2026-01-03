<script setup lang="ts">
import { NAVIGATION_ITEMS } from '@app/constants/navigation'
import { useCredentialAdminControllerLogout } from '@apis/services/admin-auth/admin-auth'

const authStore = useAuthStore()
const { t } = useI18n()
const isSidebarOpen = ref(false)
const route = useRoute()
const toast = useToast()

// Logout Logic
const { mutate: apiLogout } = useCredentialAdminControllerLogout({
  mutation: {
    onSettled: () => {
      authStore.logout()
      toast.add({ title: t('logout_success') || 'Logged out successfully' })
    }
  }
})

const handleLogout = () => {
  apiLogout()
}

// Navigation Data Processing (RBAC + i18n)
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
      icon: item.icon?.replace('heroicons-', 'lucide-'), // Lucide icon 변환 (임시 호환성)
      children: item.children
        ?.filter(child => {
          if (!child.roles) return true
          return userRole && child.roles.includes(userRole)
        })
        .map(child => ({
          ...child,
          label: child.labelKey ? t(child.labelKey) : child.label,
          icon: child.icon?.replace('heroicons-', 'lucide-') 
        }))
    }))
})

// Breadcrumbs
const breadcrumbs = computed(() => {
  const paths = route.path.split('/').filter(Boolean)
  return [
    { label: t('dashboard'), icon: 'i-lucide-home', to: '/' },
    ...paths.map((path, index) => ({
      label: path.charAt(0).toUpperCase() + path.slice(1),
      to: '/' + paths.slice(0, index + 1).join('/')
    }))
  ]
})

// Auto-close mobile sidebar on route change
watch(() => route.fullPath, () => {
  isSidebarOpen.value = false
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300">
    
    <!-- =========================================================
         1. MOBILE HEADER (Top Bar)
         - Visible on all screens, but optimized for Mobile first.
         - Contains: Menu Trigger, Logo, Actions
    ========================================================== -->
    <header 
      class="sticky top-0 z-40 w-full h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 flex items-center justify-between"
    >
      <!-- Left: Trigger & Logo -->
      <div class="flex items-center gap-3">
        <UButton
          variant="ghost"
          color="gray"
          icon="i-lucide-menu"
          class="lg:hidden"
          @click="isSidebarOpen = true"
          aria-label="Open Menu"
        />
        
        <!-- Logo (Mobile Compact / Desktop Full) -->
        <div class="flex items-center gap-2">
           <div class="w-8 h-8 rounded-lg bg-linear-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
             <UIcon name="i-lucide-command" class="w-5 h-5" />
           </div>
           <span class="font-bold text-lg hidden sm:block">Admin</span>
        </div>
      </div>

      <!-- Right: Global Actions -->
      <div class="flex items-center gap-1 sm:gap-2">
        <!-- Search (Desktop Only visual, Icon only on mobile) -->
        <UButton icon="i-lucide-search" color="gray" variant="ghost" class="sm:hidden" />
        <div class="hidden sm:flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500 text-sm cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition">
             <UIcon name="i-lucide-search" class="w-4 h-4 mr-2" />
             <span>{{ t('common.search') }}</span>
             <UKbd class="ml-2" size="xs">⌘K</UKbd>
        </div>

        <div class="h-5 w-px bg-gray-200 dark:bg-gray-800 mx-2 hidden sm:block" />

        <!-- Locales & Theme (Hidden on tiny screens, moved to sidebar?) No, keep explicit for accessibility -->
        <LanguagePicker class="hidden sm:block" />
        <ColorModeToggle />

        <!-- Notifications -->
        <UButton icon="i-lucide-bell" color="gray" variant="ghost">
          <div class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
        </UButton>
      </div>
    </header>

    <div class="flex">
      <!-- =========================================================
           2. DESKTOP SIDEBAR (Fixed Left)
           - Hidden on Mobile (< lg)
      ========================================================== -->
      <aside class="hidden lg:flex w-72 flex-col fixed inset-y-0 z-30 pt-16 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300">
        
        <!-- Navigation -->
        <div class="flex-1 overflow-y-auto px-4 py-6">
          <nav class="space-y-1">
             <!-- Using UVerticalNavigation or custom loop? UNavigationTree is handy -->
             <UNavigationTree :links="mappedNavItems" />
          </nav>
        </div>

        <!-- User Profile Footer -->
        <div class="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div class="flex items-center gap-3 p-2 rounded-xl hover:bg-white dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all cursor-pointer group">
            <UAvatar :alt="authStore.user?.name" size="sm" class="ring-2 ring-primary-500/20" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold truncate text-gray-900 dark:text-gray-100">{{ authStore.user?.name || 'Admin' }}</p>
              <p class="text-xs text-gray-500 truncate">{{ authStore.user?.email || 'admin@dpc.com' }}</p>
            </div>
            <UButton 
              icon="i-lucide-log-out" 
              color="gray" 
              variant="ghost" 
              size="xs" 
              class="opacity-0 group-hover:opacity-100 transition-opacity"
              @click="handleLogout"
            />
          </div>
        </div>
      </aside>

      <!-- =========================================================
           3. MOBILE SIDEBAR (Slideover)
      ========================================================== -->
      <USlideover v-model="isSidebarOpen" side="left" class="lg:hidden">
        <div class="bg-white dark:bg-gray-950 flex flex-col h-full">
           <!-- Mobile Sidebar Header -->
           <div class="h-16 flex items-center justify-between px-6 border-b border-gray-100 dark:border-gray-800">
             <span class="font-bold text-lg flex items-center gap-2">
               <UIcon name="i-lucide-command" class="text-primary-500" />
               Menu
             </span>
             <UButton icon="i-lucide-x" color="gray" variant="ghost" @click="isSidebarOpen = false" />
           </div>

           <!-- Mobile Navigation -->
           <div class="flex-1 overflow-y-auto p-4">
             <UNavigationTree :links="mappedNavItems" />
             
             <UDivider class="my-4" />
             
             <!-- Mobile Config Utilities -->
             <div class="space-y-4 px-2">
               <div class="flex items-center justify-between">
                 <span class="text-sm text-gray-500">{{ t('settings') }} Mode</span>
                 <ColorModeToggle />
               </div>
               <div class="flex items-center justify-between">
                 <span class="text-sm text-gray-500">Language</span>
                 <LanguagePicker show-label />
               </div>
             </div>
           </div>

           <!-- Mobile User Footer -->
           <div class="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
             <div class="flex items-center gap-3">
               <UAvatar :alt="authStore.user?.name" size="md" />
               <div class="flex-1">
                 <p class="font-medium text-sm">{{ authStore.user?.name }}</p>
                 <button class="text-xs text-red-500 underline" @click="handleLogout">
                   {{ t('logout') }}
                 </button>
               </div>
             </div>
           </div>
        </div>
      </USlideover>

      <!-- =========================================================
           4. MAIN CONTENT
      ========================================================== -->
      <main class="flex-1 lg:pl-72 w-full min-w-0 transition-all duration-300">
        <div class="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
           <!-- Dynamic Breadcrumbs -->
           <UBreadcrumb 
             :items="breadcrumbs" 
             class="mb-6 hidden sm:flex" 
             :ui="{ active: 'text-primary-500 font-semibold' }"
           />

           <div class="animate-in fade-in slide-in-from-bottom-3 duration-500">
              <slot />
           </div>
        </div>
        
        <!-- Footer -->
        <footer class="mt-auto py-6 text-center text-xs text-gray-400 border-t border-gray-100 dark:border-gray-800/50">
          <p>&copy; {{ new Date().getFullYear() }} DPC Admin Portal. All rights reserved.</p>
        </footer>
      </main>

    </div>
  </div>
</template>
