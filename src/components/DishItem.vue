<template>
  <div v-if="loading">Laddar recept</div>
  <div
    v-else
    class="grid grid-cols-[1fr_2.5rem] items-center px-1 py-2 border-b border-teal-200">
    <div class="px-2">
      <template v-if="editMode">
        <!-- Edit Mode -->
        <input
          v-model="dish.title"
          type="text"
          class="w-full mb-2 p-1 border border-gray-300 rounded"
          placeholder="Dish Title" />
        <textarea
          v-model="dish.description"
          class="w-full mb-2 p-1 border border-gray-300 rounded"
          placeholder="Dish Description"></textarea>
        <input
          v-model="dish.recipe_url"
          type="text"
          class="w-full mb-2 p-1 border border-gray-300 rounded"
          placeholder="Recipe URL" />

        <!-- Image Management -->
        <div class="mb-2">
          <h4 class="font-semibold">Images</h4>
          <div
            v-if="dish.images?.length"
            class="flex mt-2 mb-2">
            <div
              v-for="img in dish.images"
              :key="img.image_url"
              class="relative w-28 h-28 mr-2">
              <img
                :src="img.image_url"
                class="w-full h-full rounded object-cover" />
              <button
                @click="removeImage(img.image_url)"
                class="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded">
                ✖
              </button>
            </div>
          </div>
          <input
            type="file"
            multiple
            @change="handleFileUpload"
            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          <div
            v-if="imagePreviews.length"
            class="flex mt-2">
            <img
              v-for="preview in imagePreviews"
              :key="preview"
              :src="preview"
              class="w-28 h-28 rounded object-cover mr-2" />
          </div>
        </div>

        <button
          @click="saveDish"
          class="text-sm text-white bg-green-500 px-2 py-1 rounded hover:bg-green-600">
          Save
        </button>
        <button
          @click="toggleEditMode"
          class="text-sm text-white bg-gray-500 px-2 py-1 rounded hover:bg-gray-600 ml-2">
          Cancel
        </button>
      </template>
      <template v-else>
        <!-- View Mode -->
        <h3 class="font-semibold text-teal-700">
          <a
            class="text-pink-500 underline"
            v-if="dish.recipe_url"
            :href="dish.recipe_url"
            target="_blank"
            >{{ dish.title }}</a
          >
          <span v-else> {{ dish.title }}</span>
        </h3>
        <p class="text-sm text-gray-600">
          {{ dish.description }}
        </p>
        <div
          v-if="dish.images?.length"
          class="flex mt-2 mb-1">
          <img
            v-for="img in dish.images"
            :key="img.image_url"
            :src="img.image_url"
            class="w-28 h-28 rounded object-cover mr-2" />
        </div>
        <button
          v-if="showDelete"
          @click="deleteDish(dish.id)"
          class="text-sm text-white bg-red-500 px-2 py-1 rounded hover:bg-red-600">
          🗑 Delete
        </button>
        <button
          @click="toggleEditMode"
          class="text-sm text-white bg-blue-500 px-2 py-1 rounded hover:bg-blue-600 ml-2">
          ✏️ Edit
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '../lib/supabaseClient'

/* -------------------- Props and Emits -------------------- */
const props = defineProps<{
  dishId: string
  showDelete: boolean
}>()

const emits = defineEmits<{
  (e: 'remove-dish', dishId: string): void
}>()

/* -------------------- Reactive State -------------------- */
const loading = ref(true)
const editMode = ref(false)
const dish = ref<any>({
  id: '',
  title: '',
  description: '',
  recipe_url: '',
  images: [],
})

const files = ref<File[]>([])
const imagePreviews = ref<string[]>([])

let dishChannel: any = null // Store the real-time channel reference
let dishImagesChannel: any = null // Store the real-time channel reference for dish_images

/* -------------------- Methods -------------------- */

// Fetches the dish data from the server
const fetchDish = async () => {
  loading.value = true

  const { data, error } = await supabase
    .from('dishes')
    .select('id, title, description, recipe_url, images:dish_images(image_url)')
    .eq('id', props.dishId)
    .single()

  if (error) {
    console.error('Error fetching dish:', error)
  } else {
    dish.value = data
  }

  loading.value = false
}

