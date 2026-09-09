import StatusBadge from './StatusBadge.vue'
import ActionsDropdown from './ActionsDropdown.vue'
import { router } from '@inertiajs/vue3'
import { Ref, h } from 'vue'
import { User, ColumnOptions, TableColumn, Identifiable } from './types'

export const getUserColumns = (options: ColumnOptions): TableColumn[] => [
	{
		key: 'id',
		label: 'ID',
		render: (id, row: User) =>
			h('input', {
				type: 'checkbox',
				checked:
					id === undefined
						? options.isAllSelected
						: options.selectedIds.value.includes(row.id),
				onChange: () => {
					if (id === undefined) {
						toggleAll(options.isAllSelected, options.selectedIds, options.rows)
					} else {
						toggleRow(row.id, options.selectedIds)
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

// Pobierz zaznaczone elementy
export const checkIfAllSelected = (rows: Identifiable[], selectedIds: number[]): boolean => {
	if (rows.length === 0) return false
	return rows.every((row) => selectedIds.includes(row.id))
}

// Bezpieczne pobieranie wartości
export const getCellValue = (row: User, key: string): any => {
	if (row && typeof row === 'object' && key in row) {
		return (row as Record<string, any>)[key]
	}
	return undefined
}

// Funkcja obsługująca kliknięcie głównego checkboxa w nagłówku
export const toggleAll = (
	isAllSelected: boolean,
	selectedIds: Ref<Array<number>>,
	rows: Ref<any>,
) => {
	if (isAllSelected) {
		const rowIds = rows.value.map((row: any) => row.id)
		selectedIds.value = selectedIds.value.filter((id: any) => !rowIds.includes(id))
	} else {
		rows.value.forEach((row: any) => {
			if (!selectedIds.value.includes(row.id)) {
				selectedIds.value.push(row.id)
			}
		})
	}
}

// Funkcja obsługująca pojedynczy checkbox w wierszu
export const toggleRow = (id: number, selectedIds: Ref<Array<number>>) => {
	const index = selectedIds.value.indexOf(id)
	if (index > -1) {
		selectedIds.value.splice(index, 1)
	} else {
		selectedIds.value.push(id)
	}
}

// Sort tylko zmienia stan, watcher zajmie się resztą!
export const handleSort = (col: TableColumn, tableState: Ref<Record<string, any>>) => {
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
export const handleFilterChange = (tableState: Ref<Record<string, any>>) => {
	tableState.value.page = 1
}

// Odśwież dane button
export const refreshTable = () => {
	router.reload({
		only: ['payload'],
	})
}

// Masowe usuwanie / akcja na zaznaczonych ID
export const handleBulkDelete = (routeUrl: string, selectedIds: Ref<number[]>) => {
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
				console.log('Data deleted.')
			},
		},
	)
}

export const updateTableData = (routeUrl: string, tableState: Ref<Record<string, any>>) => {
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
