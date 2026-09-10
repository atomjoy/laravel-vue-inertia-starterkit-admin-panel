import type { Component, VNode, Ref } from 'vue'

export interface Identifiable {
	id: number
}

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
export interface ColumnOptions {
	basePath: string
	selectedIds: Ref<Array<number>>
	isAllSelected: Ref<boolean>
	rows: Ref<any>
}

export interface TableState {
	[key: string]: any
}

export interface TableColumn {
	key: string
	label: string
	sortable?: boolean
	render?: (value: any, row: User) => VNode | Component | string | number
}
