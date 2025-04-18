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

    <button
      @click="createNewWeek"
      class="mt-4 w-full bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-2 px-4 rounded"
    >
      ➕ Add next week
    </button>
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

const createNewWeek = async () => {
  // Find latest start_date (already sorted)
  const latest = weeks.value[0]
  const latestDate = new Date(latest?.start_date ?? new Date())

  const nextWeekDate = new Date(latestDate)
  nextWeekDate.setDate(latestDate.getDate() + 7)
  nextWeekDate.setHours(0, 0, 0, 0)

  const start_date = formatLocalDate(nextWeekDate)

  // get current user
  const { data: { user } } = await supabase.auth.getUser()

  // fetch their family_id
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('family_id')
    .eq('id', user?.id)
    .single()

  if (profileError || !profile) {
    console.error('Could not get family_id', profileError)
    return
  }

  const { data, error } = await supabase
    .from('weeks')
    .insert({ 
      start_date,
      family_id: profile.family_id, 
     })
    .select()
    .single()

  if (error || !data) {
    console.error('Failed to create new week:', error)
    return
  }

  weeks.value.unshift(data) // add to list
  router.push(`/weeks/${data.id}`)
}

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

onMounted(fetchWeeks)
</script>
