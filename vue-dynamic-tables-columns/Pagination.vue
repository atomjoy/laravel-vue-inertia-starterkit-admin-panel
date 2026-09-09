<script setup lang="ts">
import { computed } from 'vue'
import { Link } from '@inertiajs/vue3'
import { buttonVariants } from '@/components/ui/button'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

interface PaginationLink {
	url: string | null
	label: string
	active: boolean
}

const props = defineProps<{
	links: PaginationLink[]
	total: number
}>()

const cleanLabel = (label: string) => {
	if (label.includes('Previous')) return '&lt;'
	if (label.includes('Next')) return '&gt;'
	return label
}

const totalPages = computed(() => {
	return props.links.length > 2 ? props.links.length - 2 : 1
})

const currentPage = computed(() => {
	const activeLink = props.links.find((link) => link.active)
	if (activeLink) {
		const pageNum = parseInt(activeLink.label)
		if (!isNaN(pageNum)) return pageNum
	}

	const nextLinkIndex = props.links.findIndex((link) => link.label.includes('Next'))
	if (nextLinkIndex !== -1 && props.links[nextLinkIndex - 1]) {
		const pageNum = parseInt(props.links[nextLinkIndex - 1].label)
		if (!isNaN(pageNum)) return pageNum
	}
	return 1
})

const firstPageUrl = computed(() => {
	if (props.links.length > 2 && props.links[1]) {
		return props.links[1].url
	}
	return null
})

const lastPageUrl = computed(() => {
	if (props.links.length > 2 && props.links[props.links.length - 2]) {
		return props.links[props.links.length - 2].url
	}
	return null
})

const processedLinks = computed(() => {
	if (props.links.length <= 3) return props.links

	const firstLink = props.links[0]
	const lastLink = props.links[props.links.length - 1]
	const pageLinks = props.links.slice(1, -1)

	const activeIndex = pageLinks.findIndex((link) => link.active)
	const currentPageIndex = activeIndex !== -1 ? activeIndex : 0

	let start = Math.max(0, currentPageIndex - 2)
	let end = Math.min(pageLinks.length, start + 5)

	if (end - start < 5) {
		start = Math.max(0, end - 5)
	}

	const visiblePages = pageLinks.slice(start, end)
	return [firstLink, ...visiblePages, lastLink]
})
</script>

<template>
	<CardFooter
		class="flex flex-col items-center justify-between gap-4 border-t px-0 py-4 sm:flex-row md:px-6"
	>
		<div class="text-muted-foreground order-2 flex items-center gap-2 text-sm sm:order-1">
			<span>
				{{ t('Total') }}: <span class="text-foreground font-medium">{{ total }}</span>
				{{ t('records') }}</span
			>
			<span class="text-muted-foreground/40">|</span>
			<span>
				{{ t('Page') }}
				<span class="text-foreground font-medium">{{ currentPage }}</span> {{ t('from') }}
				<span class="text-foreground font-medium">{{ totalPages }}</span></span
			>
		</div>
		<div
			class="order-1 flex max-w-full items-center space-x-1 overflow-x-auto pb-2 sm:order-2 sm:pb-0"
		>
			<span
				v-if="currentPage === 1 || !firstPageUrl"
				class="text-muted-foreground/50 border-muted bg-muted/20 inline-flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-md border text-sm font-medium whitespace-nowrap select-none"
				>&lt;&lt;</span
			>
			<Link
				v-else
				:href="firstPageUrl"
				:class="[
					buttonVariants({ variant: 'outline', size: 'sm' }),
					'h-8 w-8 p-0 text-sm font-medium whitespace-nowrap',
				]"
				>&lt;&lt;</Link
			>

			<template v-for="(link, index) in processedLinks" :key="index">
				<span
					v-if="!link.url"
					class="text-muted-foreground/50 border-muted bg-muted/20 inline-flex h-8 cursor-not-allowed items-center justify-center rounded-md border px-3 text-sm font-medium whitespace-nowrap select-none"
					v-html="cleanLabel(link.label)"
				/>
				<Link
					v-else
					:href="link.url"
					:class="[
						buttonVariants({
							variant: link.active ? 'default' : 'outline',
							size: 'sm',
						}),
						'h-8 text-sm font-medium whitespace-nowrap',
						link.label.includes('Previous') || link.label.includes('Next')
							? 'px-3'
							: 'w-8 p-0',
					]"
					v-html="cleanLabel(link.label)"
				/>
			</template>

			<span
				v-if="currentPage === totalPages || !lastPageUrl"
				class="text-muted-foreground/50 border-muted bg-muted/20 inline-flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-md border text-sm font-medium whitespace-nowrap select-none"
				>&gt;&gt;</span
			>
			<Link
				v-else
				:href="lastPageUrl"
				:class="[
					buttonVariants({ variant: 'outline', size: 'sm' }),
					'h-8 w-8 p-0 text-sm font-medium whitespace-nowrap',
				]"
				>&gt;&gt;</Link
			>
		</div>
	</CardFooter>
</template>
