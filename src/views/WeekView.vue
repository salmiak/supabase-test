<template>
  <div class="p-4">
    <h1 class="text-xl font-bold mb-4">Meal Plan for {{ weekStartDate }}</h1>

    <div v-if="loading">Loading meals...</div>
    <div v-else>
      <div v-if="meals.length === 0">No meals planned for this week.</div>

      <MealItem
        v-for="meal in meals"
        :key="meal.id"
        :meal="meal"
        @delete-meal="deleteMeal(meal.id)"></MealItem>
      
      <AddMealForm :week-id="weekData.id" @meal-added="onMealAdded" />

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { supabase } from '../lib/supabaseClient'
import { useRoute } from 'vue-router'
import AddMealForm from '@/components/AddMealForm.vue'
import MealItem from '@/components/MealItem.vue'

const route = useRoute()
const weekNbr = ref(route.params.nbr as string)
const weekYear = ref(route.params.year as string)
const weekData = ref<any>({})
const meals = ref<any[]>([])
const loading = ref(true)
const weekStartDate = ref('')

const fetchWeekData = async () => {
  loading.value = true

  const { data: week, error: weekError } = await supabase
    .from('weeks')
    .select('id, year, week_nbr, start_date')
    .eq('week_nbr', weekNbr.value)
    .eq('year', weekYear.value)
    .single()

  if (weekError) {
    console.error(weekError)
    loading.value = false
    return
  }

  weekData.value = week
  weekStartDate.value = new Date(week.start_date).toLocaleDateString()

  const { data, error } = await supabase
    .from('meals')
    .select(`
      id,
      comment,
      created_at,
      meal_dishes (
        dish_id,
        dishes (
          id,
          title,
          description,
          recipe_url
        )
      )
    `)
    .eq('week_id', week.id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error(error)
  } else {
    // Flatten dish list
    meals.value = data.map(meal => ({
      ...meal,
      dishes: meal.meal_dishes.map(md => md.dishes)
    }))
  }

  loading.value = false
}

onMounted(fetchWeekData)

watch(() => route.params.nbr, (newNbr) => {
  weekYear.value = route.params.year as string
  weekNbr.value = newNbr as string
  fetchWeekData()
})

const onMealAdded = (meal: any) => {
  meals.value.push(meal)
}

const deleteMeal = async (mealId: string) => {
  if (!confirm('Are you sure you want to delete this meal?')) return

  const { error } = await supabase
    .from('meals')
    .delete()
    .eq('id', mealId)

  if (error) {
    console.error('Failed to delete meal:', error)
    return
  }

  // Remove from local list
  meals.value = meals.value.filter(meal => meal.id !== mealId)
}


</script>
