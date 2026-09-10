<!-- resources/js/Components/UserStatusBadge.vue -->
<script setup>
defineProps({ active: Boolean });
</script>

<template>
    <span :class="active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" class="inline-flex rounded-full px-2 text-xs leading-5 font-semibold">
        {{ active ? 'Aktywny' : 'Nieaktywny' }}
    </span>
</template>
