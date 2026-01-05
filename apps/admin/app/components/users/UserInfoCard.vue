<script setup lang="ts">
import { format } from 'date-fns'
import type { UserDetailResponseDto } from '~/api/generated/models';

defineProps<{
  user: UserDetailResponseDto
  loading?: boolean
}>()
</script>

<template>
  <UCard>
    <template #header>
      <h3 class="font-semibold">User Info</h3>
    </template>
    
    <div v-if="loading" class="space-y-4">
      <USkeleton class="h-4 w-3/4" />
      <USkeleton class="h-4 w-1/2" />
      <USkeleton class="h-4 w-2/3" />
    </div>

    <div v-else class="space-y-4 text-sm">
      <div class="flex justify-between">
        <span class="text-neutral-500">ID</span>
        <span class="font-mono">{{ user.id }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-neutral-500">UID</span>
        <span class="font-mono text-xs">{{ user.uid }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-neutral-500">Role</span>
        <UBadge variant="outline" size="sm">{{ user.role }}</UBadge>
      </div>
      <div class="flex justify-between">
        <span class="text-neutral-500">Country</span>
        <span>{{ user.country || 'N/A' }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-neutral-500">Joined</span>
        <span>{{ format(new Date(user.createdAt), 'yyyy-MM-dd HH:mm') }}</span>
      </div>
    </div>
  </UCard>
</template>
