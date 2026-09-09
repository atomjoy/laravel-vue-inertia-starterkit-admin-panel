import { watch, Ref } from 'vue'

interface TableState {
	[key: string]: any
}

export const useTableWatcher = (
	tableState: Ref<TableState>,
	routeUrl: string,
	updateTableData: (url: string, state: Ref<TableState>) => void,
) => {
	let searchTimeout: ReturnType<typeof setTimeout>

	watch(
		tableState,
		(newState, oldState) => {
			clearTimeout(searchTimeout)

			// Jeśli zmieniła się fraza wyszukiwania (debounce)
			if (newState.search !== oldState?.search) {
				searchTimeout = setTimeout(() => {
					console.log('Szukam frazy z debounce:', newState.search)
					tableState.value.page = 1
					updateTableData(routeUrl, tableState)
				}, 400)
			} else {
				updateTableData(routeUrl, tableState)
			}
		},
		{ deep: true },
	)
}
