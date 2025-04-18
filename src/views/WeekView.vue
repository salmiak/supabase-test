<template>
  <div class="p-4">
    <h1 class="text-xl font-bold mb-4">Meal Plan for {{ weekStartDate }}</h1>

    <div v-if="loading">Loading meals...</div>
    <div v-else>
      <div v-if="meals.length === 0">No meals planned for this week.</div>

      <div v-for="meal in meals" :key="meal.id" class="mb-4 border rounded p-3 shadow">
        <p v-if="meal.comment" class="text-gray-700 italic">📝 {{ meal.comment }}</p>

        <div v-if="meal.dishes.length">
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
            </li>
          </ul>
        </div>
      </div>
      
      <AddMealForm :week-id="weekId" @meal-added="onMealAdded" />

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { supabase } from '../lib/supabaseClient'
import { useRoute } from 'vue-router'
import AddMealForm from '@/components/AddMealForm.vue'

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

</script>
