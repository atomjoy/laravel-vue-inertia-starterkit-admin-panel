<script setup lang="ts">
import { Link } from '@inertiajs/vue3'
import { ref, watch, computed } from 'vue'
import { router } from '@inertiajs/vue3'
import { Plus, Search, Trash2 } from '@lucide/vue'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import FlashMessages from './FlashMessages.vue'
import UserStatusBadge from './UserStatusBadge.vue'
import UserActionsDropdown from './UserActionsDropdown.vue'
import SortButton from './SortButton.vue'
import Pagination from './Pagination.vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

interface Role {
	id: number
	name: string
	guard_name: string
}

interface User {
	id: number
	name: string
	email: string
	email_verified_at: string | null
	created_at: string
	updated_at: string
	two_factor_confirmed_at: string | null
	roles: Role[]
	// roles: { id: number; name: string }[]
}

interface PaginationLink {
	url: string | null
	label: string
	active: boolean
}

interface LaravelPaginationPayload {
	current_page: number
	data: User[]
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

const routeUrl = '/admin/users'
const props = defineProps<{ payload: LaravelPaginationPayload }>()
const urlParams = new URLSearchParams(window.location.search)
const searchQuery = ref(urlParams.get('search') || '')
const filterVerified = ref(urlParams.get('verified') || 'all')
const filter2FA = ref(urlParams.get('two_factor') || 'all')
const perPage = ref(urlParams.get('per_page') || '10')
const sortBy = ref(urlParams.get('sort_by') || 'id')
const sortDir = ref(urlParams.get('sort_dir') || 'desc')
const selectedIds = ref<number[]>([])

const handleSort = (column: string) => {
	if (sortBy.value === column) {
		sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
	} else {
		sortBy.value = column
		sortDir.value = 'asc'
	}
}

const isAllSelected = computed(() => {
	if (props.payload.data.length === 0) return false
	return props.payload.data.every((user) => selectedIds.value.includes(user.id))
})

const toggleSelectAll = () => {
	if (isAllSelected.value) {
		selectedIds.value = selectedIds.value.filter(
			(id) => !props.payload.data.some((user) => user.id === id),
		)
	} else {
		const currentIds = props.payload.data.map((user) => user.id)
		selectedIds.value = [...new Set([...selectedIds.value, ...currentIds])]
	}
}

const toggleSelectUser = (id: number) => {
	if (selectedIds.value.includes(id)) {
		selectedIds.value = selectedIds.value.filter((item) => item !== id)
	} else {
		selectedIds.value.push(id)
	}
}

const handleSingleDelete = (id: number) => {
	if (confirm(t('Are you sure you want to delete this user?'))) {
		router.delete(routeUrl + `/${id}`, {
			preserveScroll: true,
		})
	}
}

const handleBulkDelete = () => {
	if (
		confirm(t('Are you sure you want to remove the selected users?' + selectedIds.value.length))
	) {
		router.post(
			routeUrl + '/bulk-delete',
			{ ids: selectedIds.value },
			{
				onSuccess: () => {
					selectedIds.value = []
				},
			},
		)
	}
}

watch([searchQuery, filterVerified, filter2FA, perPage, sortBy, sortDir], () => {
	router.get(
		routeUrl,
		{
			search: searchQuery.value,
			filter_verified: filterVerified.value, // Zmieniono klucz, aby nie kolidował z kolumną
			filter_2fa: filter2FA.value,
			per_page: perPage.value,
			sort_by: sortBy.value,
			sort_dir: sortDir.value,
		},
		{
			preserveState: true,
			preserveScroll: true,
			replace: true,
		},
	)
})

const getAvatarFallback = (name: string) => (name ? name.substring(0, 2).toUpperCase() : 'UN')

const formatDate = (dateString: string) =>
	new Date(dateString).toLocaleDateString('pl-PL', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	})
</script>

