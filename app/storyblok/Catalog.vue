<script>
    import chroma from "chroma-js";

    export default {
        props: {
            blok: Object,
        },
        data() {
            return {};
        },
        computed: {
            dateFrom: state => (state.blok.date_from || "").split(" ")[0],
            dateTo: state => (state.blok.date_to || "").split(" ")[0],
        },
    };
</script>

<template>
    <div class="show-catalog" v-editable="blok">
        {{ dateFrom }} {{ dateTo }}
    </div>
</template>

<style lang="css">
    .show-catalog {
        padding: 50px;
    }
</style>
