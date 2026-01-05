<script setup lang="ts">
import { z } from 'zod'
import { useCredentialAdminControllerLogin } from '~/api/generated/endpoints/dPCBackendAPI'

definePageMeta({
  layout: false
})

const toast = useToast()
const { t } = useI18n()
const validators = useValidators()

const state = reactive({
  email: 'admin@dpc.com',
  password: 'admin123!'
})

const schema = z.object({
  email: validators.email(t('login.email')),
  password: validators.password(t('login.password'))
})

const form = ref()

const authStore = useAuthStore()

const { mutate: loginMutate, isPending: loading } = useCredentialAdminControllerLogin({
  mutation: {
    onSuccess: (response: any) => {
      if (response.data?.user) {
        authStore.setUser(response.data.user)
      }
      toast.add({
        title: t('login.success'),
        description: t('login.loginSuccess'),
        color: 'success'
      })
      navigateTo('/')
    },
    onError: (error: any) => {
      toast.add({
        title: t('login.error'),
        description: error?.response?.data?.message || t('login.invalidCredentials'),
        color: 'error'
      })
    }
  }
})

async function onSubmit() {
  try {
    await form.value.submit()
  } catch (e) {
    // Validation failed
    console.error('Validation failed', e)
  }
}

function handleLogin() {
  loginMutate({
    data: {
      email: state.email,
      password: state.password
    }
  })
}
</script>

<template>
  <div class="relative flex items-center justify-center min-h-screen overflow-hidden bg-default">
    <!-- Decorative background elements -->
    <div class="absolute inset-0 z-0">
      <div class="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary-500/10 blur-[120px]" />
      <div class="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-primary-500/10 blur-[120px]" />
    </div>

    <div class="z-10 w-full max-w-md px-6 py-12">
      <div class="mb-10 text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-primary-500/10 ring-1 ring-primary-500/20">
          <UIcon name="i-lucide-shield-check" class="w-8 h-8 text-primary-500" />
        </div>
        <h1 class="text-3xl font-extrabold tracking-tight text-highlighted">
          {{ $t('login.title') }}
        </h1>
        <p class="mt-2 text-muted">
          {{ $t('login.description') }}
        </p>
      </div>

      <UCard 
        class="backdrop-blur-xl bg-default/80 border border-accented shadow-2xl"
        :ui="{ 
          body: 'p-6 sm:p-8',
          header: 'border-b border-accented p-6 sm:p-8',
          footer: 'border-t border-accented p-6 sm:p-8 bg-muted/50'
        }"
      >
        <UForm 
          ref="form"
          :state="state" 
          :schema="schema"
          class="space-y-6"
          @submit="handleLogin"
        >
          <UFormField :label="$t('login.email')" name="email" required>
            <UInput
              v-model="state.email"
              type="email"
              placeholder="admin@example.com"
              icon="i-lucide-mail"
              size="xl"
              autocomplete="email"
              class="w-full"
            />
          </UFormField>

          <UFormField :label="$t('login.password')" name="password" required>
            <UInput
              v-model="state.password"
              type="password"
              placeholder="••••••••"
              icon="i-lucide-lock"
              size="xl"
              autocomplete="current-password"
              class="w-full"
            />
          </UFormField>
          <UButton
            type="button"
            size="xl"
            block
            :loading="loading"
            class="font-bold shadow-lg shadow-primary-500/20 cursor-pointer"
            @click="onSubmit"
          >
            {{ $t('login.signIn') }}
          </UButton>
        </UForm>

        <template #footer>
          <div class="text-center">
            <p class="text-sm text-muted">
              {{ $t('login.noAccount') }}
              <ULink to="#" class="font-semibold text-primary-500 hover:text-primary-600 transition-colors">
                {{ $t('login.contactAdmin') }}
              </ULink>
            </p>
          </div>
        </template>
      </UCard>

      <div class="mt-8 text-center">
        <p class="text-xs text-muted flex items-center justify-center gap-1">
          <UIcon name="i-lucide-lock" class="w-3 h-3" />
          {{ $t('login.secureConnection') }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Any additional custom styling for the login page */
</style>
