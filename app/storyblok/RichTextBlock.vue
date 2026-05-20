<script setup>
    let props = defineProps({blok: Object});
    let resolvedRichText = computed(() => {
        return renderRichText(props.blok.contents);
    });
</script>

<template>
    <div v-editable="blok" :style="{'text-align': blok.align}" v-html="resolvedRichText" />
</template>
