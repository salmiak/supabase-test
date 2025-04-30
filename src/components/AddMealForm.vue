<!-- src/components/AddMealForm.vue -->
<template>
  <div
    v-if="!showForm"
    class="bg-teal-50 m-2 rounded-xl shadow-sm overflow-hidden">
    <button
      @click="showForm = true"
      class="block w-full bg-teal-100 border-b border-b-teal-200 text-teal-600 m-0 text-base/4 font-semibold font-stretch-expanded tracking-widest py-3 px-2">
      Lägg till måltid
    </button>
  </div>
  <div
    v-else
    class="bg-teal-50 m-2 rounded-xl shadow-sm overflow-hidden">
    <div class="flex justify-between bg-teal-100 border-b border-b-teal-200">
      <h2
        class="text-teal-600 m-0 text-base/4 font-semibold font-stretch-expanded tracking-widest py-3 px-2">
        Lägg till måltid
      </h2>
      <div class="flex m-1">
        <button
          @click="showForm = false"
          class="ml-1">
          <Icon name="X" />
        </button>
      </div>
    </div>

    <div class="m-1">
      <input
        v-model="title"
        class="block w-full mb-1 py-1 px-2 rounded-lg bg-white border border-teal-300"
        placeholder="Namn på måltid" />
      <textarea
        v-model="comment"
        class="block w-full mb-1 h-24 p-2 border border-teal-300 rounded-lg bg-white"
        placeholder="Kommentarer om måltiden"></textarea>
      <button @click="submit">Spara måltid</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '../lib/supabaseClient'
import Icon from '@/components/Icon.vue'

const props = defineProps<{
  weekId: string
}>()

const emit = defineEmits<{
  (e: 'meal-added', meal: any): void
}>()

const showForm = ref(false)
const title = ref('')
const comment = ref('')

const submit = async () => {
  if (!title.value.trim()) {
    console.error('Title is required')
    return
  }

  const { data, error } = await supabase.from('meals').insert({
    week_id: props.weekId,
    title: title.value,
    comment: comment.value,
  })

  if (error) {
    console.error('Failed to add meal:', error)
    return
  }

  title.value = ''
  comment.value = ''
}
</script>
