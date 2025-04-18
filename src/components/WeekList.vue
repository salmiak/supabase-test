<template>
  <aside class="p-4 border-r h-full overflow-y-auto bg-white">
    <h2 class="text-lg font-bold mb-4">Weeks</h2>

    <ul v-if="weeks.length > 0" class="space-y-2">
      <li
        v-for="week in weeks"
        :key="week.id"
        @click="goToWeek(week.id)"
        class="cursor-pointer hover:bg-gray-100 p-2 rounded"
      >
        📅 {{ formatDate(week.start_date) }}
      </li>
    </ul>

    <p v-else class="text-gray-500">No weeks yet</p>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabaseClient'

const router = useRouter()
const weeks = ref<any[]>([])

const fetchWeeks = async () => {
  const { data, error } = await supabase
    .from('weeks')
    .select('id, start_date')
    .order('start_date', { ascending: false })

  if (error) {
    console.error('Failed to fetch weeks:', error)
    return
  }

  weeks.value = data ?? []
}

const formatDate = (dateStr: string) => {
  const options = { month: 'long', day: 'numeric', year: 'numeric' } as const
  return `Week of ${new Date(dateStr).toLocaleDateString(undefined, options)}`
}

const goToWeek = (weekId: string) => {
  router.push(`/weeks/${weekId}`)
}

onMounted(fetchWeeks)
</script>
