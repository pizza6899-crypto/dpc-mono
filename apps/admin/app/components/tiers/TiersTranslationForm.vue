<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useTierAdminControllerUpsertTranslation } from '~/api/generated/endpoints/dPCBackendAPI'
import type { TierResponseDto, TierTranslationDto } from '~/api/generated/models'

const { t } = useI18n()
const toast = useToast()

const props = defineProps<{
  tier: TierResponseDto
}>()

const emit = defineEmits(['success', 'close'])

const languages = [
  { label: 'English', value: 'EN' as const },
  { label: 'Korean', value: 'KO' as const },
  { label: 'Japanese', value: 'JA' as const }
]

const selectedLanguage = ref<'EN' | 'KO' | 'JA'>('EN')

const currentTranslation = computed(() => 
  props.tier.translations.find(tr => tr.language === selectedLanguage.value)
)

const state = reactive({
  name: ''
})

// Update state when language or tier changes
watch([selectedLanguage, () => props.tier], () => {
  state.name = currentTranslation.value?.name || ''
}, { immediate: true })

const schema = z.object({
  name: z.string().min(1)
})

type Schema = z.output<typeof schema>

const { mutate: upsertTranslation, isPending } = useTierAdminControllerUpsertTranslation({
  mutation: {
    onSuccess: () => {
      toast.add({ title: t('common.success'), icon: 'i-lucide-check-circle' })
      emit('success')
    },
    onError: (err: any) => {
      toast.add({
        title: t('common.error'),
        description: err.response?.data?.message || 'Failed to update translation',
        color: 'error'
      })
    }
  }
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  upsertTranslation({
    id: props.tier.id.toString(),
    language: selectedLanguage.value,
    data: { name: event.data.name }
  })
}
</script>

<template>
  <div class="space-y-6">
    <UFormField label="Language">
      <USelect
        v-model="selectedLanguage"
        :items="languages"
        class="w-full"
      />
    </UFormField>

    <UForm :schema="schema" :state="state" @submit="onSubmit" class="space-y-4">
      <UFormField label="Tier Name" name="name">
        <UInput v-model="state.name" class="w-full" placeholder="Enter tier name in selected language" />
      </UFormField>

      <div class="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <UButton :label="t('common.cancel')" color="neutral" variant="ghost" @click="emit('close')" />
        <UButton type="submit" label="Save Translation" :loading="isPending" />
      </div>
    </UForm>

    <div class="mt-4">
      <h4 class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Existing Translations</h4>
      <div class="space-y-2">
        <div v-for="tr in tier.translations" :key="tr.language" class="flex items-center justify-between text-sm p-2 bg-neutral-50 dark:bg-neutral-800 rounded">
          <span class="font-medium">{{ tr.language }}</span>
          <span>{{ tr.name }}</span>
        </div>
        <div v-if="tier.translations.length === 0" class="text-xs text-neutral-500 italic">
          No translations added yet.
        </div>
      </div>
    </div>
  </div>
</template>
