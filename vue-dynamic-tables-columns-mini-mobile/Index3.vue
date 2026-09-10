<script setup lang="ts">
import AdminLayout from '@/layouts/panel/AdminLayout.vue'
import Pagination from './Pagination.vue'
import { useI18n } from 'vue-i18n'
import { ref, computed, toRef } from 'vue'
import { useTableWatcher } from './useTableWatcher'
import {
	LaravelPaginationPayload,
	RoleFilterOption,
	TableFilters,
	TableColumn,
	User,
} from './types'
import {
	handleBulkDelete,
	updateTableData,
	handleSort,
	getCellValue,
	getUserColumns,
	checkIfAllSelected,
} from './columns.js'

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

// Table columns
const columns = computed<TableColumn[]>(() =>
	getUserColumns({
		basePath: routeUrl,
		selectedIds: selectedIds,
		isAllSelected: isAllSelected,
		rows: rows,
	}),
)

// Inicjalizacja tableState
const tableState = ref({
	page: props.payload.current_page || 1,
	per_page: props.payload.per_page || 10,
	sort_by: props.filters?.sort_by || 'id',
	sort_dir: props.filters?.sort_dir || 'asc',
	...props.filters,
} as Record<string, any>)

// Przechowuje ID aktualnie zaznaczonych wierszy
const selectedIds = ref<number[]>([])

// Sprawdza, czy wszyscy użytkownicy z obecnej strony są zaznaczeni
const isAllSelected = computed(() => checkIfAllSelected(rows.value, selectedIds.value))

// Unika wycina ref @click=""
const triggerDelete = () => {
	handleBulkDelete(routeUrl, selectedIds)
}

// Watch
useTableWatcher(tableState, routeUrl, updateTableData)

// Bezpieczna synchronizacja zwrotna z serwera
// router.on('success', (event) => {
// 	const newFilters = event.detail.page.props.filters as any
// 	if (newFilters) {
// 		// Blokujemy reaktywność watchera na chwilę przepisując dane
// 		tableState.value.sort_by = newFilters.sort_by || 'id'
// 		tableState.value.sort_dir = newFilters.sort_dir || 'asc'
// 		// filters
// 	}
// })
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
						@click="triggerDelete"
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
							@click="col.sortable ? handleSort(col, toRef(tableState)) : null"
							:class="[
								col.sortable ? 'cursor-pointer select-none hover:bg-gray-100' : '',
								'px-3 py-3.5 text-left text-sm font-semibold text-gray-900 transition-colors duration-150',
							]"
						>
							<div class="flex items-center space-x-1">
								<!-- Jeśli kolumna ma funkcję render (np. masz checkbox nagłówka)-->
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