<template>
	<div class="w-full space-y-6 p-6">
		<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div class="space-y-1">
				<h1 class="text-3xl font-bold tracking-tight">{{ t('Users') }}</h1>
				<p class="text-muted-foreground text-sm">
					{{ t('Manage user accounts, email verification, and 2FA security.') }}
				</p>
			</div>
			<Link
				:href="routeUrl + '/create'"
				:class="buttonVariants({ variant: 'default' })"
				class="gap-2 self-start sm:self-auto"
			>
				<Plus class="h-4 w-4" /> {{ t('Add user') }}
			</Link>
		</div>

		<FlashMessages />

		<div
			v-if="selectedIds.length > 0"
			class="bg-muted/50 flex items-center justify-between rounded-lg border border-dashed p-4"
		>
			<span class="text-sm font-medium">
				{{ t('Selected users:') }}
				<span class="text-primary font-bold">{{ selectedIds.length }}</span>
			</span>
			<Button variant="destructive" size="sm" class="gap-2" @click="handleBulkDelete">
				<Trash2 class="h-4 w-4" /> {{ t('Delete selected') }}
			</Button>
		</div>

		<Card class="border-0 shadow-none md:border">
			<CardHeader class="px-0 pb-4 md:px-6">
				<CardTitle>{{ t('All users') }}</CardTitle>
				<CardDescription>
					{{ t('You are displaying') }} {{ payload.from }}-{{ payload.to }}
					{{ t('from') }} {{ payload.total }} {{ t('users') }}.
				</CardDescription>
				<!-- KONTENER: Na mobile Grid (2 kolumny), od md: przechodzi w elastyczny rząd (Flex) -->
				<div class="grid grid-cols-2 gap-3 pt-4 md:flex md:flex-wrap md:items-center">
					<!-- 1. Wyszukiwarka: Na mobile zajmuje 1 z 2 kolumn, na desktopie odzyskuje swoje wymiary -->
					<div class="relative col-span-1 w-full md:max-w-sm md:flex-1">
						<Search
							class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
						/>
						<Input
							v-model="searchQuery"
							type="text"
							:placeholder="t('Search by name or email')"
							class="focus-visible:border-input h-10 px-3 py-2 pl-9 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
						/>
					</div>

					<!-- 2. Select Weryfikacja: Na mobile zajmuje 1 z 2 kolumn -->
					<select
						v-model="filterVerified"
						class="border-input bg-background text-foreground col-span-1 h-10 w-full rounded-md border px-3 py-2 text-sm md:max-w-60 md:flex-1"
					>
						<option value="all">{{ t('Verification: All') }}</option>
						<option value="verified">{{ t('Verified') }}</option>
						<option value="unverified">{{ t('Unverified') }}</option>
					</select>

					<!-- 3. Select 2FA: Na mobile rozciąga się na pełną szerokość (col-span-2) -->
					<select
						v-model="filter2FA"
						class="border-input bg-background text-foreground col-span-2 h-10 w-full rounded-md border px-3 py-2 text-sm md:max-w-60 md:flex-1"
					>
						<option value="all">{{ t('2fa status: All') }}</option>
						<option value="enabled">{{ t('2FA: Enabled') }}</option>
						<option value="disabled">{{ t('2FA: Disabled') }}</option>
					</select>

					<!-- 4. Select PerPage: Na mobile na pełną szerokość (col-span-2), na desktopie ucieka na prawo (md:ml-auto) -->
					<select
						v-model="perPage"
						class="border-input bg-background text-foreground col-span-2 h-10 w-full rounded-md border px-3 py-2 text-sm md:ml-auto md:w-auto"
					>
						<option value="5">{{ t('Show:') }} 5</option>
						<option value="10">{{ t('Show:') }} 10</option>
						<option value="25">{{ t('Show:') }} 25</option>
						<option value="50">{{ t('Show:') }} 50</option>
					</select>
				</div>
			</CardHeader>

			<CardContent class="p-0">
				<!-- Widok Mobilny (Karty) -->
				<div class="flex flex-col space-y-4 md:hidden">
					<div
						v-for="user in payload.data"
						:key="user.id"
						class="bg-card text-card-foreground hover:bg-muted/50 space-y-4 rounded-xl border p-4 shadow-sm transition-colors"
					>
						<div class="flex items-start justify-between gap-2">
							<div class="flex items-center gap-3">
								<input
									type="checkbox"
									:checked="selectedIds.includes(user.id)"
									@change="toggleSelectUser(user.id)"
									class="text-primary h-4 w-4 rounded border-gray-300"
								/>
								<Avatar class="h-9 w-9 border"
									><AvatarFallback
										class="bg-secondary text-secondary-foreground text-xs font-semibold"
										>{{ getAvatarFallback(user.name) }}</AvatarFallback
									></Avatar
								>
								<div class="flex flex-col">
									<span
										class="text-foreground flex items-center gap-2 text-sm font-medium"
									>
										{{ user.name }}
									</span>
									<span class="text-muted-foreground text-xs">{{
										user.email
									}}</span>
								</div>
							</div>
							<UserActionsDropdown :userId="user.id" @delete="handleSingleDelete" />
						</div>

						<!-- ROLE W WIDOKU MOBILNYM -->
						<div v-if="user.roles.length > 0" class="flex flex-wrap gap-1">
							<span
								v-for="role in user.roles"
								:key="role.id"
								:class="[
									'rounded border px-2 py-0.5 text-[10px] font-medium',
									role.name === 'superadmin'
										? 'border-red-200 bg-red-500/10 text-red-700 dark:border-red-900/50'
										: role.name === 'admin'
											? 'border-amber-200 bg-amber-500/10 text-amber-700 dark:border-amber-900/50'
											: 'bg-secondary text-secondary-foreground',
								]"
							>
								{{ role.name }}
							</span>
						</div>

						<div class="grid grid-cols-2 gap-2 border-t pt-3 text-xs">
							<div>
								<span class="text-muted-foreground mb-1 block">
									{{ t('Verification') }}
								</span>
								<UserStatusBadge
									type="email"
									:verifiedAt="user.email_verified_at"
									:twoFactorConfirmedAt="user.two_factor_confirmed_at"
								/>
							</div>
							<div>
								<span class="text-muted-foreground mb-1 block">
									{{ t('Status 2FA') }}
								</span>
								<UserStatusBadge
									type="2fa"
									:verifiedAt="user.email_verified_at"
									:twoFactorConfirmedAt="user.two_factor_confirmed_at"
								/>
							</div>
						</div>
					</div>
				</div>

				<!-- Widok Desktop (Tabela) -->
				<div class="relative hidden w-full overflow-auto md:block">
					<table class="w-full caption-bottom text-sm">
						<thead class="bg-muted/40 text-muted-foreground border-b font-medium">
							<tr class="transition-colors">
								<th class="h-12 w-12 px-4 text-left align-middle">
									<input
										type="checkbox"
										:checked="isAllSelected"
										@change="toggleSelectAll"
										class="text-primary h-4 w-4 rounded border-gray-300"
									/>
								</th>

								<!-- ID -->
								<th
									@click="handleSort('id')"
									class="hover:bg-muted/80 h-12 w-24 cursor-pointer px-4 text-left align-middle font-medium transition-colors select-none"
								>
									<div class="flex items-center gap-1">
										ID
										<SortButton
											column-field="id"
											:current-sort-by="sortBy"
											:current-sort-dir="sortDir"
										/>
									</div>
								</th>

								<!-- UŻYTKOWNIK -->
								<th
									@click="handleSort('name')"
									class="hover:bg-muted/80 h-12 cursor-pointer px-4 text-left align-middle font-medium transition-colors select-none"
								>
									<div class="flex items-center gap-1">
										{{ t('User') }}
										<SortButton
											column-field="name"
											:current-sort-by="sortBy"
											:current-sort-dir="sortDir"
										/>
									</div>
								</th>

								<!-- ROLE (Bez sortowania, bo to relacja many-to-many) -->
								<th class="h-12 px-4 text-left align-middle font-medium">
									{{ t('Roles') }}
								</th>

								<!-- WERYFIKACJA -->
								<th
									@click="handleSort('email_verified_at')"
									class="hover:bg-muted/80 h-12 cursor-pointer px-4 text-left align-middle font-medium transition-colors select-none"
								>
									<div class="flex items-center gap-1">
										{{ t('Verification') }}
										<SortButton
											column-field="email_verified_at"
											:current-sort-by="sortBy"
											:current-sort-dir="sortDir"
										/>
									</div>
								</th>

								<!-- STATUS 2FA -->
								<th
									@click="handleSort('two_factor_confirmed_at')"
									class="hover:bg-muted/80 h-12 cursor-pointer px-4 text-left align-middle font-medium transition-colors select-none"
								>
									<div class="flex items-center gap-1">
										{{ t('Status 2FA') }}
										<SortButton
											column-field="two_factor_confirmed_at"
											:current-sort-by="sortBy"
											:current-sort-dir="sortDir"
										/>
									</div>
								</th>

								<!-- DOŁĄCZONO -->
								<th
									@click="handleSort('created_at')"
									class="hover:bg-muted/80 h-12 cursor-pointer px-4 text-left align-middle font-medium transition-colors select-none"
								>
									<div class="flex items-center gap-1">
										{{ t('Created') }}
										<SortButton
											column-field="created_at"
											:current-sort-by="sortBy"
											:current-sort-dir="sortDir"
										/>
									</div>
								</th>

								<th class="h-12 w-20 px-4 align-middle font-medium"></th>
							</tr>
						</thead>

						<tbody class="divide-y">
							<tr
								v-for="user in payload.data"
								:key="user.id"
								class="hover:bg-muted/50 transition-colors"
								:class="{ 'bg-muted/30': selectedIds.includes(user.id) }"
							>
								<td class="p-4 align-middle">
									<input
										type="checkbox"
										:checked="selectedIds.includes(user.id)"
										@change="toggleSelectUser(user.id)"
										class="text-primary h-4 w-4 rounded border-gray-300"
									/>
								</td>
								<td
									class="text-muted-foreground p-4 align-middle font-mono text-xs"
								>
									#{{ user.id }}
								</td>
								<td class="p-4 align-middle">
									<div class="flex items-center gap-3">
										<Avatar class="h-9 w-9 border"
											><AvatarFallback
												class="bg-secondary text-secondary-foreground text-xs font-semibold"
												>{{ getAvatarFallback(user.name) }}</AvatarFallback
											></Avatar
										>
										<div class="flex flex-col">
											<span class="text-foreground font-medium">{{
												user.name
											}}</span
											><span class="text-muted-foreground text-xs">{{
												user.email
											}}</span>
										</div>
									</div>
								</td>

								<!-- ELEMENTY RÓL W TABELI (DESKTOP) -->
								<td class="p-4 align-middle">
									<div class="flex max-w-50 flex-wrap gap-1">
										<span
											v-for="role in user.roles"
											:key="role.id"
											:class="[
												'rounded border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
												role.name === 'superadmin'
													? 'border-red-200 bg-red-500/10 text-red-700 dark:border-red-900/50 dark:bg-red-500/20 dark:text-red-400'
													: role.name === 'admin'
														? 'border-amber-200 bg-amber-500/10 text-amber-700 dark:border-amber-900/50 dark:bg-amber-500/20 dark:text-amber-400'
														: 'bg-secondary text-secondary-foreground border-transparent',
											]"
										>
											{{ role.name }}
										</span>
										<span
											v-if="user.roles.length === 0"
											class="text-muted-foreground text-xs"
											>-</span
										>
									</div>
								</td>

								<td class="p-4 align-middle">
									<UserStatusBadge
										type="email"
										:verifiedAt="user.email_verified_at"
										:twoFactorConfirmedAt="user.two_factor_confirmed_at"
									/>
								</td>
								<td class="p-4 align-middle">
									<UserStatusBadge
										type="2fa"
										:verifiedAt="user.email_verified_at"
										:twoFactorConfirmedAt="user.two_factor_confirmed_at"
									/>
								</td>
								<td class="text-muted-foreground p-4 align-middle text-xs">
									{{ formatDate(user.created_at) }}
								</td>
								<td class="p-4 text-right align-middle">
									<UserActionsDropdown
										:userId="user.id"
										@delete="handleSingleDelete"
									/>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</CardContent>

			<Pagination :links="payload.links" :total="payload.total" />
		</Card>
	</div>
</template>
