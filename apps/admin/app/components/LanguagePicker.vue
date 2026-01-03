<script setup lang="ts">
const { $i18n } = useNuxtApp()
const { locale } = useI18n() // 반응성을 위해 locale은 여기서 가져옴

interface Props {
  showLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showLabel: false
})

const languages = [
  { label: '한국어', value: 'ko', icon: 'i-circle-flags-kr' },
  { label: 'English', value: 'en', icon: 'i-circle-flags-us' }
]

const currentLanguage = computed(() => 
  languages.find(l => l.value === locale.value)
)

const currentLanguageLabel = computed(() => 
  currentLanguage.value?.label || 'Language'
)

// Nuxt UI v4 데이터 구조에 맞게 수정
const items = computed(() => [
  languages.map(lang => ({
    label: lang.label,
    icon: lang.icon,
    checked: locale.value === lang.value,
    onSelect: async () => {
      // 2. $i18n 안에 setLocale이 있는지 확인 후 호출
      // 타입 에러 무시를 위해 any를 잠시 사용하거나, 
      // if ('setLocale' in $i18n) 체크를 합니다.
      const i18n = $i18n as any
      
      if (i18n.setLocale) {
        console.log('setLocale 실행:', lang.value)
        await i18n.setLocale(lang.value)
      } else {
        // 만약 정말 없다면 (legacy 모드 등) 직접 할당
        locale.value = lang.value
      }
    }
  }))
])
</script>

<template>
  <UDropdownMenu 
    :items="items" 
    :content="{ align: 'end' }"
  >
    <UButton
      color="neutral"
      variant="ghost"
      :icon="currentLanguage?.icon || 'i-lucide-languages'"
      class="cursor-pointer select-none"
    >
      <span v-if="props.showLabel" class="ml-2">{{ currentLanguageLabel }}</span>
    </UButton>

    <template #item-label="{ item }">
      <div class="flex items-center gap-2">
        <span>{{ item.label }}</span>
      </div>
    </template>
  </UDropdownMenu>
</template>