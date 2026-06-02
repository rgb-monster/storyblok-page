<script setup>
const slug = useRoute().params.slug;
const slugStr = slug && slug.length > 0 ? slug.join('/') : 'home';

const config = useRuntimeConfig();
const showTypeSlugs = config.public.showTypeSlugs || [];
const isShowTypePage = showTypeSlugs.includes(slugStr);

let story = null;
if (!isShowTypePage) {
    ({ story } = await useAsyncStoryblok(
        slugStr,
        {
            api: {
                version: process.dev ? 'draft' : 'published',
            },
            bridge: {},
        },
    ));
}

const mockBlok = {
    component: 'ShowPage',
    body: [],
};
</script>

<template>
    <component v-if="isShowTypePage" :is="'ShowPage'" :blok="mockBlok" />
    <StoryblokComponent v-else-if="story" :blok="story.content" />
</template>
