import { createWebHistory, createRouter } from 'vue-router'
import { supabase } from './lib/supabaseClient'

import HomeView from './views/HomeView.vue'
import LoginView from './views/LoginView.vue'

const routes = [
  { path: '/', component: HomeView, name: 'Home' },
  { path: '/login', component: LoginView, name: 'Login' },
  {
    path: '/weeks/:id',
    name: 'WeekView',
    component: () => import('@/views/WeekView.vue'),
    meta: { requiresAuth: true }
  }  
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