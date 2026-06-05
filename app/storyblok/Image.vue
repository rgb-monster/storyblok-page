<script setup>
    defineProps({blok: Object});
</script>

<template>
    <img class="section-image" v-editable="blok" :src="blok.image?.filename" :alt="blok.image?.alt" />
</template>
