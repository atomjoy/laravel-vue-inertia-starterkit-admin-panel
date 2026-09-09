<!-- resources/js/Components/TableActionsDropdown.vue -->
<script setup lang="ts" generic="T extends Record<string, any>">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { router } from '@inertiajs/vue3'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
	basePath: string
	row: T
}>()

const { t } = useI18n({ useScope: 'global' })
const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)

const dropdownStyles = ref({
	top: '0px',
	left: '0px',
})

const toggleDropdown = async (event: MouseEvent) => {
	isOpen.value = !isOpen.value

	if (isOpen.value) {
		await nextTick()
		if (triggerRef.value) {
			const rect = triggerRef.value.getBoundingClientRect()
			dropdownStyles.value = {
				top: `${rect.bottom + window.scrollY}px`,
				left: `${rect.right - 192 + window.scrollX}px`,
			}
		}
	}
}

const handleEdit = () => {
	router.get(`${props.basePath}/${props.row.id}/edit`)
}

const handleDelete = () => {
	const displayName =
		props.row.name || props.row.title || t('global.actions.this_record', 'ten rekord')

	if (
		confirm(
			t(
				'global.actions.confirm_delete',
				{ name: displayName },
				'Czy na pewno chcesz usunąć: {name}?',
			),
		)
	) {
		router.delete(`${props.basePath}/${props.row.id}`, {
			preserveState: true,
			preserveScroll: true,
		})
	}
}

// Zamykanie menu po kliknięciu poza przyciskiem
const handleClickOutside = (event: MouseEvent) => {
	if (isOpen.value && triggerRef.value && !triggerRef.value.contains(event.target as Node)) {
		isOpen.value = false
	}
}

// Funkcja obsługująca klawisz Escape
const handleKeyDown = (event: KeyboardEvent) => {
	if (event.key === 'Escape' && isOpen.value) {
		isOpen.value = false
		// Opcjonalnie: przywracamy focus na przycisk trzech kropek po zamknięciu klawiaturą
		triggerRef.value?.focus()
	}
}

onMounted(() => {
	document.addEventListener('click', handleClickOutside)
	document.addEventListener('keydown', handleKeyDown) // Nasłuchiwanie klawisza Esc
})

onUnmounted(() => {
	document.removeEventListener('click', handleClickOutside)
	document.removeEventListener('keydown', handleKeyDown) // Czyszczenie pamięci
})
</script>

<template>
	<div class="inline-block text-left">
		<button
			ref="triggerRef"
			@click.stop="toggleDropdown"
			class="flex items-center rounded-full p-2 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-600 focus:outline-none"
		>
			<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
				<path
					d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"
				/>
			</svg>
		</button>

		<Teleport to="body">
			<div
				v-if="isOpen"
				:style="dropdownStyles"
				class="ring-opacity-5 absolute z-50 w-48 divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-gray-300"
				@click.stop="isOpen = false"
			>
				<div class="py-1">
					<button
						@click="handleEdit"
						class="group flex w-full items-center px-4 py-2 text-left text-sm text-gray-700 transition-colors duration-150 hover:bg-gray-100"
					>
						{{ t('global.actions.edit', 'Edytuj') }}
					</button>
					<button
						@click="handleDelete"
						class="group flex w-full items-center px-4 py-2 text-left text-sm text-red-700 transition-colors duration-150 hover:bg-red-50"
					>
						{{ t('global.actions.delete', 'Usuń') }}
					</button>
				</div>
			</div>
		</Teleport>
	</div>
</template>
