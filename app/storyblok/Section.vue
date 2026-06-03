<script setup>
    defineProps({blok: Object});
</script>

<template>
    <section class="toplevel" :class="[blok.colour, blok.swoosh ? 'swoosh' : 'no-swoosh']" v-editable="blok">
        <div class="top-swoosh" v-if="blok.swoosh" />
        <div class="bottom-swoosh" v-if="blok.swoosh" />
        <div class="container" :style="{'text-align': blok.align}">
            <StoryblokComponent v-for="currentBlok in blok.contents" :key="currentBlok._uid" :blok="currentBlok" />
            <slot />
        </div>
    </section>
</template>

<style lang="css">
    section.toplevel {
        color: var(--foreground);
        background: var(--background);
        position: relative;
        padding: 20px;

        &.swoosh {
            min-height: 0em;
        }

        &.base {
            --background: var(--base);
            --foreground: var(--dark);
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

        a {
            font-weight: 600;
            padding: 2px 5px;
            background: var(--accent-yellow);
            color: var(--dark);

            transition:
                background 200ms ease,
                color 200ms ease;

            &:hover {
                background: var(--foreground);
                color: var(--background);
            }
        }

        .top-swoosh {
            position: absolute;
            left: 0;
            right: 0;
            top: -20px;
            background: var(--background);
            mask-image: url(/new/ink-swipe-top.webp);
            mask-size: cover;
            mask-position: center;
            font-family: var(--header-font);
            padding: 0.7em;
            text-align: center;
            text-transform: uppercase;
            height: 30px;
        }

        .bottom-swoosh {
            position: absolute;
            left: 0;
            right: 0;
            bottom: -10px;
            background: var(--background);
            mask-image: url(/new/ink-swipe-bottom.webp);
            mask-size: cover;
            mask-position: center;
            font-family: var(--header-font);
            padding: 0.7em;
            text-align: center;
            text-transform: uppercase;
            height: 30px;
            z-index: 10;
        }

        .container {
            padding-top: 10px;
        }

        &.no-swoosh .container {
            padding: 20px 0;
        }

        .richtext-block {
            padding: 2em 5em;
            max-width: 50em;
            margin: 0 auto;
        }
    }
</style>
