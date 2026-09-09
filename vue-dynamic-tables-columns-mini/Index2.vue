<script setup lang="ts">
import AdminLayout from '@/layouts/panel/AdminLayout.vue'
import Pagination from './Pagination.vue'
import StatusBadge from './StatusBadge.vue'
import ActionsDropdown from './ActionsDropdown.vue'
import type { Component, VNode } from 'vue'
import { ref, computed, h, watch } from 'vue'
import { router } from '@inertiajs/vue3'
import { useI18n } from 'vue-i18n'

export interface Role {
	id: number
	name: string
	guard_name: string
	created_at?: string
	updated_at?: string
}

export interface Permissions {
	id: number
	name: string
	guard_name: string
	created_at?: string
	updated_at?: string
}

export interface User {
	id: number
	name: string
	email: string
	email_verified_at: string | null
	created_at: string
	updated_at: string
	two_factor_confirmed_at: string | null
	roles: Role[]
	permissions: Permissions[]
}

export interface PaginationLink {
	url: string | null
	label: string
	active: boolean
}

export interface LaravelPaginationPayload<T = any> {
	current_page: number
	data: T[]
	first_page_url: string
	from: number
	last_page: number
	last_page_url: string
	links: PaginationLink[]
	next_page_url: string | null
	path: string
	per_page: number
	prev_page_url: string | null
	to: number
	total: number
}

export interface RoleFilterOption {
	value: string
	label: string
	count: number
}

export interface TableFilters {
	search?: string
	roles?: number[] | string[] | RoleFilterOption[]
	filter_verified?: 'all' | 'verified' | 'unverified' | boolean
	filter_2fa?: 'all' | 'enabled' | 'disabled' | boolean
	date_from?: string // Format YYYY-MM-DD
	date_to?: string // Format YYYY-MM-DD
	sort_by?: 'id' | 'name' | 'email' | 'created_at' | 'filter_2fa' | 'filter_verified'
	sort_dir?: 'asc' | 'desc'
	per_page?: 1 | 5 | 10 | 25 | 50 | 100 | number
}

// Columns
interface ColumnOptions {
	basePath: string
	selectedIds: Array<number>
	isAllSelected: boolean
}

interface TableColumn {
	key: string
	label: string
	sortable?: boolean
	render?: (value: any, row: User) => VNode | Component | string | number
}

// Locales
const { t } = useI18n()

// Propsy, eventy
const props = withDefaults(
	defineProps<{
		payload: LaravelPaginationPayload<User>
		roles: RoleFilterOption[]
		filters: TableFilters
		loading?: boolean
	}>(),
	{
		loading: false,
	},
)

// Admin layout
const routeUrl = '/admin/table'
const title = 'Users'
const description = 'Manage user accounts, email verification, and 2FA security.'

// Dane
const rolesList = ref(props.roles)
const rows = computed(() => props.payload.data)
let searchTimeout: ReturnType<typeof setTimeout>

const getUserColumns = (options: ColumnOptions): TableColumn[] => [
	{
		key: 'id',
		label: 'ID',
		render: (id, row: User) =>
			h('input', {
				type: 'checkbox',
				checked:
					id === undefined ? options.isAllSelected : options.selectedIds.includes(row.id),
				onChange: () => {
					if (id === undefined) {
						toggleAll() // Nagłówek
					} else {
						toggleRow(row.id) // Wiersz
					}
				},
				class: 'rounded border-gray-300 text-gray-600 focus:ring-gray-500 h-4 w-4',
			}),
		sortable: false,
	},
	{ key: 'name', label: 'users.name', sortable: true },
	{ key: 'email', label: 'users.email', sortable: true },
	{
		key: 'email_verified_at',
		label: 'users.status',
		render: (value: boolean) => h(StatusBadge, { active: value }),
		sortable: true,
	},
	{
		key: 'actions',
		label: '',
		render: (value: any, row: User) =>
			h(ActionsDropdown, {
				basePath: options.basePath,
				row: row,
			}),
		sortable: false,
	},
]

