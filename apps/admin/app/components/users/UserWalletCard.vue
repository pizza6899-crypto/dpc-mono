<script setup lang="ts">
import { format } from 'date-fns'
import {
  useWalletAdminControllerGetUserBalance,
  useWalletAdminControllerUpdateUserBalance
} from '~/api/generated/endpoints/dPCBackendAPI'

const props = defineProps<{
  userId: string
}>()

const { t } = useI18n()
const toast = useToast()
const lastRefreshedAt = ref(new Date())

// Data Fetching
const { data: balanceResponse, isPending: isBalanceLoading, refetch: refetchBalance } = useWalletAdminControllerGetUserBalance(props.userId)

const wallets = computed(() => balanceResponse.value?.data?.wallets || [])

// Refresh Handler
const handleRefresh = async () => {
  await refetchBalance()
  lastRefreshedAt.value = new Date()
}

// Adjustment Modal
const isAdjustModalOpen = ref(false)
const adjustState = reactive({
  currency: 'USDT' as any,
  balanceType: 'main' as any,
  operation: 'add' as any,
  amount: '',
  reasonCode: 'CS_RECOVERY' as any,
  internalNote: ''
})

const { mutate: updateBalance, isPending: isUpdating } = useWalletAdminControllerUpdateUserBalance({
  mutation: {
    onSuccess: () => {
      toast.add({ title: t('common.success'), icon: 'i-lucide-check-circle' })
      isAdjustModalOpen.value = false
      handleRefresh()
      adjustState.amount = ''
      adjustState.internalNote = ''
    },
    onError: (err: any) => {
      toast.add({
        title: t('common.error'),
        description: err.response?.data?.message || 'Failed to update balance',
        color: 'error'
      })
    }
  }
})

function openAdjustModal(currency: string) {
  adjustState.currency = currency
  isAdjustModalOpen.value = true
}

function onAdjust() {
  updateBalance({
    userId: props.userId,
    data: {
      currency: adjustState.currency,
      balanceType: adjustState.balanceType,
      operation: adjustState.operation,
      amount: adjustState.amount,
      reasonCode: adjustState.reasonCode,
      internalNote: adjustState.internalNote
    }
  })
}

const balanceTypeOptions = [
  { label: 'Main Balance', value: 'main' },
  { label: 'Bonus Balance', value: 'bonus' },
  { label: 'Total (Auto)', value: 'total' }
]

const operationOptions = [
  { label: 'Add (+)', value: 'add' },
  { label: 'Subtract (-)', value: 'subtract' }
]

const reasonOptions = [
  { label: 'CS Recovery', value: 'CS_RECOVERY' },
  { label: 'Promotion Reward', value: 'PROMOTION_REWARD' },
  { label: 'System Error Fix', value: 'SYSTEM_ERROR_FIX' },
  { label: 'Manual Deposit', value: 'MANUAL_DEPOSIT' },
  { label: 'Test Account', value: 'TEST_ACCOUNT' },
  { label: 'Other', value: 'OTHER' }
]

