<script setup lang="ts">
import TierHistoryTable from '~/components/tiers/TierHistoryTable.vue'

const { t } = useI18n()
</script>

<template>
  <UDashboardPanelContent>
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-neutral-900 dark:text-white">
            {{ t('tiers.history.title') }}
          </h2>
          <p class="text-sm text-neutral-500 mt-1">
            {{ t('tiers.description') }}
          </p>
        </div>
      </div>

      <TierHistoryTable class="mt-4" />
    </div>
  </UDashboardPanelContent>
</template>
