<script>
    import chroma from "chroma-js";
    import {useStore} from "@/shows.js";

    export default {
        props: {
            blok: Object,
        },
        data() {
            return {
                store: useStore(),
                loading: true,
            };
        },
        computed: {
            dateFrom: state => (state.blok.date_from || "").split(" ")[0],
            dateTo: state => (state.blok.date_to || "").split(" ")[0],
            shows() {
                return this.store.allShows;
            },
        },

        async mounted() {
            await this.store.fetchShows();
            this.loading = false;
        },
    };
</script>

<template>
    <div class="show-catalog" v-editable="blok">{{ dateFrom }} {{ dateTo }}</div>
    <div class="shows">
        {{ shows.length }}
        <div v-for="show in shows" :key="show.id">
            {{ show.title }}
        </div>
    </div>
</template>

<style lang="css">
    .show-catalog {
        padding: 50px;
    }
</style>
