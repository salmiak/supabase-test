import { createWebHistory, createRouter } from 'vue-router'
import { supabase } from './lib/supabaseClient'

function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Helper function to calculate the start date of an ISO week
function getStartDateOfISOWeek(year, week) {
  const simple = new Date(year, 0, 1 + (week - 1) * 7)
  const dayOfWeek = simple.getDay()
  const isoWeekStart = simple
  if (dayOfWeek <= 4) {
    isoWeekStart.setDate(simple.getDate() - simple.getDay() + 1)
  } else {
    isoWeekStart.setDate(simple.getDate() + 8 - simple.getDay())
  }
  isoWeekStart.setHours(0, 0, 0, 0)
  return isoWeekStart
}

const routes = [
  { path: '/login', component: () => import('@/views/LoginView.vue'), name: 'Login' },
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
      const day = today.getDay // 0 (Sun) to 6 (Sat)()
      const diff = (day === 0 ? -6 : 1) // e.g., if today is Sunday (0), go back 6 daysay
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
        return next('/no-week')
      }

      next(`/weeks/${data.id}`)
    }
  },
  {
    path: '/:year/:nbr',
    name: 'WeekByYearAndNumber',
    beforeEnter: async (to, from, next) => {
      const year = parseInt(to.params.year, 10)
      const weekNumber = parseInt(to.params.nbr, 10)

      if (isNaN(year) || isNaN(weekNumber)) {
        console.error('Invalid year or week number:', to.params)
        return next('/no-week')
      }

      const startDate = getStartDateOfISOWeek(year, weekNumber)
      const isoDate = formatLocalDate(startDate)

      const { data, error } = await supabase
        .from('weeks')
        .select('id')
        .eq('start_date', isoDate)
        .single()

      if (error || !data) {
        console.warn('No week found for year:', year, 'week number:', weekNumber)
        return next('/no-week')
      }
  
      next(`/weeks/${data.id}`)
    }
  },
  {
    path: '/dishes',
    name: 'dishes',
    component: () => import('@/views/DishListView.vue')
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