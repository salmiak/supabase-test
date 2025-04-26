<template>
  <WeekHeader></WeekHeader>

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
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { supabase } from '../lib/supabaseClient'
import { useRoute } from 'vue-router'
import AddMealForm from '@/components/AddMealForm.vue'
import MealItem from '@/components/MealItem.vue'
import WeekHeader from '@/components/WeekHeader.vue'

const route = useRoute()
const weekNbr = ref(route.params.week_nbr as string)
const weekYear = ref(route.params.week_year as string)
const weekData = ref<any>({})
const meals = ref<any[]>([])
const loading = ref(true)

const fetchWeekData = async () => {
  loading.value = true

  const { data: week, error: weekError } = await supabase
    .from('weeks')
    .select('id, week_year, week_nbr')
    .eq('week_nbr', weekNbr.value)
    .eq('week_year', weekYear.value)
    .maybeSingle()

  if (!week) {
    console.log('No week found, creating a new one')
    const newWeekYear = parseInt(weekYear.value)
    const newWeekNumber = parseInt(weekNbr.value)
    return createNewWeek(newWeekYear, newWeekNumber)
  }

  if (weekError) {
    console.error(weekError)
    loading.value = false
    return
  }

  weekData.value = week

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

watch(() => route.params.week_nbr, (newNbr) => {
  weekYear.value = route.params.week_year as string
  weekNbr.value = newNbr as string
  fetchWeekData()
})

const createNewWeek = async (newWeekYear: number, newWeekNumber: number) => {

  // get current user
  const { data: { user } } = await supabase.auth.getUser()

  // fetch their family_id
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('family_id')
    .eq('id', user?.id)
    .single()

  if (profileError || !profile) {
    console.error('Could not get family_id', profileError)
    return
  }

  const { data, error } = await supabase
    .from('weeks')
    .insert({ 
      week_nbr: newWeekNumber,
      week_year: newWeekYear,
      family_id: profile.family_id, 
     })
    .select()
    .single()

  if (error || !data) {
    console.error('Failed to create new week:', error)
    return
  }

  fetchWeekData()
}

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
