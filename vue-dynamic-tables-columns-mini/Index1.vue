<script setup lang="ts" generic="T">
import AdminLayout from '@/layouts/panel/AdminLayout.vue'
import Pagination from '@/components/table/Pagination.vue'
import StatusBadge from './StatusBadge.vue'
import ActionsDropdown from './ActionsDropdown.vue'
import { ref, computed, h } from 'vue'
import { Component, VNode } from 'vue'
import { LaravelPaginationPayload, RoleFilterOption, TableFilters, User } from '@/types/pages'
import { useI18n } from 'vue-i18n'

// Locales
const { t } = useI18n()

// Propsy, eventy
const props = withDefaults(
	defineProps<{
		payload: LaravelPaginationPayload
		roles: RoleFilterOption[]
		filters: TableFilters
		loading?: boolean
		sortBy?: string
		sortDirection?: 'asc' | 'desc'
	}>(),
	{
		loading: false,
		sortBy: 'id',
		sortDirection: 'asc',
	},
)

// Admin layout
const title = 'Users'
const description = 'Manage user accounts, email verification, and 2FA security.'
const routeUrl = '/admin/users'

// Dane
const rolesList = ref(props.roles)
const currentUsers = computed(() => props.payload.data)

// Columns
interface ColumnOptions {
	// t: Composer['t']
	basePath: string
	selectedIds: Array<number>
	isAllSelected: boolean
}

interface TableColumn<T> {
	key: string
	label: string
	sortable?: boolean
	render?: (value: any, row: T) => VNode | Component | string | number
}

const rows = computed(() => props.payload.data)

const getUserColumns = (options: ColumnOptions): TableColumn<User>[] => [
	{
		key: 'id',
		label: 'ID',
		render: () =>
			h('input', {
				type: 'checkbox',
				ariaLabel: 'Select all',
				checked: options.isAllSelected,
				'onUpdate:checked': (value: boolean) => options.selectedIds.includes(1),
			}),
		sortable: true,
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
		render: (row: User) =>
			h(ActionsDropdown, {
				basePath: options.basePath,
				row: row,
			}),
		sortable: false,
	},
]

const columns: TableColumn<User>[] = getUserColumns({
	basePath: '/admin/table',
	selectedIds: [1, 2, 3],
	isAllSelected: false,
})

const emit = defineEmits<{
	(e: 'sort', payload: { field: string; direction: 'asc' | 'desc' }): void
}>()

const handleSort = <T,>(col: TableColumn<T>) => {
	if (!col.sortable) return
	const isCurrentField = props.sortBy === col.key
	const direction = isCurrentField && props.sortDirection === 'asc' ? 'desc' : 'asc'
	emit('sort', { field: col.key, direction })
	console.log('Sort', { field: col.key, direction })
}

const getCellValue = <T,>(row: T, key: string): any => {
	// Sprawdzamy, czy klucz fizycznie istnieje w tym konkretnym obiekcie row
	if (row && typeof row === 'object' && key in row) {
		return (row as any)[key]
	}
	return '' // Zwróć pusty string dla kluczy typu 'actions', 'buttons' itp.
}
</script>

<template>
	<AdminLayout :title="title" :description="description" :route-url="routeUrl">
		<div class="table">
			<h1>Table</h1>

			<table class="min-w-full divide-y divide-gray-300">
				<thead class="bg-gray-50">
					<tr>
						<th
							v-for="col in columns"
							:key="col.key"
							@click="handleSort(col)"
							:class="[
								col.sortable ? 'cursor-pointer select-none hover:bg-gray-100' : '',
								'px-3 py-3.5 text-left text-sm font-semibold text-gray-900 transition-colors duration-150',
							]"
						>
							<div class="flex items-center space-x-1">
								<span>{{ col.label }}</span>

								<!-- Używamy props.sortBy oraz props.sortDirection -->
								<span v-if="col.sortable" class="text-xs text-gray-400">
									<template v-if="props.sortBy === col.key">
										{{ props.sortDirection === 'asc' ? '▲' : '▼' }}
										<!-- {{ props.sortDirection === 'asc' ? '↑' : '↓' }} -->
									</template>
									<template v-else>
										<span class="opacity-30">▲▼</span>
									</template>
								</span>
							</div>
						</th>
					</tr>
				</thead>
				<!-- Reszta szablonu tbody pozostaje bez zmian (wykorzystuje bezpośrednie zmienne rows, loading, columns z defineProps) -->
				<tbody class="relative divide-y divide-gray-200 bg-white">
					<template v-if="loading">
						<TableSkeletonRow v-for="n in 5" :key="n" :columns-count="columns.length" />
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
									<component
										:is="col.render(row?.[col.key as keyof User], row)"
									/>
								</template>
								<template v-else>
									{{ row?.[col.key as keyof User] }}
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
