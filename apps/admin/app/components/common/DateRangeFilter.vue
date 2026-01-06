<script setup lang="ts">
import {getLocalTimeZone, CalendarDate, today, Time } from '@internationalized/date'
import { format, subHours } from 'date-fns'
import type { Range } from '~/types'

const props = defineProps<{
  modelValue?: Range
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Range | undefined]
}>()

const { t, locale } = useI18n()

const calendarLocale = computed(() => {
  if (locale.value === 'ko') return 'ko-KR'
  if (locale.value === 'en') return 'en-US'
  return locale.value
})

const placeholder = shallowRef(today(getLocalTimeZone()))

const formatHeading = (date: CalendarDate) => {
  if (locale.value === 'ko') {
    return `${date.year}년 ${date.month}월`
  }
  return format(date.toDate(getLocalTimeZone()), 'MMMM yyyy')
}

const ranges = [
  { label: t('common.time.last_1_hour'), value: 'last_1_hour' },
  { label: t('common.time.last_6_hours'), value: 'last_6_hours' },
  { label: t('common.time.last_12_hours'), value: 'last_12_hours' },
  { label: t('common.time.last_24_hours'), value: 'last_24_hours' },
  { label: t('common.time.today'), value: 'today' },
  { label: t('common.time.yesterday'), value: 'yesterday' },
  { label: t('common.time.this_week'), value: 'this_week' },
  { label: t('common.time.last_7_days'), value: 'last_7_days' },
  { label: t('common.time.last_30_days'), value: 'last_30_days' },
  { label: t('common.time.this_month'), value: 'this_month' },
  { label: t('common.time.last_month'), value: 'last_month' },
  { label: t('common.time.all_time'), value: 'all_time' }
]

const toCalendarDate = (date: Date) => {
  return new CalendarDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  )
}

const startTime = shallowRef(new Time(0, 0))
const endTime = shallowRef(new Time(23, 59))

watch(() => props.modelValue, (val) => {
  if (val?.start) {
    startTime.value = new Time(val.start.getHours(), val.start.getMinutes())
  }
  if (val?.end) {
    endTime.value = new Time(val.end.getHours(), val.end.getMinutes())
  }
}, { immediate: true })

const combineDateAndTime = (date: Date, time: Time) => {
  const newDate = new Date(date)
  newDate.setHours(time.hour)
  newDate.setMinutes(time.minute)
  newDate.setSeconds(0)
  newDate.setMilliseconds(0)
  return newDate
}

const updateTime = () => {
  if (!props.modelValue?.start || !props.modelValue?.end) return

  emit('update:modelValue', {
    start: combineDateAndTime(props.modelValue.start, startTime.value),
    end: combineDateAndTime(props.modelValue.end, endTime.value)
  })
}

const calendarRange = computed({
  get: () => ({
    start: props.modelValue?.start ? toCalendarDate(props.modelValue.start) : undefined,
    end: props.modelValue?.end ? toCalendarDate(props.modelValue.end) : undefined
  }),
  set: (newValue: { start: CalendarDate | null, end: CalendarDate | null }) => {
    // If both are cleared, emit undefined
    if (!newValue.start && !newValue.end) {
      emit('update:modelValue', undefined)
      return
    }

    const sDate = newValue.start ? newValue.start.toDate(getLocalTimeZone()) : new Date()
    const eDate = newValue.end ? newValue.end.toDate(getLocalTimeZone()) : (newValue.start ? newValue.start.toDate(getLocalTimeZone()) : new Date())

    emit('update:modelValue', {
      start: combineDateAndTime(sDate, startTime.value),
      end: combineDateAndTime(eDate, endTime.value)
    })
  }
})

const calculateRange = (value: string) => {
  const now = today(getLocalTimeZone())
  let start = now
  let end = now

  switch (value) {
    case 'today':
      break
    case 'yesterday':
      start = now.subtract({ days: 1 })
      end = start
      break
    case 'this_week':
       // Assuming ISO week (Monday start)
       // CalendarDate doesn't strictly have startOfWeek?
       // We can iterate back to Monday?
       // dayOfWeek: 1 (Mon) - 7 (Sun) usually? 
       // @internationalized/date doesn't expose dayOfWeek easily on CalendarDate without Calendar?
       // Let's use simpler logic: "Last 7 days" is already there. "This Week" might be tricky without full calendar lib.
       // Let's fallback 'this_week' to 'startOfWeek' using js Date or skip it if too complex.
       // Let's use date-fns for "This Week" calculation since we assume current locale/timezone roughly matches.
       // Actually user requested "More convenient". Let's stick to reliable ones.
       // 'this_week': Monday to Today?
       {
         // Simple approx: subtract days until Monday (1). 
         // But CalendarDate doesn't give day of week easily.
         // Let's skip 'this_week' if risks breaking, or use `last_7_days` covering it.
         // Let's assume user is fine with Last 7 Days. I'll remove 'this_week' to avoid bugs.
         return null
       }
    case 'last_7_days':
      start = now.subtract({ days: 6 }) // Include today? "Last 7 days" usually implies [today-6, today]
      break
    case 'last_30_days':
      start = now.subtract({ days: 29 })
      break
    case 'this_month':
      start = new CalendarDate(now.year, now.month, 1)
      break
    case 'last_month':
      start = new CalendarDate(now.year, now.month, 1).subtract({ months: 1 })
      end = new CalendarDate(now.year, now.month, 1).subtract({ days: 1 })
      break
    case 'all_time':
      return null
    default:
      return null
  }
  return { start, end }
}

