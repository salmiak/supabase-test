<template>
  <WeekHeader></WeekHeader>

  <!-- Add Meal Form -->
  <AddMealForm
    :week-id="weekData.id"
    @meal-added="fetchWeekData" />

  <!-- Loading State -->
  <WeekStateLoading v-if="loading" />

  <!-- Main Content -->
  <template v-else>
    <!-- Empty State -->
    <WeekStateEmpty v-if="meals.length === 0" />

    <!-- Meal List -->
    <MealItem
      v-for="meal in meals"
      :key="meal.id"
      :mealId="meal.id"
      @remove-meal="removeMeal(meal.id)"></MealItem>
  </template>
</template>

<script setup lang="ts">
/* -------------------- Imports -------------------- */
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { supabase } from '../lib/supabaseClient'
import { useRoute } from 'vue-router'

import AddMealForm from '@/components/AddMealForm.vue'
import MealItem from '@/components/MealItem.vue'
import WeekHeader from '@/components/WeekHeader.vue'
import WeekStateLoading from '@/components/WeekStateLoading.vue'
import WeekStateEmpty from '@/components/WeekStateEmpty.vue'

/* -------------------- Reactive State -------------------- */
const route = useRoute()
const weekNbr = ref(route.params.week_nbr as string)
const weekYear = ref(route.params.week_year as string)
const weekData = ref<any>({})
const meals = ref<any[]>([])
const loading = ref(true)
let mealsChannel: any = null // Store the real-time channel reference

/* -------------------- Methods -------------------- */

// Fetches the week data and associated meals
const fetchWeekData = async () => {
  loading.value = true

  // Fetch week data
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
    console.error('Error fetching week:', weekError)
    loading.value = false
    return
  }

  weekData.value = week

  // Fetch meals for the week
  const { data: mealData, error: mealError } = await supabase
    .from('meals')
    .select('id')
    .eq('week_id', week.id)
    .order('created_at', { ascending: false })

  if (mealError) {
    console.error('Error fetching meals:', mealError)
  } else {
    meals.value = mealData
  }

  loading.value = false

  // Subscribe to real-time updates for meals
  subscribeToMealUpdates(week.id)
}

// Creates a new week in the database
const createNewWeek = async (newWeekYear: number, newWeekNumber: number) => {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('family_id')
    .eq('id', user?.id)
    .single()

  if (profileError || !profile) {
    console.error('Could not get family_id:', profileError)
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

// Removes a meal from the local list
const removeMeal = (mealId: string) => {
  meals.value = meals.value.filter((meal) => meal.id !== mealId)
}

/* -------------------- Real-Time Subscriptions -------------------- */

// Subscribes to real-time updates for the meals table
const subscribeToMealUpdates = (weekId: string) => {
  // Unsubscribe from any existing channel to avoid duplicates
  if (mealsChannel) {
    mealsChannel.unsubscribe()
  }

  mealsChannel = supabase
    .channel('realtime:meals')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'meals',
      },
      (payload) => {
        console.log('Realtime event in WeekView:', payload)

        if (payload.eventType === 'INSERT' && payload.new.week_id === weekId) {
          meals.value.unshift(payload.new)
        } else if (payload.eventType === 'UPDATE') {
          const index = meals.value.findIndex(
            (meal) => meal.id === payload.new.id
          )
          if (index !== -1) {
            meals.value[index] = payload.new
          } else if (payload.new.week_id === weekId) {
            meals.value.push(payload.new) // Add meal if moved to this week
          }
        } else if (payload.eventType === 'DELETE') {
          meals.value = meals.value.filter((meal) => meal.id !== payload.old.id)
        }
      }
    )
    .subscribe()
}

/* -------------------- Lifecycle Hooks -------------------- */

// Called when the component is mounted
onMounted(fetchWeekData)

// Called when the component is unmounted
onUnmounted(() => {
  if (mealsChannel) {
    mealsChannel.unsubscribe()
  }
})

// Watch for changes in the route parameters
watch(
  () => route.params.week_nbr,
  (newNbr) => {
    weekYear.value = route.params.week_year as string
    weekNbr.value = newNbr as string
    fetchWeekData()
  }
)
</script>
