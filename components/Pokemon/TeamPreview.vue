<script setup lang="ts">
import type { BattleReplay } from '~/api/replay.interface'
import type { PokemonInfo } from '~/api/pokemon.interface'
import { POKEMON_MAPPING_DEFINITION } from '~/api/pokemon.conts'

const props = defineProps<{
  replayId: string
  username: string
}>()

const loading = ref(true)
const pokemonSprites = ref<string[]>([])

const isPlayerVictory = ref(false)

function extractPokemonInBattle(battleLog: string) {
  const playerRegex = /\|player\|(p1|p2)\|([^,|]+)/g
  const pokemonRegex = /\|poke\|(p1|p2)\|([^,|]+)/g
  const winnerRegex = /\|win\|([^\n|]+)/
  let match = winnerRegex.exec(battleLog)
  isPlayerVictory.value = match ? match[1].trim() === props.username : false

  const playerNames: { [key: string]: string } = { }
  const playersFound = new Set<string>()

  while ((match = playerRegex.exec(battleLog)) !== null) {
    const player = match[1]
    const playerName = match[2].trim()

    if (!playersFound.has(player)) {
      playerNames[player] = playerName
      playersFound.add(player)
    }

    if (playersFound.size === 2) {
      break
    }
  }

  const playersPokemon: { [key: string]: string[] } = {
    [playerNames['p1']]: [],
    [playerNames['p2']]: [],
  }

  while ((match = pokemonRegex.exec(battleLog)) !== null) {
    const playerNumber = match[1]
    const pokemonName = match[2].trim()
    const playerName = playerNames[playerNumber]

    if (!playersPokemon[playerName]) {
      playersPokemon[playerName] = []
    }
    playersPokemon[playerName].push(pokemonName)
  }

  return playersPokemon
}

async function getRivalPokemon(replayId: string) {
  const battleReplay = await $fetch<BattleReplay>(`https://replay.pokemonshowdown.com/${replayId}.json`)
  const pokemonInBattle = extractPokemonInBattle(battleReplay.log)
  const rivalName = Object.keys(pokemonInBattle).find(player => player !== props.username) || ''
  return pokemonInBattle[rivalName] || []
}

async function getRivalSprites(pokemonName: string[]) {
  let parsedPokemon = pokemonName.map(pokemon => pokemon.replace(/\s/g, '-').toLowerCase())

  parsedPokemon = parsedPokemon.map((pokemon) => {
    const pokemonMapping = POKEMON_MAPPING_DEFINITION[pokemon as keyof typeof POKEMON_MAPPING_DEFINITION]
    return pokemonMapping || pokemon
  })

  const endpoints = parsedPokemon.map(pokemon => `https://pokeapi.co/api/v2/pokemon/${pokemon}`)

  const spritePromises = endpoints.map(endpoint => $fetch<PokemonInfo>(endpoint))
  const sprites = await Promise.all(spritePromises).then(sprites => sprites.map(sprite => sprite.sprites.other?.['official-artwork'].front_default))

  if (sprites.some(sprite => sprite === undefined)) {
    throw new Error('Error fetching sprites')
  }

  return sprites.filter(sprite => sprite !== undefined) as string[]
}

async function loadPokemonSprites() {
  try {
    loading.value = true
    const rivalPokemon = await getRivalPokemon(props.replayId)
    pokemonSprites.value = await getRivalSprites(rivalPokemon)
  }
  catch {
    pokemonSprites.value = []
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPokemonSprites()
})

watch(() => props.replayId, () => {
  loadPokemonSprites()
})
</script>

<template>
  <div class="flex items-center gap-2">
    <template v-if="isPlayerVictory">
      <span class="mr-6 font-bold text-green-500 text-3xl">
        W
      </span>
    </template>
    <template v-else>
      <span class="mr-6 font-bold text-red-500 text-3xl">
        L
      </span>
    </template>

    <template v-if="loading">
      <div class="flex items-center justify-center">
        <img
          src="/poke_ball_icon.png"
          alt="Loading"
          class="w-10 h-10 animate-spin"
        >
      </div>
    </template>
    <template v-else>
      <img
        v-for="(spriteUrl, index) in pokemonSprites"
        :key="index"
        :src="spriteUrl"
        alt="Rival Pokémon"
        class="w-10 h-10 hover:scale-110 hover:cursor-pointer transition-all duration-300"
        @error="pokemonSprites.splice(index, 1)"
      >
    </template>
  </div>
</template>
