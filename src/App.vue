<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from './lib/supabaseClient'
import { useRouter } from 'vue-router'

import './assets/main.css'

const router = useRouter()

const auth = ref()
async function getAuth() {
  const { data } = await supabase.auth.getUser()
  auth.value = data
}

const handleLogout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Logout error:', error.message)
  } else {
    router.push({ name: 'Login' })
  }
}

onMounted(() => {
  getAuth()
})
</script>

<template>
  <div
    class="grid content-stretch items-start grid-rows-[1.75rem_1fr_2.5rem] min-h-screen">
    <nav class="grid grid-cols-2">
      <RouterLink
        to="/"
        :class="{ active: $route.name === 'WeekView' }"
        >Planering</RouterLink
      >
      <RouterLink to="/dishes">Recept</RouterLink>
    </nav>

    <!--<WeekList class="w-64" /> -->
    <main>
      <RouterView />
    </main>
    <footer class="bg-teal-700 h-10 p-2 text-center text-teal-100">
      <div
        @click="handleLogout"
        class="cursor-pointer hover:text-teal-300 font-semibold">
        Logga ut
      </div>
    </footer>
  </div>
</template>
