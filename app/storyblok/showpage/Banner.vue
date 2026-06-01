<script>
    import ShowPageComponent from "./_show-page-component.vue";

    export default {
        extends: ShowPageComponent,
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
