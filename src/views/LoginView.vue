<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabaseClient'

const status = ref('Klicka på knappen för att skicka mailet')
const email = ref('')

const signInWithEmail = async () => {
  status.value = 'skickar...'
  const { data, error } = await supabase.auth.signInWithOtp({
    email: email.value,
    options: {
      // set this to false if you do not want the user to be automatically signed up
      shouldCreateUser: false,
      emailRedirectTo: 'https://salmiak.github.io/supabase-test/',
    },
  })
  status.value = 'Skickat - kolla din mail'
}
</script>

<template>
  <h2>Logga in</h2>
  <input
    type="email"
    placeholder="Skriv din e-postadress"
    class="border border-teal-300 bg-teal-100 rounded-md p-2 mb-4"
    v-model="email" /><br />
  <button @click="signInWithEmail">Skicka magiskt mejl</button><br />
  {{ status }}
</template>
