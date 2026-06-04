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
        color: var(--section-fg);
        background-color: var(--section-bg);
        position: relative;
        padding: 20px;

        &.swoosh {
            min-height: 0em;
        }

        &.base {
            --section-bg: var(--page-bg);
            --section-fg: var(--page-fg);
        }

        &.white {
            --section-bg: white;
            --section-fg: dark;
        }

        &.pink {
            --section-fg: var(--beige);
            --section-bg: var(--pink);
        }

        &.blue {
            --section-bg: var(--blue);
            --section-fg: var(--beige);
        }
        &.brown {
            --section-bg: var(--brown);
            --section-fg: var(--beige);
        }
        &.beige {
            --section-bg: var(--beige);
            --section-fg: var(--dark);
        }
        &.yellow {
            --section-bg: var(--yellow);
            --section-fg: var(--dark);
        }

        &.light {
            --section-bg: var(--light);
            --section-fg: var(--dark);
        }

        &.dark {
            --section-bg: var(--dark);
            --section-fg: var(--light);
        }

        &.with-confetti {
            background-image: url(/new/confetti.svg);
            background-size: 30%;
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
                background: var(--section-fg);
                color: var(--section-bg);
            }
        }

        .top-swoosh {
            position: absolute;
            left: 0;
            right: 0;
            top: -20px;
            background: var(--section-bg);
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
            background: var(--section-bg);
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
