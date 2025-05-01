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
  meal: any
}>()

const emits = defineEmits<{
  (e: 'meal-deleted', mealId: string): void
}>()

const deleteMeal = async () => {
  if (
    (props.meal.title ||
      props.meal.comment ||
      props.meal.dishes.length !== 0) &&
    !confirm('Are you sure you want to delete this meal?')
  )
    return

  const { error } = await supabase
    .from('meals')
    .delete()
    .eq('id', props.meal.id)

  if (error) {
    console.error('Failed to delete meal:', error)
    return
  }

  emits('meal-deleted', props.meal.id)
}
</script>
