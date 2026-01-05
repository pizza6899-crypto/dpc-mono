<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { useWalletAdminControllerGetTransactionHistory } from '~/api/generated/endpoints/dPCBackendAPI'
import type { WalletTransactionResponseDto } from '~/api/generated/models'
import { format } from 'date-fns'

const { t } = useI18n()

const props = defineProps<{
  userId: string
}>()

const page = ref(1)
const pageLimit = ref(20)

const params = computed(() => ({
  page: page.value,
  limit: pageLimit.value
}))

const { data: response, status } = useWalletAdminControllerGetTransactionHistory(props.userId, params)

const transactions = computed(() => (response.value as any)?.data || [])
const total = computed(() => (response.value as any)?.total || 0)
const loading = computed(() => status.value === 'pending')

const getCurrencyTheme = (currency: string) => {
  const themes: Record<string, { color: any; dot: string; text: string; bg: string }> = {
    KRW: { 
      color: 'success', 
      dot: 'bg-emerald-500', 
      text: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    USDT: { 
      color: 'info', 
      dot: 'bg-sky-500', 
      text: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-900/20'
    },
    BTC: { 
      color: 'warning', 
      dot: 'bg-orange-500', 
      text: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-900/20'
    },
    ETH: { 
      color: 'neutral', 
      dot: 'bg-slate-500', 
      text: 'text-slate-600 dark:text-slate-400',
      bg: 'bg-slate-50 dark:bg-slate-900/20'
    },
    POINT: { 
      color: 'primary', 
      dot: 'bg-primary-500', 
      text: 'text-primary-600 dark:text-primary-400',
      bg: 'bg-primary-50 dark:bg-primary-900/20'
    }
  }
  return themes[currency] || { 
    color: 'neutral', 
    dot: 'bg-neutral-500', 
    text: 'text-neutral-600 dark:text-neutral-400',
    bg: 'bg-neutral-50 dark:bg-neutral-900/20'
  }
}

const getTypeColor = (type: string) => {
  const colors: Record<string, any> = {
    DEPOSIT: 'success',
    WITHDRAWAL: 'error',
    ADJUSTMENT: 'warning',
    TRANSFER: 'info',
    GAME_BET: 'neutral',
    GAME_WIN: 'success',
    PROMOTION: 'primary'
  }
  return colors[type] || 'neutral'
}

const columns = computed<TableColumn<WalletTransactionResponseDto>[]>(() => [
  {
    accessorKey: 'createdAt',
    header: t('users.wallet.date_time'),
  },
  {
    accessorKey: 'type',
    header: t('users.wallet.type'),
  },
  {
    accessorKey: 'currency',
    header: t('users.wallet.asset'),
  },
  {
    accessorKey: 'amount',
    header: t('users.wallet.transaction_amount'),
  },
  {
    accessorKey: 'afterAmount',
    header: t('users.wallet.balance_after'),
  },
  {
    accessorKey: 'details',
    header: t('users.wallet.details'),
  }
])
</script>

<template>
  <UCard :ui="{ body: 'p-0', header: 'p-4 border-b border-gray-200 dark:border-gray-800' }">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
           <UIcon name="i-lucide-history" class="w-5 h-5 text-neutral-500" />
           <h3 class="font-bold text-base tracking-tight text-neutral-900 dark:text-white">
             {{ t('users.wallet.transaction_history') }}
           </h3>
        </div>
        <div class="flex items-center gap-2">
          <UBadge variant="subtle" color="neutral">{{ t('users.wallet.total_items', { total }) }}</UBadge>
        </div>
      </div>
    </template>

    <UTable
      :data="transactions"
      :columns="columns"
      :loading="loading"
      class="flex-1"
      :ui="{
          base: 'min-w-full border-separate border-spacing-0',
          thead: '[&>tr]:bg-neutral-50 dark:[&>tr]:bg-neutral-800/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-3.5 text-neutral-500 dark:text-neutral-400 font-bold text-xs uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800 px-4',
          td: 'py-4 border-b border-neutral-100 dark:border-neutral-800 px-4',
          separator: 'h-0'
      }"
    >
      <!-- Date Cell -->
      <template #createdAt-cell="{ row }">
        <div class="flex flex-col">
          <span class="text-sm font-bold text-neutral-900 dark:text-white tabular-nums">
            {{ format(new Date(row.original.createdAt), 'yyyy-MM-dd') }}
          </span>
          <span class="text-[10px] text-neutral-400 font-medium">
            {{ format(new Date(row.original.createdAt), 'HH:mm:ss') }}
          </span>
        </div>
      </template>

      <!-- Type Cell -->
      <template #type-cell="{ row }">
        <UBadge 
          :color="getTypeColor(row.original.type)" 
          variant="subtle" 
          size="sm"
          class="font-bold px-2 py-0.5"
        >
          {{ row.original.type }}
        </UBadge>
      </template>

      <!-- Asset Cell -->
      <template #currency-cell="{ row }">
        <div class="flex items-center gap-1.5">
          <div 
            class="w-1.5 h-1.5 rounded-full"
            :class="getCurrencyTheme(row.original.currency).dot || 'bg-neutral-400'"
          />
          <span class="font-black text-xs uppercase tracking-tight text-neutral-700 dark:text-neutral-300">
            {{ row.original.currency }}
          </span>
        </div>
      </template>

      <!-- Amount Cell -->
      <template #amount-cell="{ row }">
        <div class="flex flex-col items-end">
          <div class="flex items-baseline gap-1 tabular-nums">
            <span 
              class="text-sm font-black italic"
              :class="Number(row.original.amount) >= 0 ? 'text-emerald-500' : 'text-rose-500'"
            >
              {{ Number(row.original.amount) > 0 ? '+' : '' }}{{ Number(row.original.amount).toLocaleString() }}
            </span>
          </div>
          <div v-if="row.original.balanceDetail" class="flex gap-2 text-[9px] font-bold text-neutral-400 uppercase">
             <span v-if="Number(row.original.balanceDetail.mainBalanceChange) !== 0">
               M: {{ Number(row.original.balanceDetail.mainBalanceChange) > 0 ? '+' : '' }}{{ Number(row.original.balanceDetail.mainBalanceChange).toLocaleString() }}
             </span>
             <span v-if="Number(row.original.balanceDetail.bonusBalanceChange) !== 0">
               B: {{ Number(row.original.balanceDetail.bonusBalanceChange) > 0 ? '+' : '' }}{{ Number(row.original.balanceDetail.bonusBalanceChange).toLocaleString() }}
             </span>
          </div>
        </div>
      </template>

      <!-- After Amount Cell -->
      <template #afterAmount-cell="{ row }">
        <div class="flex flex-col items-end tabular-nums">
          <span class="text-xs font-bold text-neutral-600 dark:text-neutral-400">
            {{ Number(row.original.afterAmount).toLocaleString() }}
          </span>
        </div>
      </template>

      <!-- Details Cell -->
      <template #details-cell="{ row }">
        <div class="max-w-[200px]">
          <div v-if="row.original.adminDetail" class="flex flex-col gap-0.5">
             <div class="flex items-center gap-1">
               <UIcon name="i-lucide-user-cog" class="w-3 h-3 text-amber-500" />
               <span class="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase">{{ row.original.adminDetail.reasonCode }}</span>
             </div>
             <p v-if="row.original.adminDetail.internalNote" class="text-[10px] text-neutral-500 line-clamp-1 italic">
               "{{ row.original.adminDetail.internalNote }}"
             </p>
          </div>
          <div v-else-if="row.original.systemDetail" class="flex flex-col gap-0.5">
             <div class="flex items-center gap-1">
               <UIcon name="i-lucide-cpu" class="w-3 h-3 text-sky-500" />
               <span class="text-[10px] font-black text-sky-600 dark:text-sky-400 uppercase">{{ row.original.systemDetail.serviceName }}</span>
             </div>
             <p class="text-[10px] text-neutral-400 truncate">
               {{ row.original.systemDetail.actionName }}
             </p>
          </div>
          <div v-else class="text-[10px] text-neutral-400 italic">
            {{ t('common.no_additional_data') || 'No additional data' }}
          </div>
        </div>
      </template>

      <!-- Empty State -->
      <template #empty-state>
        <div class="flex flex-col items-center justify-center py-16 gap-4 text-neutral-400">
          <div class="w-16 h-16 rounded-full bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-center">
            <UIcon name="i-lucide-receipt" class="w-8 h-8 opacity-20" />
          </div>
          <div class="text-center">
            <p class="text-base font-bold text-neutral-900 dark:text-white">{{ t('users.wallet.no_transactions') }}</p>
            <p class="text-xs">{{ t('users.wallet.no_transactions_desc') }}</p>
          </div>
        </div>
      </template>
    </UTable>

    <div class="flex items-center justify-between p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
      <div class="text-[11px] font-medium text-neutral-500">
        {{ t('users.wallet.showing_items', { count: transactions.length, total }) }}
      </div>
      <UPagination
        v-model="page"
        :page-count="pageLimit"
        :total="total"
        :ui="{ 
          root: 'font-bold'
        }"
      />
    </div>
  </UCard>
</template>
