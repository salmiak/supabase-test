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
      
      <AddMealForm :week-id="weekId" @meal-added="onMealAdded" />

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
const weekId = ref(route.params.id as string)
const meals = ref<any[]>([])
const loading = ref(true)
const weekStartDate = ref('')

const fetchWeekData = async () => {
  loading.value = true

  const { data: week, error: weekError } = await supabase
    .from('weeks')
    .select('start_date')
    .eq('id', weekId.value)
    .single()

  if (weekError) {
    console.error(weekError)
    loading.value = false
    return
  }

  weekStartDate.value = new Date(week.start_date).toLocaleDateString()

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
    .eq('week_id', weekId.value)
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

watch(() => route.params.id, (newId) => {
  weekId.value = newId as string
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