// Toggles edit mode for the dish
const toggleEditMode = () => {
  editMode.value = !editMode.value
}

// Handles file uploads
const handleFileUpload = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files) {
    files.value = Array.from(input.files)
    imagePreviews.value = files.value.map((file) => URL.createObjectURL(file))
  }
}

// Removes an image from the dish
const removeImage = async (imageUrl: string) => {
  const { error } = await supabase
    .from('dish_images')
    .delete()
    .eq('image_url', imageUrl)

  if (error) {
    console.error('Error removing image:', error)
    return
  }

  dish.value.images = dish.value.images.filter(
    (img: any) => img.image_url !== imageUrl
  )
}

// Saves the updated dish details and uploads new images
const saveDish = async () => {
  const { error } = await supabase
    .from('dishes')
    .update({
      title: dish.value.title,
      description: dish.value.description,
      recipe_url: dish.value.recipe_url,
    })
    .eq('id', props.dishId)

  if (error) {
    console.error('Error saving dish:', error)
    return
  }

  // Upload new images
  for (const file of files.value) {
    const path = `${props.dishId}/${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('dish-images')
      .upload(path, file)

    if (uploadError) {
      console.error('Error uploading image:', uploadError)
      continue
    }

    const publicUrl = supabase.storage.from('dish-images').getPublicUrl(path)
      .data.publicUrl

    await supabase
      .from('dish_images')
      .insert({ dish_id: props.dishId, image_url: publicUrl })

    // dish.value.images.push({ image_url: publicUrl })
  }

  // Clear file inputs
  files.value = []
  imagePreviews.value = []

  editMode.value = false
  console.log('Dish updated successfully')
}

// Deletes the dish
const deleteDish = async (dishId: string) => {
  if (!confirm('Are you sure you want to delete this dish?')) return

  const { error } = await supabase.from('dishes').delete().eq('id', dishId)

  if (error) {
    console.error('Failed to delete dish:', error)
    return
  }

  emits('remove-dish', props.dishId)
}

/* -------------------- Real-Time Subscriptions -------------------- */

const subscribeToDishUpdates = () => {
  // Unsubscribe from any existing channel to avoid duplicates
  if (dishChannel) {
    dishChannel.unsubscribe()
  }

  // Subscribe to real-time updates for the specific dish
  dishChannel = supabase
    .channel(`realtime:dish:${props.dishId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'dishes',
        filter: `id=eq.${props.dishId}`,
      },
      (payload) => {
        console.log('Realtime event for dish:', payload)

        if (payload.eventType === 'UPDATE') {
          // Update the dish data when it is updated on the server
          fetchDish()
        } else if (payload.eventType === 'DELETE') {
          // Notify parent to remove the dish if it is deleted
          emits('remove-dish', props.dishId)
        }
      }
    )
    .subscribe()
}

const subscribeToDishImagesUpdates = () => {
  // Unsubscribe from any existing channel to avoid duplicates
  if (dishImagesChannel) {
    dishImagesChannel.unsubscribe()
  }

  // Subscribe to real-time updates for the dish_images table
  dishImagesChannel = supabase
    .channel(`realtime:dish_images:${props.dishId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'dish_images',
        filter: `dish_id=eq.${props.dishId}`,
      },
      (payload) => {
        console.log('Realtime event for dish_images:', payload)

        if (payload.eventType === 'INSERT') {
          // Add the new image to the dish's images array
          dish.value.images.push(payload.new)
        } else if (payload.eventType === 'DELETE') {
          // Remove the deleted image from the dish's images array
          dish.value.images = dish.value.images.filter(
            (img) => img.image_url !== payload.old.image_url
          )
        }
      }
    )
    .subscribe()
}

/* -------------------- Lifecycle Hooks -------------------- */

onMounted(() => {
  fetchDish()
  subscribeToDishUpdates()
  subscribeToDishImagesUpdates()
})

onUnmounted(() => {
  // Unsubscribe from the real-time channel when the component is unmounted
  if (dishChannel) {
    dishChannel.unsubscribe()
  }
  if (dishImagesChannel) {
    dishImagesChannel.unsubscribe()
  }
})
</script>
