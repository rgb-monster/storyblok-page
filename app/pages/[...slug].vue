<script setup>
import showTypeSlugs from '~/show-types-generated.json';

const slug = useRoute().params.slug;
let slugStr = slug && slug.length > 0 ? slug.join('/') : 'home';

// Normalize slugStr by stripping leading and trailing slashes
slugStr = slugStr.replace(/^\/+|\/+$/g, '');
if (!slugStr) slugStr = 'home';

console.log('[Debug Show Types] Normalized slug:', slugStr);
console.log('[Debug Show Types] Slugs imported from JSON:', showTypeSlugs);

const isShowTypePage = showTypeSlugs.includes(slugStr);
console.log('[Debug Show Types] Is show type page?', isShowTypePage);

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
