<!-- src/components/AddMealForm.vue -->
<template>
  <div>
    <h2>Add Meal</h2>
    <input
      v-model="title"
      placeholder="Namn på måltid"
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

const title = ref('')

const submit = async () => {
  const { data, error } = await supabase
    .from('meals')
    .insert({
      week_id: props.weekId,
      title: title.value || null,
    })

  if (error) {
    console.error('Failed to add meal:', error)
    return
  }

  title.value = ''
}
</script>
