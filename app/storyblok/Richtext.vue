<script setup>
    import {computed} from "vue";
    import {renderRichText} from "@storyblok/vue";

    let props = defineProps({blok: Object});
    let resolvedRichText = computed(() => {
        return renderRichText(props.blok.contents);
    });
</script>

<template>
    <div class="richtext-block" v-editable="blok" :style="{'text-align': blok.align}" v-html="resolvedRichText" />
</template>

<style lang="css">
    .richtext-block {
        p {
            padding-top: 0.5em;
            padding-bottom: 0.5em;

            &:first-child {
                padding-top: 0;
            }

            &:last-child {
                padding-bottom: 0;
            }
        }
    }
</style>
