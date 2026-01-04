<script setup lang="ts">
import { z } from 'zod'
import { useRegistrationAdminControllerCreateUser } from '~/api/generated/endpoints/dPCBackendAPI'
import { RegisterAdminRequestDtoRole } from '~/api/generated/models'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue', 'success'])
const { t } = useI18n()
const toast = useToast()

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.nativeEnum(RegisterAdminRequestDtoRole).optional(),
  country: z.string().length(2, 'Country code must be 2 characters').optional(),
  timezone: z.string().optional()
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
        title: 'Success',
        description: 'User created successfully',
        color: 'success'
      })
      isOpen.value = false
      emit('success')
      resetState()
    },
    onError: (error) => {
      toast.add({
        title: 'Error',
        description: error.message || 'Failed to create user',
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
  <UModal v-model="isOpen">
    <UCard :ui="{  }">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">
            Add User
          </h3>
          <UButton color="neutral" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isOpen = false" />
        </div>
      </template>

      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Email" name="email" required>
          <UInput v-model="state.email" placeholder="user@example.com" icon="i-lucide-mail" class="w-full" />
        </UFormField>

        <UFormField label="Password" name="password" required>
          <UInput v-model="state.password" type="password" placeholder="********" icon="i-lucide-lock" class="w-full" />
        </UFormField>

        <UFormField label="Role" name="role">
          <USelect v-model="state.role" :items="roleOptions" class="w-full" />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Country Code" name="country">
            <UInput v-model="state.country" placeholder="US" maxlength="2" class="w-full" />
          </UFormField>

          <UFormField label="Timezone" name="timezone">
             <UInput v-model="state.timezone" placeholder="America/New_York" icon="i-lucide-globe" class="w-full" />
          </UFormField>
        </div>

        <div class="flex justify-end gap-3 pt-4">
           <UButton label="Cancel" color="neutral" variant="ghost" @click="isOpen = false" />
           <UButton type="submit" label="Create User" color="primary" :loading="isPending" />
        </div>
      </UForm>
    </UCard>
  </UModal>
</template>
