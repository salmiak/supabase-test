<script setup>
import { computed } from 'vue'
import * as icons from 'lucide-vue-next'

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  size: Number,
  color: String,
  strokeWidth: Number,
  defaultClass: String,
})

const icon = computed(() => icons[props.name])
</script>

<template>
  <component
    :is="icon"
    :size="size || 16"
    :color="color"
    :stroke-width="strokeWidth || 2.25"
    :default-class="defaultClass" />
</template>
