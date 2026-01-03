<script setup lang="ts">
defineProps<{
  collapsed?: boolean
}>()

const runConfig = useRuntimeConfig()
const appName = runConfig.public.appName || 'Admin'
</script>

<template>
  <UButton
    color="neutral"
    variant="ghost"
    block
    :square="collapsed"
    :class="[!collapsed && 'py-2']"
    to="/"
    class="font-bold hover:bg-transparent! active:bg-transparent!"
  >
    <template #leading>
      <div class="flex items-center justify-center rounded-lg bg-primary-500/10 ring-1 ring-primary-500/20 p-1">
        <UIcon name="i-lucide-shield-check" class="w-5 h-5 text-primary-500" />
      </div>
    </template>
    
    <span v-if="!collapsed" class="truncate text-highlighted">
      {{ $t('app.name') }}
    </span>
  </UButton>
</template>
