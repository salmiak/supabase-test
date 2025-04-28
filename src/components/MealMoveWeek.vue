<template>
  <button
    v-if="dir === 'prev'"
    @click="moveMealToPrevWeek"
    :aria-label="`Flytta ${meal.title} till föregående vecka`"
    class="m-1">
    <Icon name="ArrowLeft" />
  </button>
  <button
    v-else-if="dir === 'next'"
    @click="moveMealToNextWeek"
    :aria-label="`Flytta ${meal.title} till nästa vecka`"
    class="m-1">
    <Icon name="ArrowRight" />
  </button>
</template>

<script lang="ts" setup>
import Icon from '@/components/Icon.vue'
import { supabase } from '../lib/supabaseClient'

const props = defineProps<{
  meal: any
  dir: string
}>()

const emits = defineEmits<{
  (e: 'meal-moved'): void
}>()

const getWeekId = async (weekNbr: number, weekYear: number) => {
  const { data: targetWeek, error: targetWeekError } = await supabase
    .from('weeks')
    .select('id')
    .eq('week_nbr', weekNbr)
    .eq('week_year', weekYear)
    .maybeSingle()

  if (targetWeekError) {
    console.error('Error fetching week ID:', targetWeekError)
    return null
  }

  let targetWeekId = targetWeek?.id
  if (!targetWeekId) {
    console.log('No week found, creating a new one')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('family_id')
      .eq('id', user?.id)
      .single()

    if (profileError || !profile) {
      console.error('Could not get family_id', profileError)
      return
    }

    const { data: newWeek, error: newWeekError } = await supabase
      .from('weeks')
      .insert({
        week_nbr: weekNbr,
        week_year: weekYear,
        family_id: profile.family_id,
      })
      .select()
      .single()

    if (newWeekError || !newWeek) {
      console.error('Error creating next week:', newWeekError)
      return
    }

    targetWeekId = newWeek.id
  }

  return targetWeekId
}

const moveMealToNextWeek = async () => {
  // Calculate the next week number and year
  let nextWeekNbr = parseInt(props.meal.week.week_nbr) + 1
  let nextWeekYear = parseInt(props.meal.week.week_year)

  if (nextWeekNbr > 52) {
    nextWeekNbr = 1
    nextWeekYear += 1
  }

  const nextWeekId = await getWeekId(nextWeekNbr, nextWeekYear)
  if (!nextWeekId) {
    console.error('Error fetching next week ID')
    return
  }

  // Update the meal's week_id to the next week
  const { error: updateError } = await supabase
    .from('meals')
    .update({ week_id: nextWeekId })
    .eq('id', props.meal.id)

  if (updateError) {
    console.error('Error moving meal to next week:', updateError)
    return
  }

  console.log('Meal moved to next week successfully')
  emits('meal-moved') // Notify parent to remove the meal from the current week
}
const moveMealToPrevWeek = async () => {
  // Calculate the next week number and year
  let prevWeekNbr = parseInt(props.meal.week.week_nbr) - 1
  let prevWeekYear = parseInt(props.meal.week.week_year)

  if (prevWeekNbr <= 0) {
    prevWeekNbr = 52
    prevWeekYear -= 1
  }

  const prevWeekId = await getWeekId(prevWeekNbr, prevWeekYear)
  if (!prevWeekId) {
    console.error('Error fetching prev. week ID')
    return
  }

  // Update the meal's week_id to the next week
  const { error: updateError } = await supabase
    .from('meals')
    .update({ week_id: prevWeekId })
    .eq('id', props.meal.id)

  if (updateError) {
    console.error('Error moving meal to prev week:', updateError)
    return
  }

  console.log('Meal moved to prev week successfully')
  emits('meal-moved') // Notify parent to remove the meal from the current week
}
</script>
