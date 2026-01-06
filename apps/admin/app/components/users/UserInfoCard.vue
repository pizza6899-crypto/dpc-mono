<script setup lang="ts">
import { format } from 'date-fns'
import type { UserDetailResponseDto } from '~/api/generated/models';

const props = defineProps<{
  user: UserDetailResponseDto
  loading?: boolean
}>()

const { t } = useI18n()
const toast = useToast()

const items = computed(() => [
  [
    {
      label: t('users.reset_password'),
      icon: 'i-lucide-key-round',
      click: () => {
        toast.add({ title: 'Reset Password', description: 'Not implemented yet', color: 'neutral' })
      }
    }
  ],
  [
    {
      label: props.user.status === 'ACTIVE' ? t('users.suspend') : t('users.activate'),
      icon: props.user.status === 'ACTIVE' ? 'i-lucide-ban' : 'i-lucide-check-circle',
      click: () => {
         toast.add({ title: 'Toggle Status', description: 'Not implemented yet', color: 'neutral' })
      }
    }
  ]
])
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="font-semibold">{{ t('users.info') }}</h3>
        <UDropdownMenu :items="items" :content="{ align: 'end' }">
          <UButton color="neutral" variant="ghost" icon="i-lucide-ellipsis-vertical" />
        </UDropdownMenu>
      </div>
    </template>
    
    <div v-if="loading" class="space-y-4">
      <USkeleton class="h-4 w-3/4" />
      <USkeleton class="h-4 w-1/2" />
      <USkeleton class="h-4 w-2/3" />
    </div>

    <div v-else class="space-y-4 text-sm">
      <div class="flex justify-between items-center">
        <span class="text-neutral-500">ID</span>
        <span class="font-mono text-xs">{{ user.id }}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-neutral-500">{{ t('users.uid') }}</span>
        <span class="font-mono text-xs">{{ user.uid }}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-neutral-500">{{ t('users.email') }}</span>
        <span class="font-sans break-all">{{ user.email }}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-neutral-500">{{ t('users.role') }}</span>
        <UBadge variant="outline" size="xs">{{ user.role }}</UBadge>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-neutral-500">{{ t('users.status') }}</span>
        <UBadge :color="user.status === 'ACTIVE' ? 'success' : 'neutral'" variant="subtle" size="xs">{{ user.status }}</UBadge>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-neutral-500">{{ t('users.country') }}</span>
        <span>{{ user.country || 'N/A' }}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-neutral-500">{{ t('users.timezone') }}</span>
        <span>{{ user.timezone || 'N/A' }}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-neutral-500">{{ t('users.joined') }}</span>
        <span>{{ format(new Date(user.createdAt), 'yyyy-MM-dd HH:mm') }}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-neutral-500">{{ t('users.updated_at') }}</span>
        <span>{{ format(new Date(user.updatedAt), 'yyyy-MM-dd HH:mm') }}</span>
      </div>
    </div>
  </UCard>
</template>
