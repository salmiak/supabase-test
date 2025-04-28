<template>
  <button
    class="m-1"
    @click="toggleEaten()">
    <Icon
      name="Square"
      :aria-label="`${meal.title} är ej avprickad`" />
  </button>
</template>

<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import { supabase } from '../lib/supabaseClient'

const props = defineProps<{
  meal: any
}>()

const toggleEaten = async () => {
  const { error } = await supabase
    .from('meals')
    .update({ is_eaten: !props.meal.is_eaten })
    .eq('id', props.meal.id)

  if (error) {
    console.error('Error toggling meal eaten status:', error)
  } else {
    props.meal.is_eaten = !props.meal.is_eaten
  }
}
</script>
