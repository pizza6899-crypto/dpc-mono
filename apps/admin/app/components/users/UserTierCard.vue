<script setup lang="ts">
import { format } from 'date-fns'
import {
  useTierAdminControllerGetUserTier,
  useTierAdminControllerFindAll,
  useTierAdminControllerForceUpdateUserTier
} from '~/api/generated/endpoints/dPCBackendAPI'

const props = defineProps<{
  userId: string
}>()

const { t, locale } = useI18n()
const toast = useToast()

// Data Fetching
const { data: userTierResponse, isPending: isTierLoading, refetch: refetchTier } = useTierAdminControllerGetUserTier(props.userId)
const { data: allTiersResponse } = useTierAdminControllerFindAll()

const userTier = computed(() => userTierResponse.value?.data)
const tiers = computed(() => allTiersResponse.value?.data || [])

// Force Update Modal
const isForceUpdateModalOpen = ref(false)
const forceUpdateState = reactive({
  tierCode: '',
  reason: ''
})

const { mutate: forceUpdate, isPending: isForceUpdating } = useTierAdminControllerForceUpdateUserTier({
  mutation: {
    onSuccess: () => {
      toast.add({ title: t('common.success'), icon: 'i-lucide-check-circle' })
      isForceUpdateModalOpen.value = false
      refetchTier()
      // Note: If we need to refresh history table outside, we might need an event emitter
      emit('refresh-history')
    },
    onError: (err: any) => {
      toast.add({
        title: t('common.error'),
        description: err.response?.data?.message || 'Failed to force update tier',
        color: 'error'
      })
    }
  }
})

const emit = defineEmits<{
  (e: 'refresh-history'): void
}>()

function onForceUpdate() {
  forceUpdate({
    userId: props.userId,
    data: {
      tierCode: forceUpdateState.tierCode,
      reason: forceUpdateState.reason
    }
  })
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h3 class="font-semibold">Tier & VIP</h3>
        <UButton
          icon="i-lucide-shield-alert"
          label="Force Update"
          size="xs"
          color="warning"
          variant="subtle"
          @click="isForceUpdateModalOpen = true"
        />
      </div>
    </template>
    
    <div v-if="isTierLoading" class="p-4 flex justify-center">
      <UIcon name="i-lucide-loader-2" class="animate-spin w-5 h-5 text-neutral-400" />
    </div>

    <div v-else-if="userTier" class="grid grid-cols-1 sm:grid-cols-2 gap-8">
      <div class="space-y-4">
        <div>
          <label class="text-xs text-neutral-500 uppercase tracking-wider">Current Tier</label>
          <div class="flex items-center gap-3 mt-1">
            <span class="text-3xl font-bold text-neutral-900 dark:text-white">{{ userTier.tierCode }}</span>
            <UBadge v-if="userTier.isManualLock" color="warning" variant="subtle" icon="i-lucide-lock">Locked</UBadge>
          </div>
          <p class="text-sm text-neutral-500 mt-1">
            {{ userTier.tierTranslations?.find(t => t.language === (locale.toUpperCase()))?.name 
               || userTier.tierTranslations?.find(t => t.language === 'EN')?.name 
               || userTier.tierCode }}
          </p>
        </div>

        <div>
          <label class="text-xs text-neutral-500 uppercase tracking-wider">Total Rolling Progress</label>
          <div class="mt-1">
            <span class="text-xl font-semibold">${{ Number(userTier.totalRollingUsd).toLocaleString() }}</span>
            <span class="text-neutral-400 mx-2">/</span>
            <span class="text-neutral-500 text-sm">${{ Number(userTier.tierRequirementUsd || 0).toLocaleString() }}</span>
          </div>
          <!-- Progress Bar -->
           <div class="mt-2 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div 
              class="h-full bg-primary-500 transition-all duration-500 ease-out" 
              :style="{ width: `${Math.min(100, (Number(userTier.totalRollingUsd) / (Number(userTier.tierRequirementUsd) || 1)) * 100)}%` }"
            ></div>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
          <div class="flex items-center gap-2 text-sm font-medium mb-3">
            <UIcon name="i-lucide-info" class="w-4 h-4" />
            Tier Details
          </div>
          <ul class="text-xs space-y-2 text-neutral-600 dark:text-neutral-400">
            <li class="flex justify-between">
              <span>Highest Reached:</span>
              <span class="font-semibold">{{ userTier.highestPromotedPriority }}</span>
            </li>
            <li class="flex justify-between">
              <span>Last Promoted:</span>
              <span>{{ userTier.lastPromotedAt ? format(new Date(userTier.lastPromotedAt), 'yyyy-MM-dd') : 'Never' }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div v-else class="p-8 text-center text-neutral-500">
      No tier information found for this user.
      <div class="mt-4">
         <UButton label="Initialize Tier" color="neutral" variant="outline" size="sm" />
      </div>
    </div>

    <!-- Force Update Modal (Nested in Component) -->
    <UModal v-model:open="isForceUpdateModalOpen" title="Force Update User Tier">
      <template #body>
        <div class="space-y-4">
          <UFormField label="New Tier">
            <USelect
              v-model="forceUpdateState.tierCode"
              :items="tiers.map(t => ({ label: t.code, value: t.code }))"
              placeholder="Select a tier"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Reason">
            <UTextarea v-model="forceUpdateState.reason" placeholder="Enter reason for manual update" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton :label="t('common.cancel')" color="neutral" variant="ghost" @click="isForceUpdateModalOpen = false" />
          <UButton label="Update" color="warning" :loading="isForceUpdating" @click="onForceUpdate" />
        </div>
      </template>
    </UModal>
  </UCard>
</template>
