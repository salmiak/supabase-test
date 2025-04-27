<template>
  <h1>
    <RouterLink :to="prevWeekRoute"
      ><Icon
        name="ArrowLeft"
        :strokeWidth="3"
        :size="20"
    /></RouterLink>
    <RouterLink
      v-if="isCurrentWeek"
      :to="nextWeekRoute">
      Denna vecka
    </RouterLink>
    <RouterLink
      v-else
      to="/"
      >Vecka {{ weekNbr }}</RouterLink
    >
    <RouterLink :to="nextWeekRoute"
      ><Icon
        name="ArrowRight"
        :strokeWidth="3"
        :size="20"
    /></RouterLink>
  </h1>
</template>

<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const weekNbr = ref(route.params.week_nbr as string)
const weekYear = ref(route.params.week_year as string)

function getISOWeekInfo(date = new Date()) {
  // Copy the date to avoid mutating the original
  const target: Date = new Date(date.valueOf())

  // Set to Thursday in the current week to ensure correct ISO week year
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7))

  // ISO week year
  const isoWeekYear = target.getFullYear()

  // Calculate ISO week number
  const firstThursday: Date = new Date(isoWeekYear, 0, 4)
  const weekNumber = Math.ceil(
    ((target.getTime() - firstThursday.getTime()) / 86400000 +
      firstThursday.getDay() +
      1) /
      7
  )

  return { isoWeekYear, weekNumber }
}

const isCurrentWeek = computed(() => {
  const { isoWeekYear, weekNumber } = getISOWeekInfo()
  return (
    parseInt(weekNbr.value) === weekNumber &&
    parseInt(weekYear.value) === isoWeekYear
  )
})

function getWeeksInYear(year: number): number {
  const dec28 = new Date(year, 11, 28) // Dec 28th
  const day = dec28.getUTCDay() // 0 (Sun) to 6 (Sat)
  const thursday = new Date(dec28)
  thursday.setUTCDate(dec28.getUTCDate() - ((day + 6) % 7) + 3) // move to Thursday of that week

  const firstThursday = new Date(Date.UTC(year, 0, 4)) // Jan 4th is always in week 1
  const weekNumber = Math.round(
    (thursday.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000) +
      1
  )

  return weekNumber
}

const prevWeekRoute = computed(() => {
  const prevWeekNbr = parseInt(weekNbr.value) - 1
  const prevYear = parseInt(weekYear.value)

  if (prevWeekNbr < 1) {
    const prevYearNbr = prevYear - 1
    return `/${prevYearNbr}/${getWeeksInYear(prevYearNbr)}/`
  }

  return `/${prevYear}/${prevWeekNbr}/`
})
const nextWeekRoute = computed(() => {
  const nextWeekNbr = parseInt(weekNbr.value) + 1
  const nextYear = parseInt(weekYear.value)

  if (nextWeekNbr > getWeeksInYear(nextYear)) {
    const nextYearNbr = nextYear + 1
    return `/${nextYearNbr}/1/`
  }

  return `/${nextYear}/${nextWeekNbr}/`
})

watch(
  () => route.params,
  () => {
    weekYear.value = route.params.week_year as string
    weekNbr.value = route.params.week_nbr as string
  }
)
</script>

<style scoped>
/* h1 {
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  font-size: 1rem;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.05rem;
  margin: 0;
  background: var(--background-5);
  color: var(--background-1);
  padding: 0.5rem 1rem;
}
h1 a {
  text-decoration: none;
  color: currentColor;
  font-weight: 700;
} */
</style>
