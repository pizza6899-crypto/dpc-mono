<script setup lang="ts">
import { z } from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useTierAdminControllerCreate, useTierAdminControllerUpdate } from '~/api/generated/endpoints/dPCBackendAPI'
import type { TierResponseDto } from '~/api/generated/models'

const { t } = useI18n()
const toast = useToast()

const props = defineProps<{
  tier?: TierResponseDto
}>()

const emit = defineEmits(['success', 'close'])

const v = useValidators()

const schema = z.object({
  priority: v.minNumber(0, t('tiers.priority')),
  code: v.tierCode(t('tiers.code')),
  requirementUsd: v.minNumber(0, t('tiers.requirement_usd')),
  levelUpBonusUsd: v.minNumber(0, t('tiers.level_up_bonus_usd')).optional().default(0),
  compRate: v.percentage(t('tiers.comp_rate'))
})

type Schema = z.output<typeof schema>

const state = reactive({
  priority: props.tier?.priority ?? 0,
  code: props.tier?.code ?? '',
  requirementUsd: Number(props.tier?.requirementUsd ?? 0),
  levelUpBonusUsd: Number(props.tier?.levelUpBonusUsd ?? 0),
  compRate: Number(props.tier?.compRate ?? 0) * 100
})

const { mutate: createTier, isPending: isCreating } = useTierAdminControllerCreate({
  mutation: {
    onSuccess: () => {
      toast.add({ title: t('common.success'), icon: 'i-lucide-check-circle' })
      emit('success')
    },
    onError: (err: any) => {
      toast.add({ 
        title: t('common.error'), 
        description: err.response?.data?.message || 'Failed to create tier',
        color: 'error' 
      })
    }
  }
})

const { mutate: updateTier, isPending: isUpdating } = useTierAdminControllerUpdate({
  mutation: {
    onSuccess: () => {
      toast.add({ title: t('common.success'), icon: 'i-lucide-check-circle' })
      emit('success')
    },
    onError: (err: any) => {
      toast.add({ 
        title: t('common.error'), 
        description: err.response?.data?.message || 'Failed to update tier',
        color: 'error' 
      })
    }
  }
})

const isLoading = computed(() => isCreating.value || isUpdating.value)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  const submitData = {
    ...event.data,
    compRate: (event.data.compRate || 0) / 100
  }

  if (props.tier) {
    updateTier({ id: props.tier.id.toString(), data: submitData })
  } else {
    createTier({ data: submitData })
  }
}
</script>

<template>
  <UForm :schema="schema" :state="state" @submit="onSubmit" class="space-y-6">
    <UFormField :label="t('tiers.priority')" name="priority">
      <UInput v-model.number="state.priority" type="number" class="w-full" />
    </UFormField>

    <UFormField :label="t('tiers.code')" name="code">
      <UInput v-model="state.code" class="w-full" />
    </UFormField>

    <UFormField :label="t('tiers.requirement_usd')" name="requirementUsd">
      <UInput v-model.number="state.requirementUsd" type="number" class="w-full">
        <template #leading>
          <span class="text-neutral-500">$</span>
        </template>
      </UInput>
    </UFormField>

    <UFormField :label="t('tiers.level_up_bonus_usd')" name="levelUpBonusUsd">
      <UInput v-model.number="state.levelUpBonusUsd" type="number" class="w-full">
        <template #leading>
          <span class="text-neutral-500">$</span>
        </template>
      </UInput>
    </UFormField>

    <UFormField :label="t('tiers.comp_rate')" name="compRate" :description="`0.5% = 0.5` ">
      <UInput v-model.number="state.compRate" type="number" step="0.01" class="w-full" placeholder="0.00">
        <template #trailing>
          <span class="text-neutral-500 font-medium">%</span>
        </template>
      </UInput>
    </UFormField>

    <div class="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
      <UButton :label="t('common.cancel')" color="neutral" variant="ghost" @click="emit('close')" />
      <UButton type="submit" :label="tier ? t('tiers.edit_tier') : t('tiers.add_tier')" :loading="isLoading" />
    </div>
  </UForm>
</template>