const getCurrencyTheme = (currency: string) => {
  const themes: Record<string, { color: any; dot: string; ping: string; text: string; bg: string; border: string; icon: string }> = {
    KRW: { 
      color: 'success', 
      dot: 'bg-emerald-500', 
      ping: 'bg-emerald-400',
      text: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      border: 'border-emerald-100 dark:border-emerald-900/30',
      icon: 'bg-emerald-500'
    },
    USDT: { 
      color: 'info', 
      dot: 'bg-sky-500', 
      ping: 'bg-sky-400',
      text: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-900/20',
      border: 'border-sky-100 dark:border-sky-900/30',
      icon: 'bg-sky-500'
    },
    BTC: { 
      color: 'warning', 
      dot: 'bg-orange-500', 
      ping: 'bg-orange-400',
      text: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-100 dark:border-orange-900/30',
      icon: 'bg-orange-500'
    },
    ETH: { 
      color: 'neutral', 
      dot: 'bg-slate-500', 
      ping: 'bg-slate-400',
      text: 'text-slate-600 dark:text-slate-400',
      bg: 'bg-slate-50 dark:bg-slate-900/20',
      border: 'border-slate-100 dark:border-slate-900/30',
      icon: 'bg-slate-500'
    },
    POINT: { 
      color: 'primary', 
      dot: 'bg-primary-500', 
      ping: 'bg-primary-400',
      text: 'text-primary-600 dark:text-primary-400',
      bg: 'bg-primary-50 dark:bg-primary-900/20',
      border: 'border-primary-100 dark:border-primary-900/30',
      icon: 'bg-primary-500'
    }
  }
  return themes[currency] || { 
    color: 'neutral', 
    dot: 'bg-neutral-500', 
    ping: 'bg-neutral-400',
    text: 'text-neutral-600 dark:text-neutral-400',
    bg: 'bg-neutral-50 dark:bg-neutral-900/20',
    border: 'border-neutral-100 dark:border-neutral-900/30',
    icon: 'bg-neutral-500'
  }
}
</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0', header: 'py-3 px-4' }">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h3 class="font-bold text-sm tracking-tight">User Wallets</h3>
          <span class="text-[10px] text-neutral-400 font-medium">
            Updated {{ format(lastRefreshedAt, 'HH:mm:ss') }}
          </span>
        </div>
        <UButton
          icon="i-lucide-refresh-cw"
          size="md"
          variant="ghost"
          color="neutral"
          :loading="isBalanceLoading"
          :ui="{ base: 'rounded-full' }"
          class="text-neutral-500 hover:text-primary-500 transition-colors"
          @click="() => { handleRefresh() }"
        />
      </div>
    </template>

    <div v-if="isBalanceLoading" class="p-8 flex justify-center">
      <UIcon name="i-lucide-loader-2" class="animate-spin w-6 h-6 text-primary-500" />
    </div>

    <div v-else-if="wallets.length > 0" class="divide-y divide-neutral-100 dark:divide-neutral-800">
      <div
        v-for="wallet in wallets"
        :key="wallet.currency"
        class="p-4 bg-white dark:bg-transparent transition-colors"
      >
        <div class="flex flex-col gap-4">
          <!-- Header Area -->
          <div class="flex items-center justify-between">
            <div class="relative">
              <UBadge 
                :color="getCurrencyTheme(wallet.currency).color" 
                variant="subtle" 
                class="font-black px-2 py-0.5 text-[11px] uppercase z-10 relative"
              >
                {{ wallet.currency }}
              </UBadge>
              <span class="absolute -top-1 -right-1 flex h-2 w-2 z-0">
                <span 
                  class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  :class="getCurrencyTheme(wallet.currency).ping"
                ></span>
                <span 
                  class="relative inline-flex rounded-full h-2 w-2 border border-white dark:border-neutral-900"
                  :class="getCurrencyTheme(wallet.currency).dot"
                ></span>
              </span>
            </div>

            <div class="flex items-center gap-2">
              <UButton
                icon="i-lucide-pencil-line"
                label="Adjust"
                size="xs"
                color="neutral"
                variant="subtle"
                class="rounded-full px-3 font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                @click="openAdjustModal(wallet.currency)"
              />
            </div>
          </div>

          <!-- Balance Main Display -->
          <div class="flex flex-col items-end">
            <div class="flex items-baseline gap-2 tabular-nums">
              <span 
                class="text-xs font-bold uppercase leading-none"
                :class="getCurrencyTheme(wallet.currency).text"
              >
                {{ wallet.currency === 'KRW' ? '₩' : '$' }}
              </span>
              <span class="text-3xl font-black text-neutral-900 dark:text-white tracking-tighter leading-none select-all font-mono">
                {{ Number(wallet.totalBalance).toLocaleString(undefined, { minimumFractionDigits: 2 }) }}
              </span>
            </div>
          </div>

          <!-- Detailed Breakdown Box -->
          <div class="grid grid-cols-2 gap-2 p-2 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-100 dark:border-neutral-800">
            <div class="flex flex-col items-center py-1.5 tabular-nums">
              <span class="text-[9px] font-bold uppercase text-neutral-500 tracking-wider mb-0.5">Main Account</span>
              <span class="text-xs font-black text-neutral-700 dark:text-neutral-200 font-mono">
                 {{ Number(wallet.mainBalance).toLocaleString(undefined, { minimumFractionDigits: 2 }) }}
              </span>
            </div>
            <div class="flex flex-col items-center py-1.5 tabular-nums border-l border-neutral-100 dark:border-neutral-700">
              <span class="text-[9px] font-bold uppercase text-amber-600/80 dark:text-amber-500/80 tracking-wider mb-0.5">Bonus Fund</span>
              <span class="text-xs font-black text-amber-600 dark:text-amber-500 font-mono">
                 {{ Number(wallet.bonusBalance).toLocaleString(undefined, { minimumFractionDigits: 2 }) }}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>

    <div v-else class="p-12 text-center text-neutral-400 text-sm font-medium">
      No wallet data available.
    </div>

    <!-- Adjust Balance Modal (UI Improvement) -->
    <UModal v-model:open="isAdjustModalOpen" title="Asset Adjustment" :ui="{ content: 'max-w-md' }">
      <template #body>
        <div class="space-y-4 p-1">
          <div 
            class="flex items-center gap-4 p-3 rounded-lg border transition-colors"
            :class="[getCurrencyTheme(adjustState.currency).bg, getCurrencyTheme(adjustState.currency).border]"
          >
            <div 
              class="w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors"
              :class="getCurrencyTheme(adjustState.currency).icon"
            >
              <UIcon name="i-lucide-wallet" class="w-5 h-5" />
            </div>
            <div class="flex flex-col">
              <span 
                class="text-xs font-bold uppercase"
                :class="getCurrencyTheme(adjustState.currency).text"
              >
                Selected Asset
              </span>
              <span class="text-lg font-black dark:text-white">{{ adjustState.currency }}</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Balance Target">
              <USelect
                v-model="adjustState.balanceType"
                :items="balanceTypeOptions"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Operation">
              <USelect
                v-model="adjustState.operation"
                :items="operationOptions"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField label="Amount">
            <UInput
              v-model="adjustState.amount"
              placeholder="0.00"
              size="lg"
              class="w-full font-mono font-bold"
              :ui="{ base: 'text-xl h-12' }"
            />
          </UFormField>

          <UFormField label="Reason Category">
            <USelect
                v-model="adjustState.reasonCode"
                :items="reasonOptions"
                class="w-full"
              />
          </UFormField>

          <UFormField label="Audit Internal Note">
            <UTextarea
              v-model="adjustState.internalNote"
              placeholder="Provide a detailed reason for this adjustment for compliance audit trails..."
              :rows="4"
              class="text-xs"
            />
          </UFormField>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-3 px-1 pb-1">
          <UButton :label="t('common.cancel')" color="neutral" variant="ghost" @click="isAdjustModalOpen = false" />
          <UButton
            label="Execute Transaction"
            :icon="adjustState.operation === 'add' ? 'i-lucide-arrow-up-circle' : 'i-lucide-arrow-down-circle'"
            :color="adjustState.operation === 'add' ? 'success' : 'error'"
            :loading="isUpdating"
            class="px-6 font-bold"
            @click="onAdjust"
          />
        </div>
      </template>
    </UModal>
  </UCard>
</template>
