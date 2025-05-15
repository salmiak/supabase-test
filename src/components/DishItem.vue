<template>
  <div v-if="loading">Laddar recept</div>
  <div
    v-else
    class="grid grid-cols-[1fr_2.5rem] items-center px-1 py-2 border-b border-teal-200">
    <div class="px-2">
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
          :src="img.image_url"
          class="w-28 h-28 rounded object-cover mr-2" />
      </div>
      <button
        v-if="showDelete"
        @click="deleteDish(dish.id)">
        🗑 Delete
      </button>
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
//const dishes = ref<any[]>([])
const loading = ref(true)
const dish = ref<any>({
  id: '',
  title: '',
  description: '',
  recipe_url: '',
  images: [],
})

let dishChannel: any = null // Store the real-time channel reference
let dishImagesChannel: any = null // Store the real-time channel reference for dish_images

/* -------------------- Methods -------------------- */

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

const deleteDish = async (dishId: string) => {
  if (!confirm('Are you sure you want to delete this dish?')) return

  const { error } = await supabase.from('dishes').delete().eq('id', dishId)

  if (error) {
    console.error('Failed to delete dish:', error)
    return
  }

  emits('remove-dish', props.dishId)
}
/* -------------------- Real-Time Subscription -------------------- */

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
