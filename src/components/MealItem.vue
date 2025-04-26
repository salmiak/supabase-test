<template>
  <p v-if="meal.comment" class="text-gray-700 italic">📝 {{ meal.comment }}</p>

  <div v-if="meal.dishes && meal.dishes.length">
    <h2 class="font-semibold mt-2">Dishes:</h2>
    <ul class="list-disc pl-5">
      <li v-for="dish in meal.dishes" :key="dish.id">
        <h3 v-if="dish.recipe_url">
          <a :href="dish.recipe_url" target="_blank" class="text-blue-600 underline">{{ dish.title }}</a>
        </h3> 
        <h3 v-else>{{ dish.title }}</h3>
        <span>
          {{ dish.description }}
        </span>
        <!-- Delete Dish Button -->
        <button
          @click="deleteDish(dish.id)"
          class="text-red-500 hover:text-red-700 text-sm ml-4"
        >
          🗑 Remove
        </button>
      </li>
    </ul>
  </div>
    <!-- Dish selector -->
    <DishSelector
      :meal-id="meal.id"
      @dish-added="fetchMeal"
      class="mt-2"
    />

  <button
          @click="deleteMeal()"
          class="text-red-500 hover:text-red-700 text-sm"
        >
          🗑 Delete
        </button>
</template>

<script setup lang="ts">
import DishSelector from '@/components/DishSelector.vue'
import { supabase } from '../lib/supabaseClient'

const props = defineProps<{
  meal: any
}>()

const emits = defineEmits<{
  (e: 'delete-meal', mealId: string): void
}>()

const fetchMeal = async () => {
  const { data, error } = await supabase
    .from('meals')
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
    .eq('id', props.meal.id)
    .single()

  if (error) {
    console.error('Error fetching meal:', error)
    return
  }

  // Update the meal object with the fetched data
  props.meal.comment = data.comment
  props.meal.dishes = data.meal_dishes.map(md => md.dishes)
}

const deleteDish = async (dishId: string) => {
  const { error } = await supabase
    .from('meal_dishes')
    .delete()
    .eq('meal_id', props.meal.id)
    .eq('dish_id', dishId)

  if (error) {
    console.error('Error deleting dish:', error)
    return
  }

  // Refresh the meal data after deleting the dish
  await fetchMeal()
}

const deleteMeal = () => {
  emits('delete-meal', props.meal.id)
}
</script>