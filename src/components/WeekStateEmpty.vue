<template>
  <div class="flex flex-col items-center mx-3 my-8 text-teal-500">
    <Icon
      name="Rat"
      :size="36" />
    <div
      class="m-3 text-center text-lg font-semibold font-stretch-ultra-expanded">
      Än så länge inga måltider<br />planerade för denna vecka.
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from '@/components/Icon.vue'
</script>
