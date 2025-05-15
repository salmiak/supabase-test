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
          <div v-if="dish.images?.length">
            <img
              v-for="img in dish.images"
              :src="img.image_url"
              class="w-32 h-32 object-cover mr-2" />
          </div>
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
      <input
        type="file"
        @change="handleFileUpload"
        multiple />
      <div v-if="imagePreviews.length">
        <h4 class="mt-4 mb-2">Preview:</h4>
        <div class="flex gap-4">
          <img
            v-for="url in imagePreviews"
            :key="url"
            :src="url"
            class="w-24 h-24 object-cover border rounded" />
        </div>
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
import imageCompression from 'browser-image-compression'

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
    .select('id, title, description, recipe_url, images:dish_images(image_url)')

  if (error) {
    console.error('Error fetching dishes:', error)
  } else {
    dishes.value = data
  }

  loading.value = false
}

const files = ref<File[]>([])
const imagePreviews = ref<string[]>([])

const handleFileUpload = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files) {
    files.value = Array.from(input.files)
    imagePreviews.value = files.value.map((file) => URL.createObjectURL(file))
  }
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

  const { data: dish, error: insertError } = await supabase
    .from('dishes')
    .insert({
      ...newDish.value,
      family_id: profile.family_id,
    })
    .select('id, title, description, recipe_url, images:dish_images(image_url)')
    .single()

  if (insertError) {
    console.error('Error adding dish:', insertError)
    return
  }

  for (const file of files.value) {
    const compressedFile = await imageCompression(file, {
      maxWidthOrHeight: 1500,
      maxSizeMB: 1,
    })

    const path = `${profile.family_id}/${dish.id}/${file.name}`
    const { error } = await supabase.storage
      .from('dish-images')
      .upload(path, compressedFile)

    if (error) console.error('Upload failed:', error)

    const publicUrl = supabase.storage.from('dish-images').getPublicUrl(path)
      .data.publicUrl

    // Optional: store public URL in dish_images table
    await supabase
      .from('dish_images')
      .insert({ dish_id: dish.id, image_url: publicUrl })

    // Update the dish object with the new image URL
    dish.images = dish.images || []
    dish.images.push({ image_url: publicUrl })
  }

  // Refresh the dish list and reset the form
  await dishes.value.push(dish)
  newDish.value = { title: '', description: '', recipe_url: '' }
  files.value = []
  imagePreviews.value = []
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
