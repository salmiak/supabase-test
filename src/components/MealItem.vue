<template>
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

  <button
          @click="deleteMeal()"
          class="text-red-500 hover:text-red-700 text-sm"
        >
          🗑 Delete
        </button>
</template>

<script setup lang="ts">

const props = defineProps<{
  meal: any
}>()

const emits = defineEmits<{
  (e: 'delete-meal', mealId: string): void
}>()

const deleteMeal = () => {
  emits('delete-meal', props.meal.id)
}

</script>