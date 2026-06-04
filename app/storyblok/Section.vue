<script setup>
    defineProps({blok: Object});
</script>

<template>
    <section class="toplevel" :class="[blok.colour, blok.swoosh ? 'swoosh' : 'no-swoosh']" v-editable="blok">
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

        &.swoosh {
            min-height: 0em;

            &::before {
                /* top swoosh */
                content: "";
                position: absolute;
                left: 0;
                right: 0;
                top: 0;
                height: 1em; /* Same height as before */
                transform: translateY(-80%);
                background: var(--section-bg);
                mask-image: url(/new/ink-swipe-top.webp);
                mask-size: cover;
                mask-position: center;
                z-index: 1; /* Make sure it's on top of previous section's content */
            }

            &::after {
                /* bottom swoosh */
                content: "";
                position: absolute;
                left: 0;
                right: 0;
                bottom: 0;
                height: 1.25em; /* Same height as before */
                transform: translateY(30%);
                background: var(--section-bg);
                mask-image: url(/new/ink-swipe-bottom.webp);
                mask-size: cover;
                mask-position: center;
                z-index: 10;
            }
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
            padding: 0.1em 0.3em;
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

        .container {
            padding: 0.625em 1.25em;
        }

        &.swoosh .container {
            padding-top: 1.5em;
            padding-bottom: 1.5em;
        }

        &.no-swoosh .container {
            padding: 1.25em;
        }

        .richtext-block {
            max-width: 45em;
            padding: 1em 0;
            margin: 0 auto;
        }
    }
</style>
