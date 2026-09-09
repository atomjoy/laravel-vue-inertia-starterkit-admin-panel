<!--
// How to
const selectedStatus = defineModel<string[]>({ default: () => [] })
<StatusFilter
    v-model="selectedStatus"
    :options="[
        { value: 'active', label: 'active', count: 1979 },
        { value: 'inactive', label: 'inactive', count: 69 },
    ]"
/>
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus, Search, Check } from '@lucide/vue'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'

interface StatusOption {
	value: string
	label: string
	count: number
}

const props = defineProps<{
	options: StatusOption[]
	label: string | 'Status'
}>()

// Dwukierunkowe wiązanie tablicy zaznaczonych ról (v-model)
const selectedRoles = defineModel<string[]>({ default: () => [] })
const searchQuery = ref('')
const isOpen = ref(false)

// Filtrowanie opcji na podstawie wpisanej frazy
const filteredOptions = computed(() => {
	return props.options.filter((option) =>
		option.label.toLowerCase().includes(searchQuery.value.toLowerCase()),
	)
})

// Logika zaznaczania / odznaczania checkboxa
const toggleRole = (value: string) => {
	console.log('StatusFilter', value)
	const index = selectedRoles.value.indexOf(value)
	if (index > -1) {
		selectedRoles.value = selectedRoles.value.filter((role) => role !== value)
	} else {
		selectedRoles.value = [...selectedRoles.value, value]
	}
}

// Czyszczenie wybranych filtrów
const clearFilters = () => {
	selectedRoles.value = []
}
</script>

<template>
	<Popover v-model:open="isOpen">
		<PopoverTrigger as-child>
			<Button
				variant="outline"
				size="sm"
				class="col-span-2 h-10 w-full gap-2 border-0 px-3 shadow-none outline-0 md:col-span-1 md:w-auto md:max-w-60 md:flex-1"
			>
				<Plus class="h-4 w-4" />
				<span class="font-medium">{{ label }}</span>

				<!-- Licznik wybranych elementów w badge'u -->
				<template v-if="selectedRoles.length > 0">
					<Separator orientation="vertical" class="mx-1 h-4" />
					<span
						class="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs font-semibold"
					>
						{{ selectedRoles.length }}
					</span>
				</template>
			</Button>
		</PopoverTrigger>

		<PopoverContent class="w-64 p-0" align="start">
			<!-- Wyszukiwarka wewnątrz popovera -->
			<div class="relative border-b p-2">
				<Search
					class="text-muted-foreground absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2"
				/>
				<Input
					v-model="searchQuery"
					placeholder="Roles"
					class="h-8 border-0 pl-8 text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
				/>
			</div>

			<!-- Lista ról do wyboru -->
			<div class="max-h-60 space-y-0.5 overflow-y-auto p-1">
				<div
					v-for="option in filteredOptions"
					:key="option.value"
					@click.stop="toggleRole(option.value)"
					class="hover:bg-accent hover:text-accent-foreground flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm"
				>
					<div class="flex items-center gap-2" :for="'role-' + option.value">
						<!-- Dedykowany checkbox -->
						<div
							class="border-primary flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border shadow transition-colors"
							:class="
								selectedRoles.includes(option.value)
									? 'bg-primary text-primary-foreground'
									: 'bg-transparent'
							"
						>
							<Check
								v-if="selectedRoles.includes(option.value)"
								class="h-3 w-3 stroke-3"
							/>
						</div>
						<label class="truncate">
							{{ option.label }}
						</label>
					</div>

					<!-- Liczba przypisanych rekordów po prawej stronie -->
					<span class="text-muted-foreground ml-auto text-xs tabular-nums">
						{{ option.count }}
					</span>
				</div>

				<div
					v-if="filteredOptions.length === 0"
					class="text-muted-foreground p-3 text-center text-xs"
				>
					No roles found.
				</div>
			</div>

			<!-- Stopka czyszcząca filtry -->
			<template v-if="selectedRoles.length > 0">
				<Separator />
				<div class="p-1">
					<Button
						variant="ghost"
						class="h-8 w-full justify-center text-xs font-normal"
						@click="clearFilters"
					>
						Clear filters
					</Button>
				</div>
			</template>
		</PopoverContent>
	</Popover>
</template>
