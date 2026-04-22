<script setup>
    import {markdownToStoryblokRichtext} from "@storyblok/richtext/markdown-parser";
    import {richTextResolver} from "@storyblok/richtext";

    const props = defineProps({
        blok: {
            type: Object,
            required: true,
        },
    });

    const richtextDoc = markdownToStoryblokRichtext(props.blok.markdown);
    const richHTML = richTextResolver().render(props.blok.content);

    const markdownHTML = richTextResolver().render(richtextDoc);
</script>

<template>
    <div v-editable="blok" class="rich-html-container" v-html="richHTML"></div>
    <div v-editable="blok" class="rich-html-container" v-html="markdownHTML"></div>
</template>

<style scoped>
    .rich-html-container {
        /* Prevents empty blocks from disappearing in the editor */
        min-height: 20px;
        width: 100%;
    }
</style>
