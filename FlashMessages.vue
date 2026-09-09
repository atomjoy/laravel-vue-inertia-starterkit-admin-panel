<script setup lang="ts">
import { computed } from 'vue'
import { usePage } from '@inertiajs/vue3'

interface CustomSharedProps {
	flash: {
		success?: string | null
		error?: string | null
		warning?: string | null
	}
	[key: string]: unknown
}

const page = usePage<CustomSharedProps>()

const flash = computed(() => page.props.flash || {})
</script>

<template>
	<div class="mt-2 mb-2 space-y-3">
		<!-- Sukces (Zielony) -->
		<div
			v-if="flash.success"
			class="flex items-center rounded-r-lg border-l-4 border-emerald-500 bg-emerald-50 p-4 text-emerald-800"
			role="alert"
		>
			<svg
				class="mr-3 h-5 w-5 shrink-0 text-emerald-500"
				fill="currentColor"
				viewBox="0 0 20 20"
			>
				<path
					fill-rule="evenodd"
					d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l5-5z"
					clip-rule="evenodd"
				/>
			</svg>
			<span class="text-sm font-medium">{{ flash.success }}</span>
		</div>

		<!-- Błąd (Czerwony) -->
		<div
			v-if="flash.error"
			class="flex items-center rounded-r-lg border-l-4 border-rose-500 bg-rose-50 p-4 text-rose-800"
			role="alert"
		>
			<svg
				class="mr-3 h-5 w-5 shrink-0 text-rose-500"
				fill="currentColor"
				viewBox="0 0 20 20"
			>
				<path
					fill-rule="evenodd"
					d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
					clip-rule="evenodd"
				/>
			</svg>
			<span class="text-sm font-medium">{{ flash.error }}</span>
		</div>

		<!-- Ostrzeżenie (Żółty) -->
		<div
			v-if="flash.warning"
			class="flex items-center rounded-r-lg border-l-4 border-amber-500 bg-amber-50 p-4 text-amber-800"
			role="alert"
		>
			<svg
				class="mr-3 h-5 w-5 shrink-0 text-amber-500"
				fill="currentColor"
				viewBox="0 0 20 20"
			>
				<path
					fill-rule="evenodd"
					d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
					clip-rule="evenodd"
				/>
			</svg>
			<span class="text-sm font-medium">{{ flash.warning }}</span>
		</div>
	</div>
</template>
