<script setup lang="ts">
import { z } from 'zod'
import { useCredentialAdminControllerLogin } from '@apis/services/admin-auth/admin-auth'

const authStore = useAuthStore()
const toast = useToast()
const { t } = useI18n()

const schema = computed(() => z.object({
  email: z.string().email(t('login.error.invalid_email')),
  password: z.string().min(4, t('login.error.password_too_short'))
}))

const state = reactive({
  email: 'admin@dpc.com',
  password: 'admin123!'
})

const { mutate: login, isPending } = useCredentialAdminControllerLogin({
  mutation: {
    onSuccess: (response) => {
      authStore.setUser(response)
      toast.add({ 
        title: t('common.success'), 
        description: t('login.success_msg'),
        color: 'green'
      })
      navigateTo('/')
    },
    onError: (error: any) => {
      toast.add({ 
        title: t('common.error'), 
        description: error.response?.data?.message || t('login.error.failed'), 
        color: 'red' 
      })
    }
  }
})

function onSubmit() {
  login({ data: state })
}
</script>

<template>
  <UCard 
    class="backdrop-blur-md bg-white/5 dark:bg-gray-900/40 border-gray-200/20 dark:border-gray-800/50 shadow-2xl overflow-hidden"
    :ui="{ 
      body: 'sm:p-10',
      ring: 'ring-1 ring-white/10 dark:ring-white/5',
      shadow: 'shadow-2xl shadow-indigo-500/10'
    }"
  >
    <UForm :schema="schema" :state="state" class="space-y-8" @submit="onSubmit">
      <!-- Stacked Inputs Group -->
      <div class="relative group">
        <div class="absolute -inset-0.5 bg-linear-to-r from-indigo-500/20 to-primary-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
        
        <div class="relative divide-y divide-gray-200/10 dark:divide-white/5 border border-gray-200/20 dark:border-white/10 rounded-2xl overflow-hidden bg-white/5 dark:bg-black/20">
          <UInput
            v-model="state.email"
            type="email"
            :placeholder="t('login.email')"
            icon="i-lucide-mail"
            size="xl"
            variant="none"
            class="w-full text-lg focus:bg-white/5 dark:focus:bg-white/5 transition-colors"
            autocomplete="email"
          />
          <UInput
            v-model="state.password"
            type="password"
            :placeholder="t('login.password')"
            icon="i-lucide-lock"
            size="xl"
            variant="none"
            class="w-full text-lg focus:bg-white/5 dark:focus:bg-white/5 transition-colors"
            autocomplete="current-password"
          />
        </div>
      </div>

      <UButton
  type="submit"
  block
  size="xl"
  :loading="isPending"
  loading-icon="i-lucide-loader-2" 
  class="h-14 font-extrabold text-white rounded-2xl shadow-xl transition-all duration-300 active:scale-[0.98] cursor-pointer bg-linear-to-r from-emerald-400 via-teal-500 to-blue-600 hover:opacity-90 disabled:opacity-50"
>
  <template #leading v-if="!isPending">
    </template>
  
  <span class="text-lg tracking-wider">
    {{ isPending ? t('login.processing') : t('login.submit') }}
  </span>
</UButton>
    </UForm>
  </UCard>
</template>

<style scoped>
@keyframes shine {
  100% { transform: translateX(100%); }
}
.animate-shine {
  animation: shine 1.5s infinite;
}
</style>
