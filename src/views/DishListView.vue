<template>
  <div class="p-4">
    <h1 class="text-xl font-bold mb-4">Alla recept</h1>

    <div v-if="loading">Loading dishes...</div>
    <div v-else>
      <div v-if="dishes.length === 0">No dishes found.</div>
      <ul>
        <li v-for="dish in dishes" :key="dish.id" class="mb-2">
          <h2 class="font-semibold">{{ dish.title }}</h2>
          <p>{{ dish.description }}</p>
          <a v-if="dish.recipe_url" :href="dish.recipe_url" target="_blank" class="text-blue-500 underline">View Recipe</a>
          <button
            @click="deleteDish(dish.id)"
            class="text-red-500 hover:text-red-700 text-sm ml-2"
          >
            🗑 Delete
          </button>
        </li>
      </ul>
    </div>
  </div>

  <!-- Add Dish Button -->
  <button
    @click="showAddDishForm = true"
    class="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
  >
    Add New Dish
  </button>

  <!-- Add Dish Form -->
  <div v-if="showAddDishForm" class="mb-4 p-4 border rounded bg-gray-50">
    <h2 class="text-lg font-semibold mb-2">Add a New Dish</h2>
    <form @submit.prevent="addDish">
      <div class="mb-2">
        <label for="title" class="block font-medium">Title</label>
        <input
          v-model="newDish.title"
          id="title"
          type="text"
          class="w-full p-2 border rounded"
          required
        />
      </div>
      <div class="mb-2">
        <label for="description" class="block font-medium">Description</label>
        <textarea
          v-model="newDish.description"
          id="description"
          class="w-full p-2 border rounded"
          required
        ></textarea>
      </div>
      <div class="mb-2">
        <label for="recipe_url" class="block font-medium">Recipe URL</label>
        <input
          v-model="newDish.recipe_url"
          id="recipe_url"
          type="url"
          class="w-full p-2 border rounded"
        />
      </div>
      <button
        type="submit"
        class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Save Dish
      </button>
      <button
        type="button"
        @click="showAddDishForm = false"
        class="ml-2 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
      >
        Cancel
      </button>
    </form>
  </div>
</template>



<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabaseClient'

const dishes = ref<any[]>([])
const loading = ref(true)
const showAddDishForm = ref(false)
const newDish = ref({
  title: '',
  description: '',
  recipe_url: ''
})

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

const addDish = async () => {

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

  const {data, error } = await supabase
    .from('dishes')
    .insert( {
      ...newDish.value,
      family_id: profile.family_id,
    })
    .select('id, title, description, recipe_url')
    .single()

  if (error) {
    console.error('Error adding dish:', error)
    return
  }

  // Refresh the dish list and reset the form
  await dishes.value.push(data)
  newDish.value = { title: '', description: '', recipe_url: '' }
  showAddDishForm.value = false
}

const deleteDish = async (dishId: string) => {
  if (!confirm('Are you sure you want to delete this dish?')) return

  const { error } = await supabase
    .from('dishes')
    .delete()
    .eq('id', dishId)

  if (error) {
    console.error('Failed to delete dish:', error)
    return
  }

  // Remove from local list
  dishes.value = dishes.value.filter(dish => dish.id !== dishId)
}

onMounted(fetchDishes)
</script>

<style scoped>
h1 {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  font-size: 1rem;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.05rem;
  margin: 0;
  background: var(--background-5);
  color: var(--background-1);
  padding: 0.5rem 1rem;
}
</style>