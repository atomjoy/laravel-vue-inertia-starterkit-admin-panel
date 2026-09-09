<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { MailWarning, ShieldCheck } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

defineProps<{
	type: 'email' | '2fa'
	verifiedAt: string | null
	twoFactorConfirmedAt: string | null
}>()
</script>

<template>
	<template v-if="type === 'email'">
		<Badge
			v-if="verifiedAt"
			variant="secondary"
			class="border-none bg-green-500/10 text-green-700 hover:bg-green-500/10 dark:bg-green-500/20 dark:text-green-400"
		>
			{{ t('Verified') }}
		</Badge>
		<Badge
			v-else
			variant="outline"
			class="gap-1 border-amber-200 bg-amber-500/5 text-amber-600 dark:border-amber-800"
		>
			<MailWarning class="h-3 w-3" /> {{ t('Unverified') }}
		</Badge>
	</template>

	<template v-if="type === '2fa'">
		<span
			v-if="twoFactorConfirmedAt"
			class="flex items-center gap-1 text-xs font-medium text-lime-600 dark:text-lime-400"
		>
			<ShieldCheck class="h-4 w-4 text-lime-500" /> {{ t('Enabled') }}
		</span>
		<span v-else class="text-muted-foreground text-xs">{{ t('Disabled') }}</span>
	</template>
</template>
