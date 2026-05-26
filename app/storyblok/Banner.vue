<script>
    import {useStore} from "@/shows.js";

    export default {
        props: {
            blok: Object,
        },
        data() {
            return {
                store: useStore(),
            };
        },

        computed: {
            show: state => state.store.showTypesByID[state.blok.show_type] || {},
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
    }
</style>
