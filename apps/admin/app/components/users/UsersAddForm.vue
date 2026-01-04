<script setup lang="ts">
import { z } from 'zod'
import { useRegistrationAdminControllerCreateUser } from '~/api/generated/endpoints/dPCBackendAPI'
import { RegisterAdminRequestDtoRole } from '~/api/generated/models'

const emit = defineEmits(['close', 'success'])
const { t } = useI18n()
const toast = useToast()
const validators = useValidators()

const schema = z.object({
  email: validators.email,
  password: validators.password,
  role: z.nativeEnum(RegisterAdminRequestDtoRole).optional(),
  country: validators.exactLength(2, t('users.country')).optional(),
  timezone: validators.optionalString
})

const state = reactive({
  email: '',
  password: '',
  role: RegisterAdminRequestDtoRole.USER,
  country: undefined as string | undefined,
  timezone: undefined as string | undefined
})

const { mutate, isPending } = useRegistrationAdminControllerCreateUser({
  mutation: {
    onSuccess: () => {
      toast.add({
        title: t('common.success'),
        description: t('users.messages.create_success'),
        color: 'success'
      })
      emit('success')
      resetState()
    },
    onError: (error) => {
      toast.add({
        title: t('common.error'),
        description: error.message || t('users.messages.create_error'),
        color: 'error'
      })
    }
  }
})

function resetState() {
  state.email = ''
  state.password = ''
  state.role = RegisterAdminRequestDtoRole.USER
  state.country = undefined
  state.timezone = undefined
}

async function onSubmit() {
  mutate({
    data: {
      email: state.email,
      password: state.password,
      role: state.role,
      country: state.country,
      timezone: state.timezone
    }
  })
}

const roleOptions = Object.values(RegisterAdminRequestDtoRole).map(role => ({
  label: t(`users.roles.${role.toLowerCase()}`),
  value: role
}))
</script>

<template>
  <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
    <UFormField :label="t('users.email')" name="email" required>
      <UInput v-model="state.email" placeholder="user@example.com" icon="i-lucide-mail" class="w-full" />
    </UFormField>

    <UFormField :label="t('login.password')" name="password" required>
      <UInput v-model="state.password" type="password" placeholder="********" icon="i-lucide-lock" class="w-full" />
    </UFormField>

    <UFormField :label="t('users.role')" name="role">
      <USelect v-model="state.role" :items="roleOptions" class="w-full" />
    </UFormField>

    <div class="grid grid-cols-2 gap-4">
      <UFormField :label="t('users.country')" name="country">
        <UInput v-model="state.country" placeholder="US" maxlength="2" class="w-full" />
      </UFormField>

      <UFormField :label="t('users.timezone')" name="timezone">
          <UInput v-model="state.timezone" placeholder="America/New_York" icon="i-lucide-globe" class="w-full" />
      </UFormField>
    </div>

    <div class="flex justify-end gap-3 pt-4">
        <UButton :label="t('common.cancel')" color="neutral" variant="ghost" @click="emit('close')" />
        <UButton type="submit" :label="t('users.add_user')" color="primary" :loading="isPending" />
    </div>
  </UForm>
</template>
