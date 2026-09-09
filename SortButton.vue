<script setup>
import { ArrowUp, ArrowDown, ArrowUpDown } from '@lucide/vue'

defineProps({
	columnField: String,
	currentSortBy: String,
	currentSortDir: String,
})
</script>

<template>
	<ArrowUp v-if="currentSortBy === columnField && currentSortDir === 'asc'" class="h-3.5 w-3.5" />
	<ArrowDown
		v-else-if="currentSortBy === columnField && currentSortDir === 'desc'"
		class="h-3.5 w-3.5"
	/>
	<ArrowUpDown v-else class="h-3.5 w-3.5 opacity-40" />
</template>
