<script setup lang="ts">
import type { BattleReplay } from '~/api/replay.interface'
import type { PokemonInfo } from '~/api/pokemon.interface'
import { POKEMON_MAPPING_DEFINITION } from '~/api/pokemon.conts'

interface PokemonSprite {
  url: string
  name: string
}

const props = defineProps<{
  replayId: string
  username: string
}>()

const REGULATION_G = 'gen9vgc2025regg'
const REGULATION_I = 'gen9vgc2025regi'

const regulation = props.replayId.split('-')[0]

const MUNCHSTAT_REGULATION = regulation === REGULATION_I ? REGULATION_G : regulation

const MUNCHSTATS_URL = `https://munchstats.com/${MUNCHSTAT_REGULATION}/0/`

const loading = ref(true)
const pokemonSprites = ref<PokemonSprite[]>([])

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
  const fallbackUrl = '/poke_ball_icon.png'

  const spritePromises = endpoints.map((endpoint, index) =>
    $fetch<PokemonInfo>(endpoint)
      .then(sprite => ({
        url: sprite.sprites.other?.['official-artwork'].front_default || fallbackUrl,
        name: parsedPokemon[index],
      }))
      .catch(() => ({
        url: fallbackUrl,
        name: parsedPokemon[index],
      })),
  )
  const sprites = await Promise.all(spritePromises)

  return sprites.filter(sprite => sprite.url !== undefined) as PokemonSprite[]
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

function openMunchstats(pokemonName: string) {
  window.open(`${MUNCHSTATS_URL}${pokemonName}`, '_blank')
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
        :src="spriteUrl.url"
        alt="Rival Pokémon"
        class="w-10 h-10 hover:scale-110 hover:cursor-pointer transition-all duration-300"
        @error="pokemonSprites.splice(index, 1)"
        @click="openMunchstats(spriteUrl.name)"
      >
    </template>
  </div>
</template>
