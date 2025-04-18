<template>
  <div class="p-4">
    <h1 class="text-xl font-bold mb-4">All Dishes</h1>

    <div v-if="loading">Loading dishes...</div>
    <div v-else>
      <div v-if="dishes.length === 0">No dishes found.</div>
      <ul>
        <li v-for="dish in dishes" :key="dish.id" class="mb-2">
          <h2 class="font-semibold">{{ dish.title }}</h2>
          <p>{{ dish.description }}</p>
          <a :href="dish.recipe_url" target="_blank" class="text-blue-500 underline">View Recipe</a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabaseClient'

const dishes = ref<any[]>([])
const loading = ref(true)

const fetchDishes = async () => {
  loading.value = true

  const { data, error } = await supabase
    .from('dishes')
    .select('id, title, description, recipe_url')

  if (error) {
    console.error('Error fetching dishes:', error)
  } else {
    dishes.value = data
  }

  loading.value = false
}

onMounted(fetchDishes)
</script>