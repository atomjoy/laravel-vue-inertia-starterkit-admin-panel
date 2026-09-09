<script setup lang="ts">
import { Link } from '@inertiajs/vue3'
import { MoreHorizontal, Eye, Edit, Trash2, ShieldAlert } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const routeUrl = '/admin/users'

defineProps<{
	userId: number
}>()

defineEmits<{
	(e: 'delete', id: number): void
}>()
</script>

<template>
	<DropdownMenu>
		<DropdownMenuTrigger as-child>
			<Button variant="ghost" class="h-8 w-8 p-0">
				<span class="sr-only">{{ t('Open menu') }}</span>
				<MoreHorizontal class="h-4 w-4" />
			</Button>
		</DropdownMenuTrigger>
		<DropdownMenuContent align="end" class="z-50 w-40">
			<DropdownMenuLabel>{{ t('Actions') }}</DropdownMenuLabel>
			<DropdownMenuSeparator />
			<DropdownMenuItem as-child>
				<Link
					:href="routeUrl + `/${userId}`"
					class="flex w-full cursor-pointer items-center gap-2"
				>
					<Eye class="text-muted-foreground h-3.5 w-3.5" /> {{ t('Details') }}
				</Link>
			</DropdownMenuItem>
			<DropdownMenuItem as-child>
				<Link
					:href="routeUrl + `/${userId}/edit`"
					class="flex w-full cursor-pointer items-center gap-2"
				>
					<Edit class="text-muted-foreground h-3.5 w-3.5" /> {{ t('Edit') }}
				</Link>
			</DropdownMenuItem>

			<!-- LINK DO RÓL Z USER ID -->
			<DropdownMenuItem as-child>
				<Link
					:href="`/admin/roles/${userId}/permissions`"
					class="flex w-full cursor-pointer items-center gap-2"
				>
					<ShieldAlert class="text-muted-foreground h-3.5 w-3.5" /> {{ t('Permissions') }}
				</Link>
			</DropdownMenuItem>

			<DropdownMenuSeparator />
			<DropdownMenuItem
				class="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
				@click="$emit('delete', userId)"
			>
				<div class="flex w-full items-center gap-2">
					<Trash2 class="h-3.5 w-3.5" /> {{ t('Delete') }}
				</div>
			</DropdownMenuItem>
		</DropdownMenuContent>
	</DropdownMenu>
</template>
