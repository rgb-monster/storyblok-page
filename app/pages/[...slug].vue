<script setup>
    import ShowPage from "@/storyblok/ShowPage.vue";

    const slug = useRoute().params.slug;

    const {story} = await useAsyncStoryblok(slug && slug.length > 0 ? slug.join("/") : "home", {
        api: {
            version: "draft",
        },
        bridge: {},
    });

    const mockBlok = {
        component: "ShowPage",
        body: [],
    };
</script>

<template>
    <StoryblokComponent v-if="story" :blok="story.content" />
    <ShowPage v-else :blok="mockBlok" />
</template>
