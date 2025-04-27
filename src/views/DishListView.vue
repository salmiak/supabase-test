<template>
  <div>
    <h1><span>Alla recept</span></h1>

    <div v-if="loading">Loading dishes...</div>
    <div v-else>
      <div v-if="dishes.length === 0">No dishes found.</div>
      <ul>
        <li
          v-for="dish in dishes"
          :key="dish.id">
          <h2>{{ dish.title }}</h2>
          <p>{{ dish.description }}</p>
          <a
            v-if="dish.recipe_url"
            :href="dish.recipe_url"
            target="_blank"
            >View Recipe</a
          >
          <button @click="deleteDish(dish.id)">🗑 Delete</button>
        </li>
      </ul>
    </div>
  </div>

  <!-- Add Dish Button -->
  <button @click="showAddDishForm = true">Add New Dish</button>

  <!-- Add Dish Form -->
  <div v-if="showAddDishForm">
    <h2>Add a New Dish</h2>
    <form @submit.prevent="addDish">
      <div>
        <label for="title">Title</label>
        <input
          v-model="newDish.title"
          id="title"
          type="text"
          required />
      </div>
      <div>
        <label for="description">Description</label>
        <textarea
          v-model="newDish.description"
          id="description"
          required></textarea>
      </div>
      <div>
        <label for="recipe_url">Recipe URL</label>
        <input
          v-model="newDish.recipe_url"
          id="recipe_url"
          type="url" />
      </div>
      <button type="submit">Save Dish</button>
      <button
        type="button"
        @click="showAddDishForm = false">
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
  recipe_url: '',
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
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
    .from('dishes')
    .insert({
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

  const { error } = await supabase.from('dishes').delete().eq('id', dishId)

  if (error) {
    console.error('Failed to delete dish:', error)
    return
  }

  // Remove from local list
  dishes.value = dishes.value.filter((dish) => dish.id !== dishId)
}

onMounted(fetchDishes)
</script>

<style scoped>
/* h1 {
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
} */
</style>
