<template>
  <div class="grid gap-2">
    <!-- Search Field -->
    <input
      v-model="searchQuery"
      @input="searchDishes"
      type="text"
      placeholder="Sök efter en rätt..."
      class="bg-white border border-pink-300 rounded-lg p-2" />

    <!-- Search Results -->
    <div
      v-if="dishes.length"
      class="bg-white rounded-lg">
      <ul>
        <li
          v-for="dish in dishes"
          :key="dish.id"
          class="flex justify-between items-center p-2 border-pink-200 border-b last:border-b-0">
          <span>{{ dish.title }}</span>
          <button @click="addDish(dish.id)">Lägg till</button>
        </li>
      </ul>
    </div>
    <div
      v-else-if="!dishes.length && searchQuery"
      class="text-pink-400 italic text-sm text-center py-3">
      Inga rätter hittades.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { supabase } from '@/lib/supabaseClient'

const props = defineProps<{
  mealId: string
}>()

const emit = defineEmits<{
  (e: 'dish-added'): void
}>()

const dishes = ref<any[]>([])
const searchQuery = ref('')

// Function to search for dishes on the server
const searchDishes = async () => {
  if (!searchQuery.value.trim()) {
    dishes.value = []
    return
  }

  const { data, error } = await supabase
    .from('dishes')
    .select('id, title')
    .ilike('title', `%${searchQuery.value}%`) // Case-insensitive search

  if (error) {
    console.error('Failed to search dishes:', error)
    dishes.value = []
  } else {
    dishes.value = data ?? []
  }
}

// Function to add a dish to the meal
const addDish = async (dishId: string) => {
  const { error } = await supabase.from('meal_dishes').insert({
    meal_id: props.mealId,
    dish_id: dishId,
  })

  if (error) {
    console.error('Failed to add dish to meal:', error)
    return
  }

  emit('dish-added')
  searchQuery.value = '' // Clear the search field
  dishes.value = [] // Clear the search results
}
</script>
