<script setup>
    import showTypeSlugsStatic from "~/show-types-generated.json";

    const slug = useRoute().params.slug;
    let slugStr = slug && slug.length > 0 ? slug.join("/") : "home";

    // Normalize slugStr by stripping leading and trailing slashes
    slugStr = slugStr.replace(/^\/+|\/+$/g, "");
    if (!slugStr) slugStr = "home";

    const config = useRuntimeConfig();

    // In development, use the live dynamic in-memory list. In production/SSG, use the static build-time file.
    const showTypeSlugs = process.dev ? config.public.showTypeSlugs || [] : showTypeSlugsStatic;

    const isShowTypePage = showTypeSlugs.includes(slugStr);

    let story = null;
    if (!isShowTypePage) {
        ({story} = await useAsyncStoryblok(slugStr, {
            api: {
                version: process.dev ? "draft" : "published",
            },
            bridge: {},
        }));
    }

    const mockBlok = {
        component: "ShowPage",
        body: [],
    };
</script>

<template>
    <component v-if="isShowTypePage" :is="'ShowPage'" :blok="mockBlok" />
    <StoryblokComponent v-else-if="story" :blok="story.content" />
</template>
