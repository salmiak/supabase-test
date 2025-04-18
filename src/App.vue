<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from './lib/supabaseClient'
import { useRouter } from 'vue-router'

import WeekList from '@/components/WeekList.vue'

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
  <h1>Mat</h1>
  <button @click="handleLogout">Log Out</button>
  <!--<p>
    <strong>Current route path:</strong> {{ $route.fullPath }}
  </p>-->
  <nav>
    <RouterLink to="/">Go to Home</RouterLink>
    <WeekList class="w-64" />
  </nav>
  <main>
    <RouterView />
  </main>
</template>
