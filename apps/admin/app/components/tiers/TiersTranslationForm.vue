<script setup lang="ts">
import { useTierAdminControllerUpsertTranslation } from '~/api/generated/endpoints/dPCBackendAPI'
import type { TierResponseDto } from '~/api/generated/models'
import { SUPPORTED_LANGUAGES } from '~/utils/languages'

const props = defineProps<{
  tier: TierResponseDto
}>()

const emit = defineEmits(['success', 'close'])
const { t } = useI18n()
const toast = useToast()

// Use central language configuration
const supportedLanguages = SUPPORTED_LANGUAGES

// Initialize state with existing translations
const state = reactive(
  supportedLanguages.reduce((acc, lang) => {
    const existing = props.tier.translations.find(t => t.language === lang.code)
    acc[lang.code] = existing?.name || ''
    return acc
  }, {} as Record<string, string>)
)

const { mutateAsync: upsertTranslation } = useTierAdminControllerUpsertTranslation()
const isSaving = ref(false)

async function onSaveAll() {
  isSaving.value = true
  try {
    // Collect all non-empty translations to save
    const promises = Object.entries(state)
      .filter(([_, name]) => name.trim() !== '')
      .map(([lang, name]) => 
        upsertTranslation({
          id: props.tier.id.toString(),
          language: lang as any,
          data: { name }
        })
      )
    
    if (promises.length === 0) {
      toast.add({ title: 'No changes to save', color: 'neutral' })
      isSaving.value = false
      return
    }

    await Promise.all(promises)
    
    toast.add({ title: t('common.success'), icon: 'i-lucide-check-circle' })
    emit('success')
  } catch (err: any) {
    toast.add({
      title: t('common.error'),
      description: err.response?.data?.message || 'Failed to update translations',
      color: 'error'
    })
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-4">
      <UFormField 
        v-for="lang in supportedLanguages" 
        :key="lang.code" 
        :label="lang.label"
      >
        <UInput 
          v-model="state[lang.code]" 
          :placeholder="`Enter ${lang.label} name`"
          class="w-full"
        >
          <template #leading>
            <span class="text-xs font-bold text-neutral-400">{{ lang.code }}</span>
          </template>
        </UInput>
      </UFormField>
    </div>

    <div class="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
      <UButton :label="t('common.cancel')" color="neutral" variant="ghost" @click="emit('close')" />
      <UButton 
        icon="i-lucide-save" 
        :label="t('tiers.save_all')" 
        :loading="isSaving" 
        @click="onSaveAll" 
      />
    </div>
  </div>
</template>
