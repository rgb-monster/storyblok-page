<script setup>
    defineProps({blok: Object});
</script>

<template>
    <main v-editable="blok" :class="blok.colour">
        <StoryblokComponent v-for="currentBlok in blok.body" :key="currentBlok._uid" :blok="currentBlok" />
    </main>
</template>