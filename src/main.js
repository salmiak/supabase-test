import { createApp } from 'vue'
import router from './router'
import App from './App.vue'

// In main.js or wherever your app initializes
import { supabase } from './lib/supabaseClient'

createApp(App)
  .use(router)
  .mount('#app')

supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event)
  // Optionally update your app state, e.g., Vuex or Pinia store
})