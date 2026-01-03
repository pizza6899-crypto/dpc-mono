<script setup lang="ts">
const colorMode = useColorMode()

const isDark = computed({
  get() {
    return colorMode.value === 'dark'
  },
  set() {
    colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  }
})
</script>

<template>
  <ClientOnly v-if="!colorMode.forced">
    <UButton
      :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
      color="gray"
      variant="ghost"
      aria-label="Theme"
      class="cursor-pointer select-none"
      v-bind="$attrs"
      @click="isDark = !isDark"
    />

    <template #placeholder>
      <UButton
        icon="i-lucide-sun"
        color="gray"
        variant="ghost"
        aria-label="Theme"
        class="cursor-pointer select-none"
        v-bind="$attrs"
      />
    </template>
  </ClientOnly>
</template>