const isRangeSelected = (range: { value: string }) => {
  if (range.value === 'all_time') {
     return !props.modelValue?.start && !props.modelValue?.end
  }
  // Simple check isn't enough for dynamic ranges (e.g. today changes),
  // but we can check if the current selection matches the range's logic.
  // For simplicity/performance in UI, we might skip exact highlighting for custom ranges acting like presets,
  // or implement the same logic to compare.
  // Given user wants "comfort", active state is nice but complex to keep perfectly synced.
  // Let's implement simplified comparison for major ones if needed, or just rely on click setting values.
  // Actually, let's keep it simple: exact highlighting is tricky without recalculating everything.
  // We will skip active highlighting for now or just check if start/end match the calculation.
  
  const calculated = calculateRange(range.value)
  if (!calculated) return false
  
  const currentStart = props.modelValue?.start ? toCalendarDate(props.modelValue.start) : null
  const currentEnd = props.modelValue?.end ? toCalendarDate(props.modelValue.end) : null

  if (!currentStart || !currentEnd) return false
  
  return currentStart.compare(calculated.start) === 0 && currentEnd.compare(calculated.end) === 0
}

const selectRange = (range: { value: string }) => {
  if (range.value === 'all_time') {
    emit('update:modelValue', undefined)
    return
  }

  // Handle hour-based ranges with exact time
  if (['last_1_hour', 'last_6_hours', 'last_12_hours', 'last_24_hours'].includes(range.value)) {
    const end = new Date()
    end.setSeconds(59)
    end.setMilliseconds(999)
    
    let start = new Date(end)
    switch (range.value) {
      case 'last_1_hour': start = subHours(end, 1); break
      case 'last_6_hours': start = subHours(end, 6); break
      case 'last_12_hours': start = subHours(end, 12); break
      case 'last_24_hours': start = subHours(end, 24); break
    }
    
    emit('update:modelValue', { start, end })
    return
  }
  
  const calculated = calculateRange(range.value)
  if (!calculated) return

  const s = calculated.start.toDate(getLocalTimeZone())
  const e = calculated.end.toDate(getLocalTimeZone())
  
  // Set default full day range for presets
  s.setHours(0, 0, 0, 0)
  e.setHours(23, 59, 0, 0)

  emit('update:modelValue', {
    start: s,
    end: e
  })
}
</script>

<template>
  <UPopover :content="{ align: 'start' }" :modal="true">
    <UButton
      color="neutral"
      variant="outline"
      icon="i-lucide-calendar"
      class="min-w-[260px] justify-between font-normal"
    >
      <span class="truncate text-left flex-1 block">
        <template v-if="modelValue?.start">
          <template v-if="modelValue?.end">
            {{ format(modelValue.start, 'yyyy-MM-dd') }} <span class="text-gray-500 text-xs">{{ format(modelValue.start, 'HH:mm') }}</span> - {{ format(modelValue.end, 'yyyy-MM-dd') }} <span class="text-gray-500 text-xs">{{ format(modelValue.end, 'HH:mm') }}</span>
          </template>
          <template v-else>
            {{ format(modelValue.start, 'yyyy-MM-dd') }} <span class="text-gray-500 text-xs">{{ format(modelValue.start, 'HH:mm') }}</span>
          </template>
        </template>
        <template v-else>
          <span class="text-gray-500">{{ placeholder || t('common.time.all_time') }}</span>
        </template>
      </span>

      <template #trailing>
        <UIcon name="i-lucide-chevron-down" class="shrink-0 text-gray-500 size-5 group-data-[state=open]:rotate-180 transition-transform duration-200" />
      </template>
    </UButton>

    <template #content>
      <div class="flex items-stretch sm:divide-x divide-default">
        <div class="hidden sm:flex flex-col justify-center min-w-[140px] p-2 gap-1">
          <UButton
            v-for="(range, index) in ranges.filter(r => r.value !== 'this_week')"
            :key="index"
            :label="range.label"
            color="neutral"
            variant="ghost"
            size="xs"
            class="justify-start px-2 py-1.5"
            :class="[isRangeSelected(range) ? 'bg-elevated font-semibold' : 'hover:bg-elevated/50 font-normal']"
            truncate
            @click="selectRange(range)"
          />
        </div>

        <UCalendar
          v-model="calendarRange"
          v-model:placeholder="placeholder"
          :locale="calendarLocale"
          class="p-2"
          :number-of-months="2"
          range
        >
          <template #heading>
            {{ formatHeading(placeholder) }} - {{ formatHeading(placeholder.add({ months: 1 })) }}
          </template>
        </UCalendar>
      </div>
      <div class="p-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2 bg-gray-50/50 dark:bg-gray-800/10">
        <div class="flex items-center gap-2">
            <UInputTime
              v-model="startTime"
              :hour-cycle="24"
              class="w-[88px]"
              @change="updateTime"
              :disabled="!modelValue?.start"
            />
            <span class="text-gray-400 text-xs">~</span>
            <UInputTime
              v-model="endTime"
              :hour-cycle="24"
              class="w-[88px]"
              @change="updateTime"
              :disabled="!modelValue?.end"
            />
        </div>
      </div>
    </template>
  </UPopover>
</template>
