<template>
  <div>
    <label>Add dish</label>
    <select v-model="selectedDishId">
      <option disabled value="">-- Select a dish --</option>
      <option
        v-for="dish in dishes"
        :key="dish.id"
        :value="dish.id"
      >
        {{ dish.title }}
      </option>
    </select>
    <button
      @click="addDish"
      :disabled="!selectedDishId"
    >
      ➕ Add Dish
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '@/lib/supabaseClient'

const props = defineProps<{
  mealId: string
}>()

const emit = defineEmits<{
  (e: 'dish-added'): void
}>()

const dishes = ref<any[]>([])
const selectedDishId = ref('')

onMounted(async () => {
  const { data, error } = await supabase
    .from('dishes')
    .select('id, title')
    .order('title', { ascending: true })

  if (error) {
    console.error('Failed to fetch dishes:', error)
  } else {
    dishes.value = data ?? []
  }
})

const addDish = async () => {
  const { error } = await supabase
    .from('meal_dishes')
    .insert({
      meal_id: props.mealId,
      dish_id: selectedDishId.value,
    })

  if (error) {
    console.error('Failed to add dish to meal:', error)
    return
  }

  emit('dish-added')
  selectedDishId.value = ''
}
</script>
