import { createWebHistory, createRouter } from 'vue-router'
import { supabase } from './lib/supabaseClient'

import HomeView from './views/HomeView.vue'
import LoginView from './views/LoginView.vue'

function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}


const routes = [
//   { path: '/', component: HomeView, name: 'Home' },
  { path: '/login', component: LoginView, name: 'Login' },
  {
    path: '/weeks/:id',
    name: 'WeekView',
    component: () => import('@/views/WeekView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/weeks/current',
    name: 'CurrentWeek',
    alias: '/',
    beforeEnter: async (to, from, next) => {
      const today = new Date()
  
      // Adjust to get Monday as start of week
      const day = today.getDay() // 0 (Sun) to 6 (Sat)
      const diff = (day === 0 ? -6 : 1) - day // e.g., if today is Sunday (0), go back 6 days
      const monday = new Date(today)
      monday.setDate(today.getDate() + diff)
      monday.setHours(0, 0, 0, 0)
  
      const isoDate = formatLocalDate(monday)
  
      const { data, error } = await supabase
        .from('weeks')
        .select('id')
        .eq('start_date', isoDate)
        .single()
  
      if (error || !data) {
        console.warn('No current week found for start_date:', isoDate)
        return next('/no-week') // fallback route (optional)
      }
  
      next(`/weeks/${data.id}`)
    }
  },
  {
    path: '/dishes',
    name: 'dishes',
    component: import('@/views/DishListView.vue')
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