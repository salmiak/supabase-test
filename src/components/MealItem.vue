<template>
  <div
    v-if="editMode"
    class="bg-pink-50 m-2 rounded-xl shadow-sm overflow-hidden">
    <div class="flex justify-between bg-pink-100 border-b border-b-pink-200">
      <input
        v-model="meal.title"
        type="text"
        class="py-1 px-2 m-1 rounded-lg w-full bg-white border border-pink-300"
        placeholder="Måltidens namn" />

      <div class="flex m-1">
        <MealDelete
          :meal-id="meal.id"
          @meal-deleted="mealRemoved"
          class="ml-1" />
        <button
          @click="saveMeal()"
          class="ml-1">
          <Icon name="Save" />
        </button>
      </div>
    </div>

    <div class="m-1">
      <textarea
        v-model="meal.comment"
        class="block w-full h-24 p-2 border border-pink-300 rounded-lg bg-white"
        placeholder="Kommentarer om måltiden"></textarea>
    </div>

    <div v-if="meal.dishes && meal.dishes.length">
      <ul class="border-t border-pink-200">
        <li
          v-for="dish in meal.dishes"
          :key="dish.id"
          class="grid grid-cols-[1fr_34px] items-center px-1 py-2 border-b border-pink-200">
          <div class="px-2">
            <h3 class="font-semibold text-teal-700">
              <a
                class="text-pink-500 underline"
                v-if="dish.recipe_url"
                :href="dish.recipe_url"
                target="_blank"
                >{{ dish.title }}</a
              >
              <span v-else> {{ dish.title }}</span>
            </h3>
            <p class="text-sm text-gray-600">
              {{ dish.description }}
            </p>
          </div>
          <button
            @click="deleteDish(dish.id)"
            aria-label="Ta bort rätt">
            <Icon name="Trash" />
          </button>
        </li>
      </ul>
    </div>
    <!-- Dish selector -->
    <DishSelector
      :meal-id="mealId"
      @dish-added="fetchMeal"
      class="px-1 py-1" />
  </div>

  <div
    v-else-if="meal.is_eaten"
    class="flex bg-teal-200 text-teal-600 m-2 rounded-xl overflow-hidden">
    <MealEatenToggle :meal="meal" />
    <h2
      class="text-base/4 font-semibold font-stretch-expanded tracking-widest py-3 px-2">
      {{ meal.title }}
    </h2>
  </div>

  <div
    v-else
    class="bg-teal-50 m-2 rounded-xl shadow-sm overflow-hidden">
    <div
      class="flex justify-between items-start bg-teal-100 border-b border-b-teal-200">
      <div class="flex text-teal-600 m-0 rounded-xl overflow-hidden">
        <MealEatenToggle :meal="meal" />
        <h2
          class="text-base/4 font-semibold font-stretch-expanded tracking-widest py-3 px-2">
          {{ meal.title }}
        </h2>
      </div>

      <div class="flex">
        <MealMoveWeek
          :meal="meal"
          dir="prev"
          @meal-moved="mealRemoved" />
        <button
          @click="toggleEditMode()"
          :aria-label="`Redigera måltid: ${meal.title}`"
          class="m-1">
          <Icon name="Edit" />
        </button>
        <MealMoveWeek
          :meal="meal"
          dir="next"
          @meal-moved="mealRemoved" />
      </div>
    </div>

    <p
      v-if="meal.comment"
      class="text-sm text-gray-600 px-3 py-3 border-b border-teal-200">
      {{ meal.comment }}
    </p>

    <div v-if="meal.dishes && meal.dishes.length">
      <ul>
        <li
          v-for="dish in meal.dishes"
          :key="dish.id"
          class="grid grid-cols-[1fr_2.5rem] items-center px-1 py-2 border-b border-teal-200">
          <div class="px-2">
            <h3 class="font-semibold text-teal-700">
              <a
                class="text-pink-500 underline"
                v-if="dish.recipe_url"
                :href="dish.recipe_url"
                target="_blank"
                >{{ dish.title }}</a
              >
              <span v-else> {{ dish.title }}</span>
            </h3>
            <p class="text-sm text-gray-600">
              {{ dish.description }}
            </p>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import { ref, onMounted, onUnmounted } from 'vue'
import DishSelector from '@/components/DishSelector.vue'
import MealEatenToggle from '@/components/MealEatenToggle.vue'
import MealMoveWeek from '@/components/MealMoveWeek.vue'
import MealDelete from '@/components/MealDelete.vue'
import { supabase } from '../lib/supabaseClient'

const editMode = ref(false)

const meal = ref({
  id: '',
  title: '',
  comment: '',
  is_eaten: false,
  dishes: [],
  week: {
    id: '',
    week_nbr: '',
    week_year: '',
  },
})

const toggleEditMode = () => {
  editMode.value = !editMode.value
}

const saveMeal = async () => {
  const { error } = await supabase
    .from('meals')
    .update({
      title: meal.value.title,
      comment: meal.value.comment,
    })
    .eq('id', props.mealId)

  if (error) {
    console.error('Error saving meal:', error)
  } else {
    editMode.value = false
  }
}

const props = defineProps<{
  mealId: any
}>()

const emits = defineEmits<{
  (e: 'remove-meal', mealId: string): void
}>()

let mealChannel: any = null // Store the real-time channel reference
let mealDishesChannel: any = null // Store the real-time channel for meal_dishes

const fetchMeal = async () => {
  const { data, error } = await supabase
    .from('meals')
    .select(
      `
      id,
      title,
      comment,
      is_eaten,
      created_at,
      week_id (
        id,
        week_nbr,
        week_year
      ),
      meal_dishes (
        dishes (
          id,
          title,
          description,
          recipe_url
        )
      )
    `
    )
    .eq('id', props.mealId)
    .single()

  if (error) {
    console.error('Error fetching meal:', error)
    return
  }

  // Update the meal object with the fetched data
  meal.value.id = data.id
  meal.value.title = data.title
  meal.value.comment = data.comment
  meal.value.is_eaten = data.is_eaten
  meal.value.dishes = data.meal_dishes.map((md) => md.dishes)
  meal.value.week = Array.isArray(data.week_id) ? data.week_id[0] : data.week_id
}

const subscribeToMealUpdates = () => {
  // Unsubscribe from any existing channel to avoid duplicates
  if (mealChannel) {
    mealChannel.unsubscribe()
  }

  // Subscribe to real-time updates for the specific meal
  mealChannel = supabase
    .channel(`realtime:meal:${props.mealId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'meals',
        filter: `id=eq.${props.mealId}`,
      },
      (payload) => {
        console.log('Realtime event for meal:', payload)

        if (payload.eventType === 'UPDATE') {
          if (payload.new.week_id !== meal.value.week.id) {
            // If the meal is moved to a different week, notify the parent component
            emits('remove-meal', props.mealId)
          } else {
            // Update the meal data when it is updated on the server
            fetchMeal()
          }
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
    .channel(`realtime:meal_dishes:${props.mealId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'meal_dishes',
        filter: `meal_id=eq.${props.mealId}`,
      },
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
    .eq('meal_id', props.mealId)
    .eq('dish_id', dishId)

  if (error) {
    console.error('Error deleting dish:', error)
    return
  }

  // Refresh the meal data after deleting the dish
  await fetchMeal()
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

const mealRemoved = () => {
  console.log('Meal moved to another week')
  emits('remove-meal', props.mealId) // Notify parent to remove the meal from the current week
}
</script>
