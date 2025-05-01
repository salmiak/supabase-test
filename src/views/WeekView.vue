<template>
  <WeekHeader></WeekHeader>

  <AddMealForm :week-id="weekData.id" />

  <div
    v-if="loading"
    class="m-3 text-center text-lg font-semibold font-stretch-ultra-expanded text-teal-500">
    Laddar vecka...
  </div>
  <div
    v-else
    class="meal-list">
    <div
      v-if="meals.length === 0"
      class="flex flex-col items-center mx-3 my-8 text-teal-500">
      <Icon
        name="Rat"
        :size="36" />
      <div
        class="m-3 text-center text-lg font-semibold font-stretch-ultra-expanded">
        Än så länge inga måltider<br />planerade för denna vecka.
      </div>
    </div>

    <MealItem
      v-for="meal in meals"
      :key="meal.id"
      :mealId="meal.id"
      @remove-meal="removeMeal(meal.id)"></MealItem>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { supabase } from '../lib/supabaseClient'
import { useRoute } from 'vue-router'
import Icon from '@/components/Icon.vue'
import AddMealForm from '@/components/AddMealForm.vue'
import MealItem from '@/components/MealItem.vue'
import WeekHeader from '@/components/WeekHeader.vue'

const route = useRoute()
const weekNbr = ref(route.params.week_nbr as string)
const weekYear = ref(route.params.week_year as string)
const weekData = ref<any>({})
const meals = ref<any[]>([])
const loading = ref(true)
let mealsChannel: any = null // Store the real-time channel reference

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
    .select('id')
    .eq('week_id', week.id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error(error)
  } else {
    meals.value = data
  }

  loading.value = false

  // Subscribe to real-time updates after fetching initial data
  subscribeToMealUpdates(week.id)
}

const subscribeToMealUpdates = (weekId: string) => {
  // Unsubscribe from any existing channel to avoid duplicates
  if (mealsChannel) {
    mealsChannel.unsubscribe()
  }

  // Subscribe to real-time updates for the meals table
  mealsChannel = supabase
    .channel('realtime:meals')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'meals' /*, filter: `week_id=eq.${weekId}`*/,
      },
      (payload) => {
        console.log('Realtime event in WeekView:', payload)

        if (payload.eventType === 'INSERT' && payload.new.week_id === weekId) {
          meals.value.push(payload.new)
        } else if (payload.eventType === 'UPDATE') {
          const index = meals.value.findIndex(
            (meal) => meal.id === payload.new.id
          )
          if (index !== -1) {
            meals.value[index] = payload.new
          } else {
            if (payload.new.week_id === weekId) {
              // If the meal is not found in the current list, add it
              // This can happen if the meal was added in another week and then moved to this week
              meals.value.push(payload.new)
            }
          }
        } else if (payload.eventType === 'DELETE') {
          meals.value = meals.value.filter((meal) => meal.id !== payload.old.id)
        }
      }
    )
    .subscribe()
}

onMounted(fetchWeekData)

onUnmounted(() => {
  // Unsubscribe from the real-time channel when the component is unmounted
  if (mealsChannel) {
    mealsChannel.unsubscribe()
  }
})

watch(
  () => route.params.week_nbr,
  (newNbr) => {
    weekYear.value = route.params.week_year as string
    weekNbr.value = newNbr as string
    fetchWeekData()
  }
)

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

const removeMeal = async (mealId: string) => {
  meals.value = meals.value.filter((meal) => meal.id !== mealId)
}
</script>
