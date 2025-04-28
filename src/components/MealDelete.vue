<template>
  <button
    @click="deleteMeal()"
    class="ml-1">
    <Icon name="Trash" />
  </button>
</template>

<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import { supabase } from '../lib/supabaseClient'

const props = defineProps<{
  mealId: any
}>()

const emits = defineEmits<{
  (e: 'meal-deleted', mealId: string): void
}>()

const deleteMeal = async () => {
  if (!confirm('Are you sure you want to delete this meal?')) return

  const { error } = await supabase.from('meals').delete().eq('id', props.mealId)

  if (error) {
    console.error('Failed to delete meal:', error)
    return
  }

  emits('meal-deleted', props.mealId)
}
</script>
