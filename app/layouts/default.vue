<script setup>
    const currentYear = new Date().getFullYear();

    // Fetch show types and store in global state
    const {data: showTypes} = await useAsyncData("showTypes", () =>
        $fetch("https://storage.googleapis.com/confirmed-static-api/rgb-monster/show-types.json")
    );

    const showTypesState = useState("showTypes", () => showTypes.value);
</script>
<template>
    <slot></slot>
    <footer>
        <div class="top-swoosh" />
        <div class="container">&copy; {{ currentYear }} RGB Monster</div>
    </footer>
</template>

<style lang="css">
    footer {
        position: relative;
        background: var(--dark);
        color: var(--light);
        padding: 20px;
        text-align: center;
        font-family: var(--header-font);
        text-transform: uppercase;

        .top-swoosh {
            position: absolute;
            left: 0;
            right: 0;
            top: -10px;
            background: var(--dark);
            mask-image: url(/new/ink-swipe-top.webp);
            mask-size: cover;
            mask-position: center;
            padding: 0.7em;
            text-align: center;
            text-transform: uppercase;
            height: 30px;
            z-index: 20;
        }
    }
</style>
