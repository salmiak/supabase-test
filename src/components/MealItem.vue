<template>
  <div class="bg-teal-50 m-2 rounded-xl shadow-sm overflow-hidden">
    <div class="flex justify-between bg-teal-100 border-b border-b-teal-200">
      <h2 v-if="meal.comment"
        class="text-base/5 font-semibold text-teal-600 py-2 px-3 
        font-stretch-expanded
        tracking-widest"
      >
        {{ meal.comment }}
      </h2>
      <h2 v-else
        class="text-md font-semibold text-teal-600 py-2 px-3 
        font-stretch-expanded
        tracking-widest"
      >
        Måltid
      </h2>
      <button @click="deleteMeal()" class="m-1">
        radera
      </button>
    </div>

  <div v-if="meal.dishes && meal.dishes.length">
    <ul>
      <li v-for="dish in meal.dishes" :key="dish.id" class="grid grid-cols-[1fr_2.5rem] items-center px-1 py-2 border-b border-teal-200">
        <div class="px-2">
          <h3 class="font-semibold text-teal-700">
            <a class="text-pink-500 underline" v-if="dish.recipe_url" :href="dish.recipe_url" target="_blank">{{ dish.title }}</a>
            <span v-else> {{ dish.title }}</span>
          </h3>
          <p class="text-sm text-gray-600">
            {{ dish.description }}
          </p>
        </div>
        <button @click="deleteDish(dish.id)">X</button>
      </li>
    </ul>
  </div>
    <!-- Dish selector -->
    <DishSelector
      :meal-id="meal.id"
      @dish-added="fetchMeal"
      class="px-1 py-1"
    />

      </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import DishSelector from '@/components/DishSelector.vue'
import { supabase } from '../lib/supabaseClient'

const props = defineProps<{
  meal: any
}>()

const emits = defineEmits<{
  (e: 'delete-meal', mealId: string): void
}>()

let mealChannel: any = null // Store the real-time channel reference
let mealDishesChannel: any = null // Store the real-time channel for meal_dishes

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

const subscribeToMealUpdates = () => {
  // Unsubscribe from any existing channel to avoid duplicates
  if (mealChannel) {
    mealChannel.unsubscribe()
  }

  // Subscribe to real-time updates for the specific meal
  mealChannel = supabase
    .channel(`realtime:meal:${props.meal.id}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'meals', filter: `id=eq.${props.meal.id}` },
      (payload) => {
        console.log('Realtime event for meal:', payload)

        if (payload.eventType === 'UPDATE') {
          // Update the meal data when it is updated on the server
          fetchMeal()
        }
      }
    )
    .subscribe()
}

const subscribeToMealDishesUpdates = () => {
  // Unsubscribe from any existing channel to avoid duplicates
  if (mealDishesChannel) {
    mealDishesChannel.unsubscribe()
  }

  // Subscribe to real-time updates for the meal_dishes table
  mealDishesChannel = supabase
    .channel(`realtime:meal_dishes:${props.meal.id}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'meal_dishes', filter: `meal_id=eq.${props.meal.id}` },
      (payload) => {
        console.log('Realtime event for meal_dishes:', payload)

        if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
          // Refresh the meal data when a dish is added or removed
          fetchMeal()
        }
      }
    )
    .subscribe()
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

onMounted(() => {
  fetchMeal()
  subscribeToMealUpdates()
  subscribeToMealDishesUpdates()
})

onUnmounted(() => {
  // Unsubscribe from the real-time channels when the component is unmounted
  if (mealChannel) {
    mealChannel.unsubscribe()
  }
  if (mealDishesChannel) {
    mealDishesChannel.unsubscribe()
  }
})
</script>