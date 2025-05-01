<!-- src/components/AddMealForm.vue -->
<template>
  <div class="bg-teal-50 m-2 rounded-xl shadow-sm overflow-hidden">
    <button
      @click="addMeal"
      class="block w-full bg-teal-100 border-b border-b-teal-200 text-teal-600 m-0 text-base/4 font-semibold font-stretch-expanded tracking-widest py-3 px-2">
      Lägg till måltid
    </button>
  </div>
</template>

<script setup lang="ts">
import { supabase } from '../lib/supabaseClient'
import Icon from '@/components/Icon.vue'

const props = defineProps<{
  weekId: string
}>()

const emit = defineEmits<{
  (e: 'meal-added', meal: any): void
}>()

const addMeal = async () => {
  const { data, error } = await supabase.from('meals').insert({
    week_id: props.weekId,
  })

  if (error) {
    console.error('Failed to add meal:', error)
    return
  }
}
</script>
