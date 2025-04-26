<!-- src/components/AddMealForm.vue -->
<template>
  <div>
    <h2>➕ Add Meal</h2>
    <input
      v-model="comment"
      placeholder="Comment (optional)"
    />
    <button
      @click="submit"
    >
      Add Meal
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '../lib/supabaseClient'

const props = defineProps<{
  weekId: string
}>()

const emit = defineEmits<{
  (e: 'meal-added', meal: any): void
}>()

const comment = ref('')

const submit = async () => {
  const { data, error } = await supabase
    .from('meals')
    .insert({
      week_id: props.weekId,
      comment: comment.value || null,
    })
    .select(`
      id,
      comment,
      created_at,
      meal_dishes (
        dishes (
          id,
          title,
          description,
          recipe_url
        )
      )
    `)
    .single()

  if (error) {
    console.error('Failed to add meal:', error)
    return
  }

  const outputData = {
    ...data,
    created_at: new Date(data.created_at).toLocaleDateString(),
    dishes: data.meal_dishes.map(md => md.dishes)
  }

  emit('meal-added', outputData)
  comment.value = ''
}
</script>
