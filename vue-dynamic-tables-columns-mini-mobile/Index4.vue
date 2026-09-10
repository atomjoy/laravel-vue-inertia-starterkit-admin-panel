<script setup lang="ts">
import AdminLayout from '@/layouts/panel/AdminLayout.vue'
import Pagination from './Pagination.vue'
import { useI18n } from 'vue-i18n'
import { ref, computed } from 'vue'
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

// Przechowuje ID aktualnie zaznaczonych wierszy
const selectedIds = ref<number[]>([])

// Sprawdza, czy wszyscy użytkownicy z obecnej strony są zaznaczeni
const isAllSelected = computed(() => checkIfAllSelected(rows.value, selectedIds.value))

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
	search: props.filters?.search || '',
	...props.filters,
} as Record<string, any>)

// Funkcje rozwiązują problem z typowaniem/rozpakowywaniem refów w template
const triggerDelete = () => {
	handleBulkDelete(routeUrl, selectedIds)
}

const triggerSelect = (col: any) => {
	col.sortable ? handleSort(col, tableState) : null
}

// Synchronizujący stan tabeli z URL za pomocą Inertia
useTableWatcher(tableState, routeUrl, updateTableData)
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
						class="border-input m-1 block w-full rounded-md border p-2 px-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
					/>
				</div>
			</div>

			<!-- Pasek masowych akcji -->
			<div
				v-if="selectedIds.length > 0"
				class="mb-4 flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 transition-all duration-200"
			>
				<span class="text-sm font-medium text-gray-700">
					{{ t('Selected rows') }}
					<strong class="font-bold">{{ selectedIds.length }}</strong>
				</span>

				<div class="flex items-center space-x-3">
					<button
						@click="triggerDelete"
						class="inline-flex items-center rounded-md border border-transparent bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors duration-150 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
					>
						Usuń zaznaczone
					</button>
				</div>
			</div>

			<main>
				<!-- WIDOK MOBILNY (KARTY) -->
				<div class="block space-y-4 md:hidden">
					<!-- Mobilne sterowanie: Zaznacz wszystko oraz Sortowanie -->
					<div class="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
						<!-- Nagłówek mobilny z opcją Select All -->
						<div
							v-if="columns.some((col) => col.key === 'id' && col.render)"
							class="flex items-center space-x-2 border-b border-gray-200 pb-3"
						>
							<template v-for="col in columns" :key="'mob-hdr-' + col.key">
								<div
									v-if="col.key === 'id' && col.render"
									class="flex items-center"
								>
									<component :is="col.render(undefined, {} as User)" />
									<span class="ml-2 text-sm font-semibold text-gray-900">{{
										t('Select all')
									}}</span>
								</div>
							</template>
						</div>

						<!-- Mobilny Select do sortowania (id, name, created_at) -->
						<div class="flex flex-col space-y-1.5">
							<label
								for="mobile-sort"
								class="text-xs font-semibold tracking-wider text-gray-500"
							>
								{{ t('Sort') }}
							</label>
							<div class="flex space-x-2">
								<select
									id="mobile-sort"
									:value="tableState?.sort_by"
									@change="
										triggerSelect({
											key: ($event.target as HTMLSelectElement).value,
											sortable: true,
										})
									"
									class="block w-full rounded-md border-gray-300 bg-white py-2 pr-10 pl-3 text-sm focus:outline-none"
								>
									<option
										v-for="col in columns.filter((c) => c.sortable)"
										:key="col.key"
										:value="col.key"
									>
										{{ t(col.label) }}
									</option>
								</select>

								<!-- Przełącznik kierunku (wykorzystuje istniejącą logikę zmiany kierunku przy ponownym kliknięciu tego samego klucza) -->
								<button
									v-if="tableState?.sort_by"
									@click="
										triggerSelect({ key: tableState.sort_by, sortable: true })
									"
									type="button"
									class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
								>
									<span>{{ tableState.sort_dir === 'asc' ? '▲' : '▼' }}</span>
								</button>
							</div>
						</div>
					</div>

					<!-- Stan ładowania danych -->
					<div
						v-if="loading"
						class="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500"
					>
						{{ t('Loading...') }}
					</div>

					<!-- Brak wyników -->
					<div
						v-else-if="rows.length === 0"
						class="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500"
					>
						{{ t('No data to display.') }}
					</div>

					<!-- Lista kart danych -->
					<template v-else>
						<div
							v-for="(row, rowIndex) in rows"
							:key="'card-' + (row.id ?? rowIndex)"
							class="space-y-3 rounded-lg border bg-white p-4 transition-colors duration-150 hover:bg-gray-50"
							:class="
								selectedIds.includes(row.id) ? 'border-blue-500' : 'border-gray-200'
							"
						>
							<!-- Iteracja po kolumnach wewnątrz pojedynczej karty -->
							<div
								v-for="col in columns"
								:key="'card-col-' + col.key"
								class="w-full border-b border-gray-100 pb-2 last:border-0 last:pb-0"
							>
								<!-- Etykieta pola (ukryta dla checkboxa ID, żeby nie dublować) -->
								<!-- <label
									class="w-full pt-0.5 text-xs font-medium tracking-wider text-gray-400"
								>
									{{ col.key !== 'id' ? col.label : '' }}
								</label> -->

								<!-- Wartość / Komponent -->
								<div class="text-sm font-medium text-gray-900">
									<template
										v-if="col.render"
										:class="{ 'text-right': col.key == 'actions' }"
									>
										<component
											:is="col.render(getCellValue(row, col.key), row)"
										/>
									</template>
									<template v-else>
										{{ getCellValue(row, col.key) ?? '' }}
									</template>
								</div>
							</div>
						</div>
					</template>
				</div>

				<!-- WIDOK DESKTOPOWY (TRADYCYJNA TABELA) -->
				<div class="hidden overflow-x-auto md:block">
					<table class="min-w-full divide-y divide-gray-300">
						<thead class="bg-gray-50">
							<tr>
								<th
									v-for="col in columns"
									:key="col.key"
									@click="triggerSelect(col)"
									:class="[
										col.sortable
											? 'cursor-pointer select-none hover:bg-gray-100'
											: '',
										'px-3 py-3.5 text-left text-sm font-semibold text-gray-900 transition-colors duration-150',
									]"
								>
									<div class="flex items-center space-x-1">
										<template v-if="col.key === 'id' && col.render">
											<component :is="col.render(undefined, {} as User)" />
										</template>
										<template v-else>
											<span>{{ col.label }}</span>
										</template>

										<span v-if="col.sortable" class="text-xs text-gray-400">
											<template v-if="tableState?.sort_by === col.key">
												{{ tableState?.sort_dir === 'asc' ? '▲' : '▼' }}
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
							<tr v-if="loading">
								<td
									:colspan="columns.length"
									class="px-3 py-8 text-center text-sm text-gray-500"
								>
									{{ t('Loading...') }}
								</td>
							</tr>

							<tr v-else-if="rows.length === 0">
								<td
									:colspan="columns.length"
									class="px-3 py-8 text-center text-sm text-gray-500"
								>
									{{ t('No data to display.') }}
								</td>
							</tr>

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
											<component
												:is="col.render(getCellValue(row, col.key), row)"
											/>
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
			</main>
		</div>

		<!-- Sekcja paginacji -->
		<div class="pagination mt-4">
			<Pagination :links="payload.links" :total="payload.total" />
		</div>
	</AdminLayout>
</template>
