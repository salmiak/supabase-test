<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from './lib/supabaseClient'
import { useRouter } from 'vue-router'

import WeekList from '@/components/WeekList.vue'

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
  <nav>
    <RouterLink to="/" :class="{active: $route.name==='WeekView'}">Planering</RouterLink>
    <RouterLink to="/dishes">Recept</RouterLink>
  </nav>

  <!--<WeekList class="w-64" /> -->
  <main>
    <RouterView />
  </main>
  <footer>
    <button @click="handleLogout">Logga ut</button>
  </footer>
</template>
