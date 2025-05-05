import { createWebHistory, createRouter } from 'vue-router'
import { supabase } from './lib/supabaseClient'
import WeekView from '@/views/WeekView.vue'
import DishListView from '@/views/DishListView.vue'
import LoginView from '@/views/LoginView.vue'

const base = import.meta.env.MODE === 'production' ? '/supabase-test/' : '/'

function getISOWeekInfo(date = new Date()) {
  // Copy the date to avoid mutating the original
  const target = new Date(date.valueOf())

  // Set to Thursday in the current week to ensure correct ISO week year
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7))

  // ISO week year
  const isoWeekYear = target.getFullYear()

  // Calculate ISO week number
  const firstThursday = new Date(isoWeekYear, 0, 4)
  const weekNumber = Math.ceil(
    ((target - firstThursday) / 86400000 + firstThursday.getDay() + 1) / 7
  )

  return { isoWeekYear, weekNumber }
}

const routes = [
  {
    path: '/login',
    component: LoginView,
    name: 'Login',
  },
  {
    path: '/',
    name: 'CurrentWeek',
    beforeEnter: async (to, from, next) => {
      const { isoWeekYear, weekNumber } = getISOWeekInfo()
      next(`/${isoWeekYear}/${weekNumber}`)
    },
  },
  {
    path: '/:week_year/:week_nbr',
    name: 'WeekView',
    component: WeekView,
    meta: { requiresAuth: true },
  },
  {
    path: '/dishes',
    name: 'dishes',
    component: DishListView,
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(base),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  if (requiresAuth && !session) {
    next({ name: 'Login' })
  } else {
    next()
  }
})

export default router
