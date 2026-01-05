<script setup lang="ts">
import type { TierResponseDto } from '~/api/generated/models'
import TiersForm from './TiersForm.vue'
import TiersTranslationForm from './TiersTranslationForm.vue'

const { t } = useI18n()
const emit = defineEmits(['success'])

// Modal states
const isFormModalOpen = ref(false)
const isTranslationModalOpen = ref(false)
const selectedTier = ref<TierResponseDto | undefined>()

function openCreate() {
  selectedTier.value = undefined
  isFormModalOpen.value = true
}

function openEdit(tier: TierResponseDto) {
  selectedTier.value = tier
  isFormModalOpen.value = true
}

function openTranslation(tier: TierResponseDto) {
  selectedTier.value = tier
  isTranslationModalOpen.value = true
}

function onSuccess() {
  isFormModalOpen.value = false
  isTranslationModalOpen.value = false
  emit('success')
}

defineExpose({
  openCreate,
  openEdit,
  openTranslation
})
</script>

<template>
  <div>
    <!-- Tier form modal -->
    <UModal
      v-model:open="isFormModalOpen"
      :title="selectedTier ? t('tiers.edit_tier') : t('tiers.add_tier')"
      :description="selectedTier ? undefined : t('tiers.messages.add_tier_desc')"
    >
      <template #body>
        <TiersForm
          :tier="selectedTier"
          @success="onSuccess"
          @close="isFormModalOpen = false"
        />
      </template>
    </UModal>

    <!-- Translation modal -->
    <UModal
      v-model:open="isTranslationModalOpen"
      :title="t('tiers.manage_translations')"
      :description="selectedTier ? `${t('tiers.manage_translations')}: ${selectedTier.code}` : undefined"
    >
      <template #body>
        <TiersTranslationForm
          v-if="selectedTier"
          :tier="selectedTier"
          @success="onSuccess"
          @close="isTranslationModalOpen = false"
        />
      </template>
    </UModal>
  </div>
</template>
