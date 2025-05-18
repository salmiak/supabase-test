<template>
  <div class="flex flex-col items-center mx-3 my-8 text-teal-500">
    <Icon
      :name="iconName"
      :class="{ 'animate-spin': spinIcon }"
      :size="36" />
    <div
      class="m-3 text-center text-lg font-semibold font-stretch-ultra-expanded">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from '@/components/Icon.vue'
defineProps({
  iconName: {
    type: String,
    required: true,
  },
  spinIcon: {
    type: Boolean,
    default: false,
  },
})
</script>
