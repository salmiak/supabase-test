import { createWebHistory, createRouter } from 'vue-router'
import { supabase } from './lib/supabaseClient'

import HomeView from './views/HomeView.vue'
import AboutView from './views/AboutView.vue'
import LoginView from './views/LoginView.vue'

const routes = [
  { path: '/', component: HomeView, name: 'Home' },
  { path: '/login', component: LoginView, name: 'Login' },
  { 
    path: '/about', 
    component: AboutView, 
    name: 'About', 
    meta: { requiresAuth: true }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
  if (requiresAuth && !session) {
    next({ name: 'Login' })
  } else {
    next()
  }
})

export default router