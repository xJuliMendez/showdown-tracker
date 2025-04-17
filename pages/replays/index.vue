<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import TableHeaderTooltip from '~/components/Table/HeaderTooltip.vue'
import type { UserReplay } from '~/api/replay.interface'
import TeamPreview from '~/components/Pokemon/TeamPreview.vue'

const defaultUsername = useLocalStorage('shodown-tracker-username', '')
const username = ref<string>(defaultUsername.value)

const userReplays = ref<UserReplay[]>([])

async function getUserReaplays(username: string = defaultUsername.value) {
  if (username === '') {
    return
  }

  const replays = await $fetch<UserReplay[]>('https://replay.pokemonshowdown.com/search.json', {
    params: {
      username: username,
    },
  })

  userReplays.value = replays
}

await getUserReaplays()

function getOpponentName(players: string[], currentUsername: string) {
  return h('p', {
    class: 'text-blue-500 hover:text-blue-300 hover:cursor-pointer hover:underline transition-all duration-300',
    onClick: () => {
      username.value = players[0] === currentUsername ? players[1] : players[0]
      onSearchUser()
    },
  }, [players[0] === currentUsername ? players[1] : players[0]])
}

function renderRivalPokemonCell(replayId: string) {
  return h(TeamPreview, {
    replayId,
    username: username.value,
  })
}

function renderHeader() {
  return h(TableHeaderTooltip, {
    text: 'Rival Pokémon',
    tooltipText: 'Due to limited data for Regulation I, clicking a Pokémon will show information from Regulation G instead.',
  })
}

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
    header: 'Rival',
    cell: ({ row }) => {
      const players: string[] = row.getValue('players')
      return getOpponentName(players, username.value)
    },
  },
  {
    accessorKey: 'pokemon',
    header: () => renderHeader(),
    cell: ({ row }) => renderRivalPokemonCell(row.getValue('id')),
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

onMounted(() => {
  setInterval(() => {
    onSearchUser()
  }, 180000)
})
</script>

<template>
  <div class="m-4">
    <div class="flex ml-4  items-center self-end gap-4">
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
      sticky
      class="h-[26rem]"
    />
  </div>
</template>