const columns = computed<TableColumn[]>(() =>
	getUserColumns({
		basePath: routeUrl,
		selectedIds: selectedIds.value,
		isAllSelected: isAllSelected.value,
	}),
)

const emit = defineEmits<{
	(e: 'sort', payload: { field: string; direction: 'asc' | 'desc' }): void
}>()

// Bezpieczne pobieranie wartości
const getCellValue = (row: User, key: string): any => {
	if (row && typeof row === 'object' && key in row) {
		return (row as Record<string, any>)[key]
	}
	return undefined
}

// Inicjalizacja tableState
const tableState = ref({
	page: props.payload.current_page || 1,
	per_page: props.payload.per_page || 15,
	sort_by: props.filters?.sort_by || 'id',
	sort_dir: props.filters?.sort_dir || 'asc',
	...props.filters,
} as Record<string, any>)

const updateTableData = () => {
	router.get(
		routeUrl,
		{
			...tableState.value,
		} as any,
		{
			preserveState: true,
			preserveScroll: true,
			only: ['payload', 'filters'],
		},
	)
}

// Sort tylko zmienia stan, watcher zajmie się resztą!
const handleSort = (col: TableColumn) => {
	if (!col.sortable) return
	const currentSortBy = tableState.value.sort_by || 'id'
	const currentSortDir = tableState.value.sort_dir || 'asc'
	const isCurrentField = currentSortBy === col.key
	const direction = isCurrentField && currentSortDir === 'asc' ? 'desc' : 'asc'
	tableState.value.sort_by = col.key
	tableState.value.sort_dir = direction
	tableState.value.page = 1
}

// Funkcja pomocnicza dla zmian innych filtrów (selecty itp.)
const handleFilterChange = () => {
	tableState.value.page = 1
}

// Odśwież dane button
const refreshTable = () => {
	router.reload({
		only: ['payload'],
	})
}

// Przechowuje ID aktualnie zaznaczonych wierszy
const selectedIds = ref<number[]>([])

// Sprawdza, czy wszyscy użytkownicy z obecnej strony są zaznaczeni
const isAllSelected = computed(() => {
	if (rows.value.length === 0) return false
	return rows.value.every((row) => selectedIds.value.includes(row.id))
})

// Funkcja obsługująca kliknięcie głównego checkboxa w nagłówku
const toggleAll = () => {
	if (isAllSelected.value) {
		const rowIds = rows.value.map((row) => row.id)
		selectedIds.value = selectedIds.value.filter((id) => !rowIds.includes(id))
	} else {
		rows.value.forEach((row) => {
			if (!selectedIds.value.includes(row.id)) {
				selectedIds.value.push(row.id)
			}
		})
	}
}

// Funkcja obsługująca pojedynczy checkbox w wierszu
const toggleRow = (id: number) => {
	const index = selectedIds.value.indexOf(id)
	if (index > -1) {
		selectedIds.value.splice(index, 1)
	} else {
		selectedIds.value.push(id)
	}
}

// Masowe usuwanie / akcja na zaznaczonych ID
const handleBulkDelete = () => {
	if (
		!confirm(
			`Czy na pewno chcesz usunąć ${selectedIds.value.length} zaznaczonych użytkowników?`,
		)
	) {
		return
	}

	router.post(
		routeUrl + '/bulk-delete',
		{
			ids: selectedIds.value,
		},
		{
			preserveScroll: true,
			onSuccess: () => {
				// Po udanym usunięciu czyszczymy zaznaczenie
				selectedIds.value = []
			},
		},
	)
}

// Jeden watcher pilnujący lokalnego stanu tabeli
watch(
	tableState,
	(newState, oldState) => {
		// Czyścimy poprzedni timer
		clearTimeout(searchTimeout)

		// Jeśli zmieniła się fraza wyszukiwania
		if (newState.search !== oldState?.search) {
			searchTimeout = setTimeout(() => {
				console.log('Szukam frazy z debounce:', newState.search)
				tableState.value.page = 1 // Reset strony
				updateTableData()
			}, 400)
		} else {
			updateTableData()
		}
	},
	{ deep: true },
)

