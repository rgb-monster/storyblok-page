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

        --accent-bg: var(--accent-yellow);
        --accent-fg: var(--dark);

        em {
            font-style: normal;
            color: var(--accent-fg);
            background: var(--accent-bg);
            padding: 0.1em 0.15em;
        }

        &.pink {
            --foreground: var(--light);
            --background: var(--pink);
        }

        &.blue {
            --background: var(--blue);
            --foreground: var(--beige);
            --accent-bg: var(--accent-pink);
            --accent-fg: var(--light);
        }

        &.brown {
            --background: var(--brown);
            --foreground: var(--beige);
        }

        &.beige {
            --background: var(--beige);
            --foreground: var(--dark);
            --accent-fg: var(--light);
            --accent-bg: var(--dark);
        }

        &.yellow {
            --background: var(--yellow);
            --foreground: var(--dark);
            --accent-fg: var(--yellow);
            --accent-bg: var(--dark);
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
