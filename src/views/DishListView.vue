<template>
  <div>
    <h1><span>Alla recept</span></h1>

    <StateLayout
      v-if="loading"
      iconName="Clock"
      spinIcon>
      Laddar recept
    </StateLayout>

    <div v-else>
      <!-- Empty State -->
      <StateLayout
        v-if="dishes.length === 0"
        iconName="Rat">
        Inga recept hittades.
      </StateLayout>

      <ul>
        <li
          v-for="dish in dishes"
          :key="dish.id"
          class="flex bg-teal-50 text-teal-600 m-2 rounded-xl overflow-hidden">
          <DishItem
            :dishId="dish.id"
            :showDelete="true"
            @remove-dish="removeDish(dish.id)" />
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
          id="description"></textarea>
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
import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '../lib/supabaseClient'

import DishItem from '@/components/DishItem.vue'
import StateLayout from '@/components/StateLayout.vue'

/* -------------------- Reactive State -------------------- */
const dishes = ref<any[]>([])
const loading = ref(true)
const showAddDishForm = ref(false)
const newDish = ref({
  title: '',
  description: '',
  recipe_url: '',
})

let dishesChannel: any = null // Store the real-time channel reference

/* -------------------- Methods -------------------- */

// Fetches the list of dishes from the server
const fetchDishes = async () => {
  loading.value = true

  const { data, error } = await supabase.from('dishes').select('id')

  if (error) {
    console.error('Error fetching dishes:', error)
  } else {
    dishes.value = data
  }

  loading.value = false
}

// Handles file uploads for dish images
const files = ref<File[]>([])
const imagePreviews = ref<string[]>([])

const handleFileUpload = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files) {
    files.value = Array.from(input.files)
    imagePreviews.value = files.value.map((file) => URL.createObjectURL(file))
  }
}

// Adds a new dish to the database
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
  // await dishes.value.push(dish)
  newDish.value = { title: '', description: '', recipe_url: '' }
  files.value = []
  imagePreviews.value = []
  showAddDishForm.value = false
}

// Removes a dish from the local list
const removeDish = async (dishId: string) => {
  dishes.value = dishes.value.filter((dish) => dish.id !== dishId)
}

/* -------------------- Real-Time Subscription -------------------- */

// Subscribes to real-time updates for the dishes table
const subscribeToDishUpdates = () => {
  // Unsubscribe from any existing channel to avoid duplicates
  if (dishesChannel) {
    dishesChannel.unsubscribe()
  }

  dishesChannel = supabase
    .channel('realtime:dishes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'dishes' },
      (payload) => {
        console.log('Realtime event for dishes:', payload)

        if (payload.eventType === 'INSERT') {
          dishes.value.push(payload.new)
        } else if (payload.eventType === 'UPDATE') {
          const index = dishes.value.findIndex(
            (dish) => dish.id === payload.new.id
          )
          if (index !== -1) {
            dishes.value[index] = payload.new
          }
        } else if (payload.eventType === 'DELETE') {
          dishes.value = dishes.value.filter(
            (dish) => dish.id !== payload.old.id
          )
        }
      }
    )
    .subscribe()
}

/* -------------------- Lifecycle Hooks -------------------- */

onMounted(() => {
  fetchDishes()
  subscribeToDishUpdates()
})

onUnmounted(() => {
  // Unsubscribe from the real-time channel when the component is unmounted
  if (dishesChannel) {
    dishesChannel.unsubscribe()
  }
})
</script>