// Bezpieczna synchronizacja zwrotna z serwera
router.on('success', (event) => {
	const newFilters = event.detail.page.props.filters as any
	if (newFilters) {
		// Blokujemy reaktywność watchera na chwilę przepisując dane
		tableState.value.sort_by = newFilters.sort_by || 'id'
		tableState.value.sort_dir = newFilters.sort_dir || 'asc'
	}
})
</script>

<template>
	<AdminLayout :title="title" :description="description" :route-url="routeUrl">
		<div class="w-full overflow-x-auto">
			<!-- Kontener nad tabelą na wyszukiwarkę -->
			<div class="mb-4 flex items-center justify-between">
				<div class="w-full max-w-xs">
					<label for="search" class="sr-only">Szukaj</label>
					<input
						id="search"
						type="text"
						v-model="tableState.search"
						placeholder="Szukaj użytkownika..."
						class="border-input m-1 block w-full rounded-md border p-2 px-4"
					/>
				</div>
			</div>

			<!-- Pasek masowych akcji -->
			<div
				v-if="selectedIds.length > 0"
				class="mb-4 flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 transition-all duration-200"
			>
				<span class="text-sm font-medium text-gray-700">
					Zaznaczono wierszy: <strong class="font-bold">{{ selectedIds.length }}</strong>
				</span>

				<div class="flex items-center space-x-3">
					<!-- Przycisk masowego usuwania / akcji -->
					<button
						@click="handleBulkDelete"
						class="inline-flex items-center rounded-md border border-transparent bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors duration-150 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
					>
						Usuń zaznaczone
					</button>
				</div>
			</div>

			<table class="min-w-full divide-y divide-gray-300">
				<thead class="bg-gray-50">
					<tr>
						<th
							v-for="col in columns"
							:key="col.key"
							@click="col.sortable ? handleSort(col) : null"
							:class="[
								col.sortable ? 'cursor-pointer select-none hover:bg-gray-100' : '',
								'px-3 py-3.5 text-left text-sm font-semibold text-gray-900 transition-colors duration-150',
							]"
						>
							<div class="flex items-center space-x-1">
								<!-- Jeśli kolumna ma funkcję render (np. nasz checkbox nagłówka), używamy jej -->
								<template v-if="col.key === 'id' && col.render">
									<component :is="col.render(undefined, {} as User)" />
								</template>
								<template v-else>
									<span>{{ col.label }}</span>
								</template>

								<span v-if="col.sortable" class="text-xs text-gray-400">
									<template v-if="tableState.sort_by === col.key">
										{{ tableState.sort_dir === 'asc' ? '▲' : '▼' }}
									</template>
									<template v-else>
										<span class="opacity-30">▲▼</span>
									</template>
								</span>
							</div>
						</th>
					</tr>
				</thead>
				<tbody class="relative divide-y divide-gray-200 bg-white">
					<template v-if="loading">
						Loading...
						<!-- <TableSkeletonRow v-for="n in 5" :key="n" :columns-count="columns.length" /> -->
					</template>
					<template v-else-if="rows.length === 0">
						<tr>
							<td
								:colspan="columns.length"
								class="px-3 py-8 text-center text-sm text-gray-500"
							>
								Brak danych do wyświetlenia.
							</td>
						</tr>
					</template>
					<template v-else>
						<tr
							v-for="(row, rowIndex) in rows"
							:key="row.id ?? rowIndex"
							class="transition-colors duration-150 hover:bg-gray-50"
						>
							<td
								v-for="col in columns"
								:key="col.key"
								class="px-3 py-4 text-sm whitespace-nowrap text-gray-500"
							>
								<template v-if="col.render">
									<component :is="col.render(getCellValue(row, col.key), row)" />
								</template>
								<template v-else>
									{{ getCellValue(row, col.key) ?? '' }}
								</template>
							</td>
						</tr>
					</template>
				</tbody>
			</table>
		</div>
		<div class="pagination">
			<Pagination :links="payload.links" :total="payload.total" />
		</div>
	</AdminLayout>
</template>
