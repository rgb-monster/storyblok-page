<script>
    import { useShowPageComposable } from "@/show-page-composable.js";

    export default {
        props: {
            showDetails: Object,
        },
        setup(props) {
            const { show } = useShowPageComposable(props);
            return { show };
        },
    };
</script>

<template>
    <section class="banner">
        <main>
            <img :src="show.coverImage" />
        </main>
    </section>
</template>

<style lang="css">
    .banner {
        padding: 20px 0;
        main {
            max-width: var(--within-curtains);
            padding-bottom: 0;
        }
    }
</style>
