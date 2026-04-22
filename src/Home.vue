<script setup>
import { useStoryblok } from '@storyblok/vue';

const story = await useStoryblok('home', {
});
</script>

<template>
  humss
  <StoryblokComponent v-if="story" :blok="story.content" />
</template>