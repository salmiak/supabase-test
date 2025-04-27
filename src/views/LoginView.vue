<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabaseClient'

const status = ref('Klicka på knappen för att skicka mailet')

const signInWithEmail = async () => {
  status.value = 'skickar...'
  const { data, error } = await supabase.auth.signInWithOtp({
    email: 'beckmanalfred@gmail.com',
    options: {
      // set this to false if you do not want the user to be automatically signed up
      shouldCreateUser: false,
      emailRedirectTo: 'https://example.com/welcome',
    },
  })
  status.value = 'Skickat - kolla din mail'
}
</script>

<template>
  <h2>Logga in</h2>
  <button @click="signInWithEmail">Skicka magiskt mejl</button><br />
  {{ status }}
</template>
