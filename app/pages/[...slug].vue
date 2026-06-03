<script setup>
    import {computed} from "vue";
    import showTypeTitlesStatic from "~/show-types-titles.json";
    import showTypeSlugsStatic from "~/show-types-generated.json";

    const slug = useRoute().params.slug;
    let slugStr = slug && slug.length > 0 ? slug.join("/") : "home";

    // Normalize slugStr by stripping leading and trailing slashes
    slugStr = slugStr.replace(/^\/+|\/+$/g, "");
    if (!slugStr) slugStr = "home";

    const config = useRuntimeConfig();

    // In development, use the live dynamic in-memory list. In production/SSG, use the static build-time file.
    const showTypeSlugs = import.meta.dev ? config.public.showTypeSlugs : showTypeSlugsStatic;
    const isShowTypePage = showTypeSlugs.includes(slugStr);

    let story = null;
    if (!isShowTypePage) {
        ({story} = await useAsyncStoryblok(slugStr, {
            api: {
                version: import.meta.dev ? "draft" : "published",
            },
        }));
    }

    // Set page title dynamically (completely synchronously on both server and client!)
    let pageTitle = "RGB Monster - An Unusual Comedy Production";
    if (isShowTypePage) {
        const title = showTypeTitlesStatic[slugStr];
        if (title) {
            pageTitle = `${title} | ${pageTitle}`;
        }
    } else if (story?.value && story.value.name && story.value.name.toLowerCase() !== "home") {
        pageTitle = `${story.value.name} | ${pageTitle}`;
    }

    useHead({
        title: pageTitle,
    });

    const mockBlok = {
        component: "ShowPage",
        body: [],
    };
</script>

<template>
    <component v-if="isShowTypePage" :is="'ShowPage'" :blok="mockBlok" />
    <StoryblokComponent v-else-if="story" :blok="story.content" />
</template>
