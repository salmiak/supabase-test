<template>
  <div v-if="loading">Laddar recept</div>
  <div v-else>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabaseClient'

/* -------------------- Props and Emits -------------------- */
const props = defineProps<{
  dishId: string
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

onMounted(fetchDish)
</script>
