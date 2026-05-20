<script setup>
    defineProps({blok: Object});
</script>

<template>
    <main v-editable="blok" :class="blok.colour">
        <StoryblokComponent v-for="currentBlok in blok.body" :key="currentBlok._uid" :blok="currentBlok" />
    </main>
</template>

<style lang="css">
    main {
        background: var(--background);
        color: var(--foreground);

        em {
            font-style: normal;
            color: var(--dark);
            background: var(--accent-yellow);
            padding: 0.1em 0.15em;
            margin-right: 0.25em;
        }

        &.pink {
            --foreground: var(--beige);
            --background: var(--pink);
        }

        &.blue {
            --background: var(--blue);
            --foreground: var(--beige);
        }

        &.brown {
            --background: var(--brown);
            --foreground: var(--beige);
        }

        &.beige {
            --background: var(--beige);
            --foreground: var(--dark);
        }

        &.yellow {
            --background: var(--yellow);
            --foreground: var(--dark);
        }

        &.light {
            --background: var(--light);
            --foreground: var(--dark);
        }

        &.dark {
            --background: var(--dark);
            --foreground: var(--light);
        }
    }
</style>
