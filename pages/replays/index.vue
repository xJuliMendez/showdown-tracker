<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { PokemonInfo } from '~/api/pokemon.interface'
import type { BattleReplay, UserReplay } from '~/api/replay.interface'

const defaultUsername = useLocalStorage('shodown-tracker-username', '')
const username = ref<string>(defaultUsername.value)

const userReplays = ref<UserReplay[]>([])

const replayIds = ref<string[]>([])

function extractPokemonInBattle(battleLog: string) {
  const playerRegex = /\|player\|(p1|p2)\|([^,|]+)/g
  const pokemonRegex = /\|poke\|(p1|p2)\|([^,|]+)/g

  const playerNames: { [key: string]: string } = { }
  let match
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

async function getUserReaplays(username: string = defaultUsername.value) {
  userReplays.value = await $fetch<UserReplay[]>('https://replay.pokemonshowdown.com/search.json', {
    params: {
      username: username,
    },
  })
  replayIds.value = userReplays.value.map(replay => replay.id)
}

const rivalPokemon = ref<string[]>([])

async function getRivalPokemon(replayId: string) {
  const battleReplay = await $fetch<BattleReplay>(`https://replay.pokemonshowdown.com/${replayId}.json`)

  const pokemonInBattle = extractPokemonInBattle(battleReplay.log)
  const rivalName = Object.keys(pokemonInBattle).find(player => player !== username.value) || ''
  rivalPokemon.value = pokemonInBattle[rivalName] || []
}

await getUserReaplays()

await getRivalPokemon(replayIds.value[0])

const rivalPokemonSpritesUrls = ref<string[]>([])

async function getRivalSprites(pokemonName: string[]) {
  const parsedPokemon = pokemonName.map(pokemon => pokemon.replace(/\s/g, '-').toLowerCase())

  const endpoints = parsedPokemon.map(pokemon => `https://pokeapi.co/api/v2/pokemon/${pokemon}`)

  const spritePromises = endpoints.map(endpoint => $fetch<PokemonInfo>(endpoint))
  const sprites = await Promise.all(spritePromises).then(sprites => sprites.map(sprite => sprite.sprites.other?.['official-artwork'].front_default))

  if (sprites.some(sprite => sprite === undefined)) {
    throw new Error('Error fetching sprites')
  }

  rivalPokemonSpritesUrls.value = sprites.filter(sprite => sprite !== undefined) as string[]
}

await getRivalSprites(rivalPokemon.value)

const columns: TableColumn<UserReplay>[] = [
  {
    accessorKey: 'id',
    header: 'Replay id',
  },
  {
    accessorKey: 'format',
    header: 'Format',
  },
  {
    accessorKey: 'players',
    header: 'Oponent',
    cell: ({ row }) => {
      const players: string[] = row.getValue('players')
      return players[0] === username.value
        ? players[1]
        : players[0]
    },
  },
  {
    header: 'Rival Pokémon',
    cell: () => {
      return h('div',
        { class: 'flex gap-2' },
        rivalPokemonSpritesUrls.value.map((spriteUrl, index) => {
          return h('img', {
            key: index,
            src: spriteUrl,
            alt: 'Rival Pokémon',
            class: 'w-10 h-10',
          })
        }),
      )
    },
  },
  {
    accessorKey: 'rating',
    header: 'Rating',
  },
  {
    accessorKey: 'uploadtime',
    header: 'Date',
    cell: ({ row }) => {
      const timestamp: number = row.getValue('uploadtime')
      const date = new Date(timestamp * 1000)
      return date.toLocaleString()
    },
  },

]

async function onSearchUser() {
  await getUserReaplays(username.value.trim())
}
</script>

<template>
  <div>
    <div class="flex justify-center items-center gap-4">
      <h1>Place your username here</h1>
      <UInput
        v-model="username"
        size="xl"
        placeholder="Search..."
        @keyup.enter="onSearchUser"
      />
      <UButton
        size="xl"
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        @click="onSearchUser"
      >
        Search
      </UButton>
    </div>

    <UTable
      :data="userReplays"
      :columns
    />
  </div>
</template>
