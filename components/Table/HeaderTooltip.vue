<script setup lang="ts">
defineProps<{
  text: string
  tooltipText: string
}>()
</script>

<template>
  <div class="flex items-center gap-2">
    <span>
      {{ text }}
    </span>
    <UTooltip
      arrow
      :text="tooltipText"
      :content="{ align: 'center', side: 'right' }"
    >
      <UIcon
        class="text-xl text-blue-500"
        name="i-lucide-info"
      />
    </UTooltip>
  </div>
</template>
