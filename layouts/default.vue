<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const items = ref<NavigationMenuItem[][]>([
  [
    {
      slot: 'logo',
      label: 'Pokémon Showdown',
      icon: 'i-lucide-pokeball',
      to: '/',
    },
  ],
  [
    {
      label: 'Replays',
      icon: 'i-lucide-monitor-play',
      to: '/replays',
    },
    {
      label: 'Game by game',
      icon: 'i-lucide-gamepad-2',
      to: '/',
    },
    {
      label: 'Usage',
      icon: 'i-lucide-trophy',
      to: '/',
    },
    {
      label: 'Matchup stats',
      icon: 'i-lucide-bar-chart-2',
      to: '/',
    },
    {
      label: 'Move usage',
      icon: 'i-lucide-chart-pie',
      to: '/',
    },
  ],
  [
    {
      label: 'GitHub',
      icon: 'i-simple-icons-github',
      to: 'https://github.com/xJuliMendez/showdown-tracker',
      target: '_blank',
    },
    {
      label: 'Help',
      icon: 'i-lucide-circle-help',
      disabled: true,
    },
  ],
])
</script>

<template>
  <div>
    <UNavigationMenu
      orientation="horizontal"
      :items
      :highlight="true"
      class="px-20 py-8"
    >
      <template #logo>
        <div class="flex items-center">
          <img
            src="/poke_ball_icon.png"
            alt="Pokeball"
            class="h-8 mr-2"
          >
          <div class="flex flex-col items-center">
            <span class="text-xl font-bold">Pokémon Showdown Tracker</span>
          </div>
        </div>
      </template>
    </UNavigationMenu>
    <slot />
  </div>
</template>
